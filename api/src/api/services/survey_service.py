"""Service for survey management."""
from http.client import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from typing import List

from api.constants.engagement_status import Status
from api.constants.membership_type import MembershipType
from api.models import Engagement as EngagementModel
from api.models import Survey as SurveyModel
from api.models.db import db, transactional
from api.models.pagination_options import PaginationOptions
from api.models.report_setting import ReportSetting
from api.models.survey_search_options import SurveySearchOptions
from api.models.survey_translation import SurveyTranslation
from api.schemas.engagement import EngagementSchema
from api.schemas.survey import SurveySchema
from api.services import authorization
from api.services.membership_service import MembershipService
from api.services.object_storage_service import ObjectStorageService
from api.services.report_setting_service import ReportSettingService
from api.utils.roles import Role


class SurveyService:
    """Survey management service."""

    otherdateformat = '%Y-%m-%d'
    formio_survey_default_display = 'form'

    @classmethod
    def get(cls, survey_id):
        """Get a survey by its ID."""
        survey_model = SurveyModel.find_by_id(survey_id)
        eng_id = None
        one_of_roles = (Role.VIEW_SURVEYS.value,)
        skip_auth = False

        if survey_model.is_hidden:
            # Only Admins can view hidden surveys.
            one_of_roles = (Role.VIEW_ALL_SURVEYS.value,)
        elif survey_model.engagement_id:
            engagement_model = EngagementModel.find_by_id(
                survey_model.engagement_id)
            if engagement_model:
                eng_id = engagement_model.id
                if engagement_model.status_id == Status.Published.value:
                    # Published Engagement anyone can access.
                    skip_auth = True
                else:
                    one_of_roles = (
                        MembershipType.TEAM_MEMBER.name,
                        MembershipType.REVIEWER.name,
                        Role.VIEW_SURVEYS.value
                    )

        if not skip_auth:
            authorization.check_auth(
                one_of_roles=one_of_roles, engagement_id=eng_id)

        survey = SurveySchema().dump(survey_model)
        return survey

    @classmethod
    def get_open(cls, survey_id):
        """Get a survey by its ID and ensure it is open for public access."""
        survey_model = SurveyModel.get_open(survey_id)
        engagement_model: EngagementModel = EngagementModel.find_by_id(
            survey_model.engagement_id)
        survey = SurveySchema().dump(survey_model)
        eng = EngagementSchema().dump(engagement_model)
        eng['banner_url'] = ObjectStorageService().get_url(
            engagement_model.banner_filename)
        survey['engagement'] = eng
        return survey

    @staticmethod
    def get_surveys_paginated(user_id, pagination_options: PaginationOptions, search_options: SurveySearchOptions):
        """Get a paginated list of surveys."""
        # check if user has view all surveys access to view hidden surveys as well
        can_view_all_surveys = SurveyService._can_view_all_surveys()
        print("Can view all surveys?", can_view_all_surveys)

        if not can_view_all_surveys:
            search_options.exclude_hidden = True

        search_options.assigned_engagements = SurveyService._get_assigned_engagements(
            user_id)

        # check if user can view surveys linked to unassigned engagement
        search_options.can_view_all_engagements = SurveyService._can_view_all_engagements()

        items, total = SurveyModel.get_surveys_paginated(
            pagination_options,
            search_options,
        )
        surveys_schema = SurveySchema(many=True)

        return {
            'items': surveys_schema.dump(items),
            'total': total
        }

    @staticmethod
    def _get_assigned_engagements(user_id):
        if not authorization.check_auth(one_of_roles=[
            Role.VIEW_PRIVATE_ENGAGEMENTS.value
        ], abort=False):
            empty_list: List[int] = []
            return empty_list
        memberships = MembershipService.get_assigned_engagements(user_id)
        return [int(membership.engagement_id) for membership in memberships]

    @staticmethod
    def _can_view_all_engagements():
        return authorization.check_auth(one_of_roles=[
            Role.VIEW_ENGAGEMENT.value
        ], abort=False)

    @staticmethod
    def _can_view_all_surveys():
        """Return false if user does not have access to view all hidden surveys."""
        return authorization.check_auth(one_of_roles=[
            Role.VIEW_ALL_SURVEYS.value
        ], abort=False)

    @classmethod
    def create(cls, survey_data: dict):
        """Create survey."""
        cls.validate_create_fields(survey_data)

        return SurveyModel.create_survey({
            'name': survey_data.get('name'),
            'form_json': {
                'display': survey_data.get('display', cls.formio_survey_default_display),
                'components': [],
            },
            'engagement_id': survey_data.get('engagement_id', None),
        })

    @classmethod
    def clone(cls, data, survey_id):
        """Clone survey."""
        survey_to_clone = cls.get(survey_id)

        if not survey_to_clone:
            raise KeyError('Survey to clone was not found')
        eng_id = None
        if engagement_id := data.get('engagement_id', None):
            engagement_model = EngagementModel.find_by_id(engagement_id)
            eng_id = getattr(engagement_model, 'id', None)

        authorization.check_auth(one_of_roles=(MembershipType.TEAM_MEMBER.name,
                                               Role.CLONE_SURVEY.value), engagement_id=eng_id)

        cloned_survey = SurveyModel.create_survey({
            'name': data.get('name'),
            'form_json': survey_to_clone.get('form_json'),
            'engagement_id': data.get('engagement_id', None),
        })

        cls.create_report_setting(survey_to_clone.get('id'), cloned_survey.id)

        return cloned_survey

    @classmethod
    @transactional()
    def create_report_setting(cls, survey_id, cloned_survey_id):
        """Create report setting."""
        report_settings = ReportSetting.find_by_survey_id(survey_id)
        new_report_setting = ReportSetting.add_all_report_settings(
            cloned_survey_id, report_settings, db.session)
        return new_report_setting

    @classmethod
    def update(cls, data: SurveySchema):
        """Update survey."""
        cls.validate_update_fields(data)
        survey = cls.get(data.get('id', None))
        engagement = survey.get('engagement', None)
        engagement_id = survey.get('engagement_id', None)

        authorization.check_auth(one_of_roles=(MembershipType.TEAM_MEMBER.name,
                                               Role.EDIT_SURVEY.value), engagement_id=engagement_id)

        # check if user has edit all surveys access to edit template surveys as well

        is_template = survey.get('is_template', None)
        cls.validate_template_surveys_edit_access(is_template)

        if engagement and engagement.get('status_id', None) not in [
            Status.Draft.value,
            Status.Published.value,
            Status.Unpublished.value,
            Status.Scheduled.value
        ]:
            raise ValueError('Engagement already published')

        updated_survey = SurveyModel.update_survey(data)
        ReportSettingService.refresh_report_setting({
            'id': updated_survey.id,
            'form_json': updated_survey.form_json,
        })

        return updated_survey

    @staticmethod
    def validate_update_fields(data):
        """Validate all fields."""

        if any(not data[field] for field in ['id']):
            raise ValueError('Some required fields are empty')

    @staticmethod
    def validate_template_surveys_edit_access(is_template):
        """Validate user has edit access on a template survey."""
        if is_template:
            authorization.check_auth(
                one_of_roles=[Role.EDIT_ALL_SURVEYS.value])

    @staticmethod
    def validate_create_fields(data):
        """Validate all fields."""
        if any(not data[field] for field in ['name', 'display']):
            raise ValueError('Some required fields are empty')

    @classmethod
    def link(cls, survey_id, engagement_id):
        """Update survey."""
        cls.validate_link_fields(survey_id, engagement_id)
        authorization.check_auth(one_of_roles=(MembershipType.TEAM_MEMBER.name,
                                               Role.EDIT_SURVEY.value), engagement_id=engagement_id)
        return SurveyModel.link_survey(survey_id, engagement_id)

    @classmethod
    def validate_link_fields(cls, survey_id, engagement_id):
        """Validate all fields."""
        if any(not value for value in [survey_id, engagement_id]):
            raise ValueError(
                'Necessary fields for linking survey to an engagement were missing')

        survey = cls.get(survey_id)

        if not survey:
            raise ValueError('Could not find survey ' + str(survey_id))

        if survey.get('engagement', None):
            raise ValueError('Survey is already linked to an engagement')

    @classmethod
    def unlink(cls, survey_id, engagement_id):
        """Unlink survey."""
        cls.validate_unlink_fields(survey_id, engagement_id)
        authorization.check_auth(one_of_roles=(MembershipType.TEAM_MEMBER.name,
                                               Role.EDIT_SURVEY.value), engagement_id=engagement_id)
        return SurveyModel.unlink_survey(survey_id)

    @classmethod
    def validate_unlink_fields(cls, survey_id, engagement_id):
        """Validate all fields for unlinking survey."""
        if any(not value for value in [survey_id, engagement_id]):
            raise ValueError(
                'Necessary fields for unlinking survey to an engagement were missing')

        survey = cls.get(survey_id)

        if not survey:
            raise ValueError('Could not find survey ' + str(survey_id))

        linked_engagement = survey.get('engagement', None)
        if not linked_engagement or linked_engagement.get('id') != int(engagement_id):
            raise ValueError(
                'Survey is not linked to engagement ' + str(engagement_id))

        engagement_status = linked_engagement.get('engagement_status')
        if engagement_status.get('id') != Status.Draft.value:
            raise ValueError(
                'Cannot unlink survey from engagement with status ' + engagement_status.get('status_name'))

    @classmethod
    def delete(cls, survey_id: int):
        """Delete an existing survey and its translations."""
        one_of_roles = (Role.SUPER_ADMIN.value, Role.EDIT_ALL_SURVEYS.value)
        authorization.check_auth(one_of_roles=one_of_roles)

        survey = SurveyModel.find_by_id(survey_id)
        if not survey:
            raise ValueError('Survey not found')

        try:
            SurveyService._verify_linked_engagement_status(
                survey.engagement_id)
            for tx in (SurveyTranslation.get_survey_translation_list_by_survey_id(survey_id) or []):
                SurveyTranslation.delete_survey_translation(tx.id)

            deleted = SurveyModel.delete_survey(survey_id)

        except ValueError as exc:
            raise ValueError(str(exc)) from exc
        except SQLAlchemyError as e:
            raise RuntimeError('Database error while deleting survey') from e
        return {'id': deleted.id if hasattr(deleted, 'id') else survey_id}

    @staticmethod
    def _verify_linked_engagement_status(engagement_id):
        """Verify that the engagement exists and check if it is published."""
        if engagement_id:
            engagement = EngagementModel.find_by_id(engagement_id)
            if not engagement:
                raise ValueError('Linked engagement not found')
            if engagement.status_id == Status.Published.value:
                raise ValueError(
                    'Cannot delete a survey that is linked to a published engagement')
