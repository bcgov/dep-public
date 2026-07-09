"""Service for comment management."""
import itertools

from api.constants.comment_status import Status
from api.constants.membership_type import MembershipType
from api.constants.export_comments import RejectionReason
from api.models import Survey as SurveyModel
from api.models.comment import Comment
from api.models.membership import Membership as MembershipModel
from api.models.pagination_options import PaginationOptions
from api.models.submission import Submission as SubmissionModel
from api.models.staff_user import StaffUser as StaffUserModel
from api.schemas.comment import CommentSchema
from api.schemas.submission import SubmissionSchema
from api.schemas.survey import SurveySchema
from api.services import authorization
from api.services.document_generation_service import DocumentGenerationService
from api.utils.roles import Role
from api.utils.token_info import TokenInfo
from api.utils.enums import GeneratedDocumentTypes, MembershipStatus


class CommentService:
    """Comment management service."""

    otherdateformat = '%Y-%m-%d'

    wizard_display = 'wizard'
    form_display = 'form'

    @staticmethod
    def get_comment(comment_id) -> CommentSchema:
        """Get Comment by the id."""
        comment = Comment.find_by_id(comment_id)
        comment_schema = CommentSchema()
        return comment_schema.dump(comment)

    @staticmethod
    def get_comments_by_submission(submission_id) -> CommentSchema:
        """Get Comment by the id."""
        comments = Comment.get_by_submission(submission_id)
        submission = SubmissionModel.find_by_id(submission_id)
        if submission.comment_status_id != Status.Approved.value:
            can_view_unapproved_comments = CommentService.can_view_unapproved_comments(submission.survey_id)
            if not can_view_unapproved_comments:
                return {}
        comment_schema = CommentSchema(many=True)
        return comment_schema.dump(comments)

    @staticmethod
    def can_view_unapproved_comments(survey_id: int) -> bool:
        """Return if the current user can see the comments in the survey."""
        if not survey_id:
            return False

        user_roles = TokenInfo.get_user_roles()
        for approved_role in [Role.REVIEW_ALL_COMMENTS.value, Role.SUPER_ADMIN.value]:
            if approved_role in user_roles:
                return True

        engagement = SurveyModel.find_by_id(survey_id)
        if not engagement:
            return False

        if not (user_id := TokenInfo.get_id()):
            return False

        user = StaffUserModel.get_user_by_external_id(user_id)
        if user:
            membership = MembershipModel.find_by_engagement_and_user_id(
                engagement.engagement_id,
                user.id,
                status=MembershipStatus.ACTIVE.value
            )
            if membership:
                return membership.type == MembershipType.TEAM_MEMBER

        return False

    @classmethod
    def get_comments_paginated(cls, survey_id, pagination_options: PaginationOptions, search_text=''):
        """Get comments paginated."""
        include_unpublished = CommentService.can_view_unapproved_comments(survey_id)

        comment_schema = CommentSchema(many=True, only=('text', 'submission_date', 'label', 'submission_id'))
        items, total = Comment.get_accepted_comments_by_survey_id_paginated(
            survey_id, pagination_options, search_text, include_unpublished)
        return {
            'items': comment_schema.dump(items),
            'total': total
        }

    @classmethod
    def create_comments(cls, comments: list, session):
        """Create comment."""
        for comment in comments:
            cls.validate_fields(comment)

        return Comment.add_all_comments(comments, session)

    @staticmethod
    def validate_fields(data):
        """Validate all fields."""
        # Will empty text return False
        empty_fields = [not data[field] for field in ['text', 'survey_id', 'participant_id']]

        if any(empty_fields):
            raise ValueError('Some required fields for comments are missing')

    @staticmethod
    def __form_comment(component_id, comment_text, survey_submission: SubmissionSchema, survey: SurveySchema):
        """Create a comment dict."""
        return {
            'component_id': component_id,
            'text': comment_text,
            'survey_id': survey.get('id', None),
            'participant_id': survey_submission.get('participant_id', None),
            'submission_id': survey_submission.get('id', None)
        }

    @classmethod
    def extract_components(cls, survey_form: dict):
        """Extract components from survey form."""
        components = list(survey_form.get('components', []))

        is_comments_from_form_survey = survey_form.get('display') == cls.form_display
        if is_comments_from_form_survey:
            return components

        is_comments_from_wizard_survey = survey_form.get('display') == cls.wizard_display
        if is_comments_from_wizard_survey:
            return list(itertools.chain.from_iterable([page.get('components', []) for page in components]))
        return []

    @classmethod
    def extract_comments_from_survey(cls, survey_submission: SubmissionSchema, survey: SurveySchema):
        """Extract comments from survey submission."""
        survey_form = survey.get('form_json', {})
        components = cls.extract_components(survey_form)
        if len(components) == 0:
            return []
        # get the 'id' for each component that has 'inputType' text and filter out the rest.
        text_component_keys = [
            component.get('key', None) for component in components
            if component.get('inputType', None) == 'text']
        submission = survey_submission.get('submission_json', {})
        comments = [cls.__form_comment(key, submission.get(key, ''), survey_submission, survey)
                    for key in text_component_keys if submission.get(key, '') != '']
        return comments

    @classmethod
    def export_comments_to_spread_sheet_staff(cls, survey_id):
        """Export comments to spread sheet."""
        survey = SurveyModel.find_by_id(survey_id)
        comments = Comment.get_comments_by_survey_id(survey_id)
        # TODO: Uncomment depending on future metadata work
        # metadata_model = EngagementMetadataModel.find_by_id(survey.engagement_id)

        titles = cls.get_titles(survey)
        data_rows = cls.get_data_rows(titles, comments, None)

        formatted_comments = {
            'titles': titles,
            'comments': data_rows
        }
        document_options = {
            'document_type': GeneratedDocumentTypes.COMMENT_SHEET_STAFF.value,
            'template_name': 'staff_comments_sheet.xlsx',
            'convert_to': 'csv',
            'report_name': 'comments_sheet'
        }
        return DocumentGenerationService().generate_document(data=formatted_comments, options=document_options)

    @classmethod
    def get_titles(cls, survey: SurveySchema):
        """Get the titles to be displayed on the sheet."""
        # Title could be dynamic based on the number of comment type questions on the survey
        survey_form = survey.form_json
        labels = []
        components = cls.extract_components(survey_form)
        if len(components) == 0:
            return []
        for component in components:
            if component.get('inputType', None) == 'text':
                if 'label' in component:
                    labels.append(component['label'])

        return [{'label': label} for label in labels if label is not None]

    @classmethod
    def get_data_rows(cls, titles, comments, project_name):
        """Get the content to be exported on to the sheet."""
        data_rows = []

        for comment in comments:
            comment_text = cls.get_comment_text(titles, comment)

            rejection_note = cls.get_rejection_note(comment)

            data_rows.append({
                'commentNumber': comment.get('id'),
                'dateSubmitted': str(comment.get('created_date')),
                'commentText': comment_text,
                'status': Status(comment.get('comment_status_id')).name,
                'datePublished': str(comment.get('review_date')),
                'rejectionNote': rejection_note,
                'reviewer': comment.get('reviewed_by'),
                'projectName': project_name
            })

        return data_rows

    @classmethod
    def get_comment_text(cls, titles, comment):
        """Get the comments to be exported to the sheet."""
        # Making sure that the number of comments matches the number of questions on the comment to keep
        # the layout intact. In case user has not responded to a question the column value should be
        # blank.
        comment_dict = {item['label']: {'text': ''} for item in titles}

        for item in comment['comments']:
            label = item['label']
            if label in comment_dict:
                comment_dict[label]['text'] = item['text']

        comments = [comment_dict[item['label']] for item in titles]

        return comments

    @classmethod
    def get_rejection_note(cls, comment):
        """Get the rejection note."""
        rejection_note = []

        if comment.get('has_personal_info'):
            rejection_note.append(RejectionReason.has_personal_info.value)
        if comment.get('has_profanity'):
            rejection_note.append(RejectionReason.has_profanity.value)
        if comment.get('has_threat'):
            rejection_note.append(RejectionReason.has_threat.value)
        if comment.get('rejected_reason_other'):
            rejection_note.append(comment.get('rejected_reason_other'))

        return ', '.join(rejection_note)

    @classmethod
    def export_comments_to_spread_sheet_proponent(cls, survey_id):
        """Export comments to spread sheet."""
        survey = SurveyModel.find_by_id(survey_id)
        one_of_roles = (
            MembershipType.TEAM_MEMBER.name,
            Role.EXPORT_ALL_TO_CSV.value
        )
        authorization.check_auth(one_of_roles=one_of_roles, engagement_id=survey.engagement_id)
        comments = Comment.get_public_viewable_comments_by_survey_id(survey_id)
        formatted_comments = cls.format_comments(comments)
        document_options = {
            'document_type': GeneratedDocumentTypes.COMMENT_SHEET_PROPONENT.value,
            'template_name': 'proponent_comments_sheet.xlsx',
            'convert_to': 'xlsx',
            'report_name': 'proponent_comments_sheet'
        }
        return DocumentGenerationService().generate_document(data=formatted_comments, options=document_options)

    @classmethod
    def group_comments_by_submission_id(cls, comments):
        """Group the comments together, arranging them in the same order as the titles."""
        grouped_comments = []
        for comment in comments:
            submission_id = comment['submission_id']
            # Get the text, or an empty string if it's missing
            text = comment.get('text', '')
            label = comment['label']

            # Check if a group with the same submission ID already exists
            existing_group = next((group for group in grouped_comments
                                   if group['submission_id'] == submission_id), None)

            if existing_group:
                # Add the new comment
                existing_group['commentText'].append({'text': text, 'label': label})
            else:
                new_group = {'submission_id': submission_id, 'commentText': [{'text': text, 'label': label}]}
                grouped_comments.append(new_group)

        return grouped_comments

    @classmethod
    def get_visible_titles(cls, survey, comments):
        """Add unique labels to titles list in order of appearance."""
        visible_titles = []
        for comment in comments:
            label = comment['label']
            if label not in [title['label'] for title in visible_titles]:
                visible_titles.append({'label': label})

        return [title for title in cls.get_titles(survey) if title in visible_titles]

    @classmethod
    def sort_comments_by_titles(cls, titles, grouped_comments):
        """Sort commentText within each group based on the order of titles."""
        for group in grouped_comments:
            sorted_comment_text = []
            for title in titles:
                label = title['label']
                matching_comments = [comment for comment in group['commentText'] if comment['label'] == label]
                if not matching_comments:
                    sorted_comment_text.append({'text': '', 'label': label})
                else:
                    sorted_comment_text.extend(matching_comments)
            group['commentText'] = sorted_comment_text

        return grouped_comments

    @classmethod
    def format_comments(cls, comments):
        """Format comments."""
        # Create a dictionary to store comments grouped by labels
        comments_by_label = {}

        # Create a list to store unique titles in order of appearance
        unique_titles = []

        # Iterate over the input data
        for comment in comments:
            # Get the submission_id, or an empty string if it's missing
            submission_id = comment.get('submission_id', '')
            label = comment['label']
            text = comment.get('text', '')  # Get the text, or an empty string if it's missing

            # If the label is not already in unique_titles, add it
            if label not in unique_titles:
                unique_titles.append(label)

            # If label is not in comments_by_label, create an empty list for it
            if label not in comments_by_label:
                comments_by_label[label] = []

            # Append the comment to the corresponding label in comments_by_label
            comments_by_label[label].append({'text': text, 'submission_id': submission_id})

        # Create a list of titles with label information in order of appearance
        titles = [{'label': title, 'proponent_answers': 'Proponent Answer'} for title in unique_titles]

        # Create a list of comments organized by label order
        formatted_comments = []
        row_id = 1

        # Iterate over each row_id until there are no more comments
        while any(comments_by_label.get(title['label']) for title in titles):
            comment_row = {'row_id': row_id, 'commentText': []}

            for title in titles:
                label = title['label']
                label_comments = comments_by_label.get(label, [{'text': '', 'submission_id': ''}])
                # If there are comments for this label, pop the first one
                if label_comments:
                    comment_text = label_comments.pop(0)
                else:
                    # If there are no comments for this label, use a default empty text
                    comment_text = {'text': '', 'submission_id': ''}

                comment_row['commentText'].append(comment_text)

            # Append the comment row to the list of comments
            formatted_comments.append(comment_row)
            row_id += 1

        # Create the final output structure
        return {'titles': titles, 'comments': formatted_comments}
