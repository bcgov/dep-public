"""Service for engagement management."""

import os
from datetime import datetime, timezone
from http import HTTPStatus
from typing import Mapping, Optional, Sequence, Union

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload
from flask import current_app, has_app_context
from flask_restx import abort
from marshmallow import ValidationError

from api.constants.engagement_status import Status
from api.constants.membership_type import MembershipType
from api.exceptions.business_exception import BusinessException
from api.models import Tenant as TenantModel
from api.models.engagement import Engagement as EngagementModel
from api.models.engagement_scope_options import EngagementScopeOptions
from api.models.engagement_slug import EngagementSlug as EngagementSlugModel
from api.models.engagement_status_block import EngagementStatusBlock as EngagementStatusBlockModel
from api.models.engagement_translation import EngagementTranslation
from api.models.survey import Survey as SurveyModel
from api.models.suggested_engagement import SuggestedEngagement as SuggestedEngagementModel
from api.models.pagination_options import PaginationOptions
from api.models.submission import Submission as SubmissionModel
from api.models.db import db
from api.schemas.engagement import EngagementSchema
from api.schemas.suggested_engagement import SuggestedEngagementSyncItemSchema
from api.services import authorization
from api.services.engagement_settings_service import EngagementSettingsService
from api.services.engagement_slug_service import EngagementSlugService
from api.services.object_storage_service import ObjectStorageService
from api.services.project_service import ProjectService
from api.utils import email_util, notification
from api.utils.enums import SourceAction, SourceType
from api.utils.roles import Role
from api.utils.template import Template
from api.utils.token_info import TokenInfo


