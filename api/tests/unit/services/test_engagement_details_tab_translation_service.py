"""Tests for the EngagementDetailsTabTranslationService."""

from api.services.engagement_details_tab_translation_service import EngagementDetailsTabTranslationService
from tests.utilities.factory_scenarios import (
    TestEngagementDetailsTabsInfo, TestEngagementDetailsTabTranslationInfo, TestEngagementInfo, TestJwtClaims)
from tests.utilities.factory_utils import (
    factory_engagement_details_tab_model, factory_engagement_details_tab_translation_model, factory_engagement_model,
    factory_staff_user_model, factory_user_group_membership_model, patch_token_info, set_global_tenant)


def test_get_translations_by_engagement_and_language(session):
    """Assert that engagement details tab translation can be fetched by its ID."""
    engagement = factory_engagement_model(
        {
            **TestEngagementInfo.engagement1.value,
            'id': 1,
        }
    )
    engagement_details_tab = factory_engagement_details_tab_model(
        {
            **TestEngagementDetailsTabsInfo.details_tab1.value,
            'id': 55,
            'engagement_id': engagement.id
        }
    )
    translation = factory_engagement_details_tab_translation_model(
        {
            **TestEngagementDetailsTabTranslationInfo.translation_info1.value,
            'engagement_details_tab_id': engagement_details_tab.id,
            'language_id': 49,  # French lang ID from pre-populated DB.
        }
    )
    session.commit()

    fetched_translations = EngagementDetailsTabTranslationService.get_translations_by_engagement_and_language(
        engagement_details_tab.engagement_id, translation.language_id
    )
    assert fetched_translations is not None
    assert fetched_translations[0]['id'] == translation.id


def test_bulk_create_engagement_details_tab_translations(session, monkeypatch):
    """Assert that an engagement details tab translation can be created with proper authorization."""
    patch_token_info(TestJwtClaims.staff_admin_role, monkeypatch)
    set_global_tenant()
    user = factory_staff_user_model(external_id=TestJwtClaims.staff_admin_role['sub'])
    factory_user_group_membership_model(str(user.external_id))
    engagement = factory_engagement_model(
        {
            **TestEngagementInfo.engagement1.value,
            'id': 1,
        }
    )
    engagement_details_tab = factory_engagement_details_tab_model(
        {
            **TestEngagementDetailsTabsInfo.details_tab1.value,
            'id': 55,
            'engagement_id': engagement.id
        }
    )
    data = {
        **TestEngagementDetailsTabTranslationInfo.translation_info1.value,
        'engagement_details_tab_id': engagement_details_tab.id,
        'language_id': 49,  # French lang ID from pre-populated DB.
    }

    created_translations = EngagementDetailsTabTranslationService.create_translations(engagement.id, 49, data)
    assert created_translations is not None
    assert created_translations[0]['heading'] == data['heading']


def test_sync_engagement_details_tab_translation_with_authorization(session, monkeypatch):
    """Assert that an engagement details tab translation can be updated with proper authorization."""
    patch_token_info(TestJwtClaims.staff_admin_role, monkeypatch)
    set_global_tenant()
    user = factory_staff_user_model(external_id=TestJwtClaims.staff_admin_role['sub'])
    factory_user_group_membership_model(str(user.external_id))
    engagement = factory_engagement_model(
        {
            **TestEngagementInfo.engagement1.value,
        }
    )
    engagement_details_tab = factory_engagement_details_tab_model(
        {
            **TestEngagementDetailsTabsInfo.details_tab1.value,
            'engagement_id': engagement.id
        }
    )
    translation = factory_engagement_details_tab_translation_model(
        {
            **TestEngagementDetailsTabTranslationInfo.translation_info1.value,
            'engagement_details_tab_id': engagement_details_tab.id,
            'language_id': 49,  # French lang ID from pre-populated DB.
        }
    )
    session.commit()
    updated_data = {
        'id': translation.id,
        'engagement_details_tab_id': engagement_details_tab.id,
        'language_id': translation.language_id,
        'label': translation.label,
        'slug': translation.slug,
        'heading': 'Updated Title',
        'body': translation.body,
    }
    updated_translations = EngagementDetailsTabTranslationService.sync_translations(
        engagement.id, 49, [updated_data]
    )
    assert updated_translations['tabs'][0]['heading'] == updated_data['heading']


def test_delete_engagement_details_tab_translation_with_authorization(session, monkeypatch):
    """Assert that an engagement details tab translation can be deleted with proper authorization."""
    patch_token_info(TestJwtClaims.staff_admin_role, monkeypatch)
    set_global_tenant()
    user = factory_staff_user_model(external_id=TestJwtClaims.staff_admin_role['sub'])
    factory_user_group_membership_model(str(user.external_id))
    engagement = factory_engagement_model(
        {
            **TestEngagementInfo.engagement1.value,
        }
    )
    engagement_details_tab = factory_engagement_details_tab_model(
        {
            **TestEngagementDetailsTabsInfo.details_tab1.value,
            'engagement_id': engagement.id
        }
    )
    translation = factory_engagement_details_tab_translation_model(
        {
            **TestEngagementDetailsTabTranslationInfo.translation_info1.value,
            'engagement_details_tab_id': engagement_details_tab.id,
            'language_id': 49,  # French lang ID from pre-populated DB.
        }
    )
    session.commit()

    deleted_translation = EngagementDetailsTabTranslationService.delete_translation(engagement.id, translation.id)
    assert deleted_translation['deleted'] is True
