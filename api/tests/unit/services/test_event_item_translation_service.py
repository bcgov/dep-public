"""Test to verify the SubscribeItemTranslation Service."""
from api.services.event_item_translation_service import EventItemTranslationService
from tests.utilities.factory_scenarios import TestEventItemTranslationInfo, TestJwtClaims
from tests.utilities.factory_utils import (
    event_item_model_with_language, factory_event_item_translation_model, factory_staff_user_model,
    factory_user_group_membership_model, patch_token_info, set_global_tenant)


def test_get_event_item_translation_by_id(session):
    """Assert that event item translation can be fetched by its ID."""
    event_item, _ = event_item_model_with_language()
    translation = factory_event_item_translation_model(
        {
            ** TestEventItemTranslationInfo.event_item_info1.value,
            'event_item_id': event_item.id,
            'language_id': 49,  # French lang ID from pre-populated DB.
        }
    )
    session.commit()

    fetched_translation = EventItemTranslationService.get_by_id(
        translation.id
    )
    assert fetched_translation is not None
    assert fetched_translation.id == translation.id


def test_get_event_item_translation(session):
    """Assert that event item translations can be fetched by item and language."""
    event_item, _ = event_item_model_with_language()
    factory_event_item_translation_model(
        {
            ** TestEventItemTranslationInfo.event_item_info1.value,
            'event_item_id': event_item.id,
            'language_id': 49,  # French lang ID from pre-populated DB.
        }
    )
    session.commit()

    translations = EventItemTranslationService.get_event_item_translation(
        event_item.id, 49  # French lang ID from pre-populated DB.
    )
    assert len(translations) == 1
    assert translations[0].description == TestEventItemTranslationInfo.event_item_info1.value['description']


def test_create_event_item_translation_with_authorization(
    session, monkeypatch
):
    """Assert that an event item translation can be created with proper authorization."""
    # Mock authorization
    patch_token_info(TestJwtClaims.staff_admin_role, monkeypatch)
    set_global_tenant()
    user = factory_staff_user_model(external_id=TestJwtClaims.staff_admin_role['sub'])
    factory_user_group_membership_model(str(user.external_id))
    event_item, event = event_item_model_with_language()
    data = {
        ** TestEventItemTranslationInfo.event_item_info1.value,
        'event_item_id': event_item.id,
        'language_id': 49,  # French lang ID from pre-populated DB.
        'description': 'New Translation',
    }

    created_translation = (
        EventItemTranslationService.create_event_item_translation(
            event.id, data, False
        )
    )
    assert created_translation is not None
    assert created_translation.description == data['description']


def test_create_event_item_translation_with_authorization_pre_populate(
    session, monkeypatch
):
    """Assert that an event item translation can be created with proper authorization."""
    # Mock authorization
    patch_token_info(TestJwtClaims.staff_admin_role, monkeypatch)
    set_global_tenant()
    user = factory_staff_user_model(external_id=TestJwtClaims.staff_admin_role['sub'])
    factory_user_group_membership_model(str(user.external_id))
    event_item, event = event_item_model_with_language()
    data = {
        ** TestEventItemTranslationInfo.event_item_info1.value,
        'event_item_id': event_item.id,
        'language_id': 49,  # French lang ID from pre-populated DB.
    }

    # Setting preopulate true should return the event item description
    created_translation = (
        EventItemTranslationService.create_event_item_translation(
            event.id, data, True
        )
    )
    assert created_translation is not None
    assert created_translation.description == event_item.description


def test_update_event_item_translation_with_authorization(
    session, monkeypatch
):
    """Assert that an event item translation can be updated with proper authorization."""
    # Mock authorization
    patch_token_info(TestJwtClaims.staff_admin_role, monkeypatch)
    set_global_tenant()
    user = factory_staff_user_model(external_id=TestJwtClaims.staff_admin_role['sub'])
    factory_user_group_membership_model(str(user.external_id))
    event_item, event = event_item_model_with_language()
    translation = factory_event_item_translation_model(
        {
            ** TestEventItemTranslationInfo.event_item_info1.value,
            'event_item_id': event_item.id,
            'language_id': 49,  # French lang ID from pre-populated DB.
            'description': 'Old Description',
        }
    )
    session.commit()

    updated_data = {'description': 'Updated Description'}
    updated_translation = (
        EventItemTranslationService.update_event_item_translation(
            event.id, translation.id, updated_data
        )
    )
    assert updated_translation.description == updated_data['description']


def test_delete_event_item_translation_with_authorization(
    session, monkeypatch
):
    """Assert that an event item translation can be deleted with proper authorization."""
    # Mock authorization
    patch_token_info(TestJwtClaims.staff_admin_role, monkeypatch)
    set_global_tenant()
    user = factory_staff_user_model(external_id=TestJwtClaims.staff_admin_role['sub'])
    factory_user_group_membership_model(str(user.external_id))
    event_item, event = event_item_model_with_language()
    translation = factory_event_item_translation_model(
        {
            ** TestEventItemTranslationInfo.event_item_info1.value,
            'event_item_id': event_item.id,
            'language_id': 49,  # French lang ID from pre-populated DB.
        }
    )
    session.commit()

    EventItemTranslationService.delete_event_item_translation(
        event.id, translation.id
    )
    deleted_translation = EventItemTranslationService.get_by_id(
        translation.id
    )
    assert deleted_translation is None