class EngagementService:
    """Engagement management service."""

    otherdateformat = '%Y-%m-%d'
    JSONScalar = Union[str, int, float, bool, None]
    JSONValue = Union[
        JSONScalar,
        Sequence['JSONValue'],          # e.g., list/tuple of JSONValue
        Mapping[str, 'JSONValue'],      # e.g., dict[str, JSONValue]
    ]

    EngagementDump = Mapping[str, JSONValue]

    def __init__(self):
        """Initialize."""
        self.object_storage = ObjectStorageService()

    def get_engagement(self, engagement_id) -> Optional[EngagementDump]:
        """Get Engagement by the id."""
        engagement_model: EngagementModel = (
            EngagementModel.query
            .options(
                selectinload(EngagementModel.suggested_engagement_links)
                .selectinload(SuggestedEngagementModel.suggested_engagement)
            )
            .filter_by(id=engagement_id)
            .one_or_none()
        )

        if engagement_model:
            if TokenInfo.get_id() is None and engagement_model.status_id not in (
                Status.Published.value,
                Status.Closed.value,
            ):
                # Non authenticated users only have access to published and closed engagements
                return None
            if engagement_model.status_id in (
                Status.Draft.value,
                Status.Scheduled.value,
            ):
                one_of_roles = (
                    MembershipType.TEAM_MEMBER.name,
                    MembershipType.REVIEWER.name,
                    Role.VIEW_ALL_ENGAGEMENTS.value,
                )
                authorization.check_auth(
                    one_of_roles=one_of_roles, engagement_id=engagement_id
                )

            engagement = EngagementSchema().dump(engagement_model)
            engagement['banner_url'] = self.object_storage.get_url(
                engagement['banner_filename']
            )
            return engagement
        return None

    def get_engagements_paginated(
        self,
        external_user_id,
        pagination_options: PaginationOptions,
        search_options=None,
        include_banner_url=False,
    ):
        """Get engagements paginated."""
        user_roles = TokenInfo.get_user_roles()
        has_team_access = search_options.get('has_team_access')
        scope_options = self._get_scope_options(user_roles, has_team_access)

        items, total = EngagementModel.get_engagements_paginated(
            external_user_id,
            pagination_options,
            scope_options,
            search_options,
        )
        engagements_schema = EngagementSchema(many=True)
        engagements = engagements_schema.dump(items)

        if include_banner_url:
            engagements = self._attach_banner_url(engagements)
        return {'items': engagements, 'total': total}

    def _attach_banner_url(self, engagements: list):
        for engagement in engagements:
            engagement['banner_url'] = self.object_storage.get_url(
                engagement['banner_filename']
            )
        return engagements

    @staticmethod
    def _get_scope_options(user_roles, has_team_access):
        if Role.SUPER_ADMIN.value in user_roles or Role.VIEW_PRIVATE_ENGAGEMENTS.value in user_roles:
            # Super admins should always see all engagements within the current tenant.
            # If user has VIEW_PRIVATE_ENGAGEMENTS, e.g. Administrator role, return unrestricted scope options
            return EngagementScopeOptions(restricted=False)
        if has_team_access:
            # return those engagements where user has access for edit members..
            # either they have edit_member role or check if they are a team member
            if Role.EDIT_MEMBERS.value in user_roles:
                return EngagementScopeOptions(restricted=False)
            # check if user
            return EngagementScopeOptions(include_assigned=True)
        if Role.VIEW_ENGAGEMENT.value in user_roles:
            # If user has VIEW_ENGAGEMENT role, e.g. TEAM MEMBER, return scope options to include assigned
            # engagements and public engagements
            return EngagementScopeOptions(
                engagement_status_ids=[Status.Published.value, Status.Closed.value],
                include_assigned=True,
            )
        if Role.VIEW_ASSIGNED_ENGAGEMENTS.value in user_roles:
            # If user has VIEW_ASSIGNED_ENGAGEMENTS role, e.g. REVIEWER, return scope options to include only
            # assigned engagements
            return EngagementScopeOptions(include_assigned=True)

        # Default scope options for users without specific roles e.g. public users
        return EngagementScopeOptions(
            engagement_status_ids=[Status.Published.value, Status.Closed.value]
        )

    @staticmethod
    def close_engagements_due():
        """Close published engagements that are due for a closeout."""
        engagements = EngagementModel.close_engagements_due()
        results = [
            EngagementService._send_closeout_emails(engagement)
            for engagement in engagements
        ]
        return results

    @staticmethod
    def publish_scheduled_engagements():
        """Publish scheduled engagement due."""
        engagements = EngagementModel.publish_scheduled_engagements_due()

        if not engagements:
            current_app.logger.info('There are no engagements scheduled for publication')
            return None

        current_app.logger.info('Engagements published: %s', engagements)
        for engagement in engagements:
            email_util.publish_to_email_queue(
                SourceType.ENGAGEMENT.value,
                engagement.id,
                SourceAction.PUBLISHED.value,
                True,
            )
            current_app.logger.info('Engagement published added to email queue: %s', engagement.id)
        return engagements

    @staticmethod
    def create_engagement(request_json: dict):
        """Create engagement."""
        # TODO add schema and remove this validation
        EngagementService.validate_fields(request_json)
        eng_model = EngagementService._create_engagement_model(request_json)

        if request_json.get('status_block'):
            EngagementService._create_eng_status_block(eng_model.id, request_json)
        eng_model.commit()
        email_util.publish_to_email_queue(
            SourceType.ENGAGEMENT.value, eng_model.id, SourceAction.CREATED.value, True
        )
        EngagementSlugService.create_engagement_slug(eng_model.id)
        EngagementSettingsService.create_default_settings(eng_model.id)
        return eng_model.find_by_id(eng_model.id)

    @staticmethod
    def _create_engagement_model(engagement_data: dict) -> EngagementModel:
        """Save engagement."""
        new_engagement = EngagementModel(
            name=engagement_data.get('name', None),
            description=engagement_data.get('description', None),
            rich_description=engagement_data.get('rich_description', None),
            description_title=engagement_data.get('description_title', None),
            start_date=engagement_data.get('start_date', None),
            end_date=engagement_data.get('end_date', None),
            status_id=Status.Draft.value,
            created_by=engagement_data.get('created_by', None),
            created_date=datetime.utcnow(),
            updated_by=engagement_data.get('updated_by', None),
            updated_date=None,
            published_date=None,
            scheduled_date=None,
            banner_filename=engagement_data.get('banner_filename', None),
            is_internal=engagement_data.get('is_internal', False),
            consent_message=engagement_data.get('consent_message', None),
            subscribe_section_heading=engagement_data.get('subscribe_section_heading', None),
            subscribe_section_description=engagement_data.get('subscribe_section_description', None),
            subscribe_consent_message=engagement_data.get(
                'subscribe_consent_message',
                engagement_data.get('subscribe_consent', None)
            ),
            sponsor_name=engagement_data.get('sponsor_name', None),
            feedback_heading=engagement_data.get('feedback_heading', None),
            feedback_body=engagement_data.get('feedback_body', None),
            selected_survey_id=engagement_data.get('selected_survey_id', None),
            more_engagements_heading=engagement_data.get('more_engagements_heading', None)
        )
        new_engagement.save()
        return new_engagement

    @staticmethod
    def _create_eng_status_block(eng_id, engagement_data: dict):
        """Save engagement."""
        status_blocks = []
        for status in engagement_data.get('status_block'):
            new_status_block: EngagementStatusBlockModel = EngagementStatusBlockModel(
                engagement_id=eng_id,
                survey_status=status.get('survey_status'),
                block_text=status.get('block_text'),
            )
            status_blocks.append(new_status_block)

        new_status_block.save_status_blocks(status_blocks)

    @staticmethod
    def _save_or_update_eng_block(engagement_id, status_block):
        for survey_block in status_block:
            # Check for an existing status block with the same survey status
            survey_status = survey_block.get('survey_status')
            survey_block_text = survey_block.get('block_text')
            status_block: EngagementStatusBlockModel = (
                EngagementStatusBlockModel.get_by_status(engagement_id, survey_status)
            )
            # If the status block exists, update it. Otherwise, create a new one.
            if status_block:
                status_block.block_text = survey_block_text
                status_block.button_text = survey_block.get('button_text')
                status_block.link_type = survey_block.get('link_type')
                status_block.internal_link = survey_block.get('internal_link')
                status_block.external_link = survey_block.get('external_link')
                status_block.commit()
            else:
                new_status_block: EngagementStatusBlockModel = (
                    EngagementStatusBlockModel(
                        engagement_id=engagement_id,
                        survey_status=survey_status,
                        block_text=survey_block_text,
                        button_text=survey_block.get('button_text'),
                        link_type=survey_block.get('link_type'),
                        internal_link=survey_block.get('internal_link'),
                        external_link=survey_block.get('external_link'),
                    )
                )

                new_status_block.save()

    @staticmethod
    def _save_or_update_surveys(engagement_id, surveys):
        for survey in surveys:
            # Check for an existing status block with the same survey status
            survey_block: SurveyModel = (
                SurveyModel.find_by_id(survey.get('id'))
            )
            # If the status block exists, update it. Otherwise, create a new one.
            if survey_block:
                survey_block.engagement_id = engagement_id
                survey_block.commit()
            else:
                new_survey_block: SurveyModel = (
                    SurveyModel(
                        name=survey.get('name', None),
                        form_json=survey.get('form_json', None),
                        engagement_id=engagement_id,
                        is_hidden=survey.get('is_hidden', False),
                        is_template=survey.get('is_template', False),
                        generate_dashboard=survey.get('generate_dashboard', True),
                    )
                )

                new_survey_block.save()

    @staticmethod
    def _validate_engagement_edit_data(engagement: EngagementModel, data: dict):
        draft_status_restricted_changes = (EngagementModel.is_internal.key,)
        engagement_has_been_opened = engagement.status_id != Status.Draft.value
        if engagement_has_been_opened and any(
            field in data for field in draft_status_restricted_changes
        ):
            raise ValueError(
                'Some fields cannot be updated after the engagement has been published'
            )

    @staticmethod
    def _validate_and_assign_survey(survey_id: int, engagement_id: int):
        if survey_id == -1:
            return None
        if isinstance(survey_id, int) and survey_id > 0:
            survey = SurveyModel.get_survey(survey_id)
            if not survey:
                raise ValueError('selected survey does not exist')

            if survey.engagement_id != engagement_id:
                raise ValueError('selected survey does not belong to this engagement')

        return survey_id

    @staticmethod
    def _update_external_engagement_data(
        eng_id: int,
        status_block: object,
        surveys: object,
        epic_fields,
        new_eng: EngagementModel
    ):
        if epic_fields:
            ProjectService.update_project_info(new_eng.id)

        if status_block:
            EngagementService._save_or_update_eng_block(eng_id, status_block)

        if surveys:
            EngagementService._save_or_update_surveys(eng_id, surveys)

    @staticmethod
    def edit_engagement(data: dict):
        """Update engagement partially."""
        status_block = data.pop('status_block', None)
        surveys = data.pop('surveys', None)
        suggested_engagements = data.pop('suggested_engagements', None)
        if suggested_engagements is None:
            suggested_engagements = data.pop('suggested_engagements_input', None)
        # Defensive: relationship keys are not valid for SQL UPDATE mappings.
        data.pop('suggested_engagement_links', None)
        epic_fields = 'end_date' in data or 'start_date' in data
        selected_survey_id = data.get('selected_survey_id', None)
        engagement_id = data.get('id', None)
        authorization.check_auth(
            one_of_roles=(MembershipType.TEAM_MEMBER.name, Role.EDIT_ENGAGEMENT.value),
            engagement_id=engagement_id,
        )

        engagement = EngagementModel.find_by_id(engagement_id)
        if not engagement:
            raise ValueError('Engagement does not exist')

        try:
            EngagementService._validate_engagement_edit_data(engagement, data)
            updated_engagement = engagement

            if data:
                if selected_survey_id:
                    data['selected_survey_id'] = \
                        EngagementService._validate_and_assign_survey(selected_survey_id, engagement_id)

                updated_engagement = EngagementModel.edit_engagement(data, commit=False)

                if not updated_engagement:
                    raise ValueError(engagement)

                EngagementService._update_external_engagement_data(
                    engagement_id,
                    status_block,
                    surveys,
                    epic_fields,
                    updated_engagement
                )

            if suggested_engagements is not None:
                EngagementService._sync_suggestions(engagement, suggested_engagements)

            db.session.commit()
        except (BusinessException, ValueError, ValidationError, SQLAlchemyError):
            db.session.rollback()
            raise

        return EngagementModel.find_by_id(engagement_id)

    @staticmethod
    def _sync_suggestions(engagement: EngagementModel, suggestions_data):
        """Sync suggestions: create, update, delete using ORM relationship replacement."""
        if not isinstance(suggestions_data, list):
            raise BusinessException(
                error='Invalid suggestions payload',
                status_code=HTTPStatus.BAD_REQUEST,
            )

        by_id: dict[int, SuggestedEngagementModel] = {
            r.id: r for r in engagement.suggested_engagement_links if r.id is not None
        }
        by_target: dict[int, SuggestedEngagementModel] = {
            r.suggested_engagement_id: r for r in engagement.suggested_engagement_links
            if r.suggested_engagement_id is not None
        }

        normalized = SuggestedEngagementSyncItemSchema(many=True).load(suggestions_data)
        now = datetime.now(timezone.utc)
        ordered: list[SuggestedEngagementModel] = []

        for item in sorted(normalized, key=lambda x: x['sort_index']):
            sid = item.get('id')
            target = item['suggested_engagement_id']
            slot = item['sort_index']

            if sid and sid in by_id:
                link = by_id[sid]
            elif target in by_target:
                link = by_target[target]
            else:
                link = SuggestedEngagementModel(
                    suggested_engagement_id=target,
                    created_date=now,
                )

            link.suggested_engagement_id = target
            link.sort_index = slot
            link.updated_date = now
            ordered.append(link)

        incoming_targets = {i['suggested_engagement_id'] for i in normalized}
        for existing in engagement.suggested_engagement_links:
            if existing.suggested_engagement_id not in incoming_targets:
                db.session.delete(existing)

        engagement.suggested_engagement_links = ordered

    @staticmethod
    def validate_fields(data):
        """Validate all fields."""
        empty_fields = [not data[field] for field in ['name', 'start_date', 'end_date']]

        if data['start_date'] > data['end_date']:
            raise ValueError('Start date cannot be after End date')

        if any(empty_fields):
            raise ValueError('Some required fields are empty')

    @staticmethod
    def _send_closeout_emails(engagement: EngagementModel) -> None:
        """Send the engagement closeout emails. Throws error if fails."""
        lang_code = current_app.config['DEFAULT_LANGUAGE']
        subject, body, args = EngagementService._render_email_template(
            engagement, lang_code
        )
        participants = SubmissionModel.get_engaged_participants(engagement.id)
        template_id = current_app.config['EMAIL_TEMPLATES']['CLOSEOUT']['ID']
        emails = [
            participant.decode_email(participant.email_address)
            for participant in participants
        ]
        # Removes duplicated records
        emails = list(set(emails))
        try:
            [
                notification.send_email(
                    subject=subject,
                    email=email_address,
                    html_body=body,
                    args=args,
                    template_id=template_id,
                )
                for email_address in emails
            ]
        except Exception as exc:  # noqa: B902
            current_app.logger.error(
                '<Notification for engagement closeout failed', exc
            )
            raise BusinessException(
                error='Error sending engagement closeout.',
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            ) from exc

    @staticmethod
    def _render_email_template(engagement: EngagementModel, lang_code):
        template = Template.get_template('email_engagement_closeout.html')
        dashboard_path = EngagementService._get_dashboard_path(engagement, lang_code)
        engagement_url = notification.get_tenant_site_url(
            engagement.tenant_id, dashboard_path
        )
        templates = current_app.config['EMAIL_TEMPLATES']
        subject = templates['CLOSEOUT']['SUBJECT'].format(
            engagement_name=engagement.name
        )
        email_environment = templates['ENVIRONMENT']
        tenant_name = EngagementService._get_tenant_name(engagement.tenant_id)
        args = {
            'engagement_name': engagement.name,
            'engagement_url': engagement_url,
            'tenant_name': tenant_name,
            'email_environment': email_environment,
        }
        body = template.render(
            engagement_name=args.get('engagement_name'),
            engagement_url=args.get('engagement_url'),
            tenant_name=args.get('tenant_name'),
            email_environment=args.get('email_environment'),
        )
        return subject, body, args

    @staticmethod
    def _get_tenant_name(tenant_id):
        tenant = TenantModel.find_by_id(tenant_id)
        return tenant.name

    @staticmethod
    def _get_dashboard_path(engagement: EngagementModel, lang_code):
        engagement_slug = EngagementSlugModel.find_by_engagement_id(engagement.id)
        paths = current_app.config['PATH_CONFIG']
        if engagement_slug:
            return paths['ENGAGEMENT']['DASHBOARD_SLUG'].format(
                slug=engagement_slug.slug, lang=lang_code
            )
        return paths['ENGAGEMENT']['DASHBOARD'].format(
            engagement_id=engagement.id, lang=lang_code
        )

    @classmethod
    def delete(cls, engagement_id: int):
        """Delete an existing engagement and its translations."""
        one_of_roles = (Role.SUPER_ADMIN.value, Role.UNPUBLISH_ENGAGEMENT.value)
        authorization.check_auth(one_of_roles=one_of_roles)

        current_env = (
            (current_app.config.get('ENVIRONMENT') if has_app_context() else '') or
            os.getenv('ENV') or
            os.getenv('DEPLOYMENT_ENV') or
            'prod'
        ).strip().lower()

        if current_env in ('prod', 'production'):
            abort(HTTPStatus.FORBIDDEN, 'Cannot delete an engagement in production environment')

        engagement = EngagementModel.find_by_id(engagement_id)
        if not engagement:
            raise ValueError('Engagement not found')
        if engagement.status_id == Status.Published.value:
            raise ValueError('Cannot delete an engagement that is published')

        try:
            for translation in (EngagementTranslation.get_available_translation_languages(engagement.id) or []):
                EngagementTranslation.delete_engagement_translation(translation.id)
            deleted = EngagementModel.delete_engagement(engagement_id)
        except ValueError as exc:
            raise ValueError(str(exc)) from exc
        except SQLAlchemyError as e:
            raise RuntimeError('Database error while deleting engagement', e) from e
        return {'id': deleted.id if hasattr(deleted, 'id') else engagement_id}
