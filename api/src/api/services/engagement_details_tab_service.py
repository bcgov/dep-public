"""Service for engagement details tabs management."""
import json
from datetime import datetime, timezone
from http import HTTPStatus

from api.constants.membership_type import MembershipType
from api.exceptions.business_exception import BusinessException
from api.models.engagement_details_tab import EngagementDetailsTab as EngagementDetailsTabModel
from api.schemas.engagement_details_tab import EngagementDetailsTabSchema
from api.services import authorization
from api.utils.roles import Role


class EngagementDetailsTabService:
    """Service for managing engagement details tabs."""

    @staticmethod
    def get_tabs_by_engagement_id(engagement_id: int):
        """List all tabs for an engagement."""
        tabs_schema = EngagementDetailsTabSchema(many=True)
        tab_records = EngagementDetailsTabModel.find_by_engagement_id(engagement_id)
        return tabs_schema.dump(tab_records)

    @staticmethod
    def _coerce_body(tab_data: dict) -> dict:
        """Parse body from JSON string to dict if needed, for DB JSON column compatibility."""
        body = tab_data.get('body')
        if isinstance(body, str):
            try:
                tab_data['body'] = json.loads(body)
            except (ValueError, TypeError):
                tab_data['body'] = {}
        return tab_data

    @staticmethod
    def create_tabs(engagement_id: int, tabs_data: list) -> list[dict]:
        """Create one or more engagement details tabs and return the persisted records."""
        EngagementDetailsTabService._authorize(engagement_id)
        inserts = []
        for tab_data in tabs_data:
            EngagementDetailsTabService._validate_tab_data(tab_data)
            EngagementDetailsTabService._coerce_body(tab_data)
            tab_data['engagement_id'] = engagement_id
            inserts.append(tab_data)
        EngagementDetailsTabModel.bulk_insert_details_tabs(inserts)
        created_records = EngagementDetailsTabModel.find_by_engagement_id(engagement_id)
        return EngagementDetailsTabSchema(many=True).dump(created_records)

    @staticmethod
    def sync_tabs(engagement_id: int, tabs_data, user_id=None):
        """Sync tabs for an engagement: create, update, delete."""
        EngagementDetailsTabService._authorize(engagement_id)
        if not isinstance(tabs_data, list):
            raise BusinessException(error='Invalid tabs payload', status_code=HTTPStatus.BAD_REQUEST)
        existing_tabs = EngagementDetailsTabModel.find_by_engagement_id(engagement_id)
        existing_ids = {tab.id for tab in existing_tabs}
        incoming_ids = {t.get('id') for t in tabs_data if t.get('id') and t.get('id') > 0}

        updates = [t for t in tabs_data if t.get('id') in existing_ids]
        for u in updates:
            u['updated_by'] = user_id
            u['updated_date'] = datetime.now(timezone.utc)
            EngagementDetailsTabService._coerce_body(u)

        inserts = [t for t in tabs_data if not t.get('id') or t.get('id') == -1]
        for i in inserts:
            i.pop('id', None)
            i['engagement_id'] = engagement_id
            EngagementDetailsTabService._coerce_body(i)

        to_delete = existing_ids - incoming_ids

        if updates:
            EngagementDetailsTabModel.bulk_update_details_tabs(updates)
        if inserts:
            EngagementDetailsTabModel.bulk_insert_details_tabs(inserts)
        if to_delete:
            EngagementDetailsTabModel.delete_tabs_by_ids(to_delete)

        updated_records = EngagementDetailsTabModel.find_by_engagement_id(engagement_id)
        return {
            'summary': {'updated': len(updates), 'created': len(inserts), 'deleted': len(to_delete)},
            'tabs': EngagementDetailsTabSchema(many=True).dump(updated_records)
        }

    @staticmethod
    def delete_tab(engagement_id: int, tab_id: int):
        """Delete a single tab."""
        EngagementDetailsTabService._authorize(engagement_id)
        deleted_count = EngagementDetailsTabModel.delete_details_tab(engagement_id, tab_id)
        if not deleted_count:
            raise BusinessException(error='Tab not found', status_code=HTTPStatus.NOT_FOUND)
        return {'deleted': deleted_count}

    @staticmethod
    def _validate_tab_data(tab_data: dict):
        required_fields = ['label', 'slug', 'heading', 'body', 'sort_index']
        missing = [field for field in required_fields if field not in tab_data]
        if missing:
            raise BusinessException(error=f'Missing fields: {", ".join(missing)}', status_code=HTTPStatus.BAD_REQUEST)

    @staticmethod
    def _authorize(engagement_id: int):
        one_of_roles = (MembershipType.TEAM_MEMBER.name, Role.EDIT_ENGAGEMENT.value)
        authorization.check_auth(one_of_roles=one_of_roles, engagement_id=engagement_id)
