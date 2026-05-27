"""Tests for the EngagementDetailsTabTranslation model.

Test suite to ensure that the EngagementDetailsTabTranslation model
routines are working as expected.
"""

from api.models.engagement_details_tab_translation import EngagementDetailsTabTranslation
from tests.utilities.factory_scenarios import (
    TestEngagementDetailsTabsInfo, TestEngagementDetailsTabTranslationInfo, TestEngagementInfo)
from tests.utilities.factory_utils import (
    factory_engagement_details_tab_model, factory_engagement_details_tab_translation_model, factory_engagement_model)


def test_get_translations_by_details_tab_and_language(session):
    """Translations for engagement details tab can be fetched by engagement and language."""
    engagement = factory_engagement_model(
        {
            **TestEngagementInfo.engagement1,
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

    translations = EngagementDetailsTabTranslation.find_by_engagement_and_language(
        engagement.id, 49  # French lang ID from pre-populated DB.
    )
    assert isinstance(translations, list)
    assert len(translations) == 1
    assert (
        translations[0].heading == translation.heading
    )


def test_create_engagement_details_tab_translation(session):
    """Assert that an engagement details tab translation can be created."""
    engagement = factory_engagement_model(
        {
            **TestEngagementInfo.engagement1,
        }
    )
    engagement_details_tab = factory_engagement_details_tab_model(
        {
            **TestEngagementDetailsTabsInfo.details_tab1.value,
            'engagement_id': engagement.id
        }
    )
    payload = {
        **TestEngagementDetailsTabTranslationInfo.translation_info1.value,
        'engagement_details_tab_id': engagement_details_tab.id,
        'language_id': 49,  # French lang ID from pre-populated DB.
    }
    EngagementDetailsTabTranslation.bulk_insert_details_tab_translations([payload])
    session.commit()

    rows = EngagementDetailsTabTranslation.find_by_engagement_and_language(engagement.id, 49)
    session.commit()

    assert isinstance(rows, list)
    assert len(rows) == 1
    assert rows[0].id is not None
    assert rows[0].heading == payload['heading']


def test_update_engagement_details_tab_translation(session):
    """Assert that an engagement details tab translation can be updated."""
    engagement = factory_engagement_model({
        **TestEngagementInfo.engagement1,
    })
    engagement_details_tab = factory_engagement_details_tab_model({
        **TestEngagementDetailsTabsInfo.details_tab1.value,
        'engagement_id': engagement.id,
    })
    translation_payload = {
        **TestEngagementDetailsTabTranslationInfo.translation_info1.value,
        'engagement_details_tab_id': engagement_details_tab.id,
        'language_id': 49,
    }
    translation = factory_engagement_details_tab_translation_model(translation_payload)
    session.commit()

    updated_fields = {'heading': 'Updated Title'}
    updated = EngagementDetailsTabTranslation.update_details_tab_translation(
        engagement_id=engagement.id,
        translation_id=translation.id,
        translation_data=updated_fields,
    )
    session.commit()

    assert updated is not None
    assert updated.id == translation.id
    assert updated.heading == 'Updated Title'


def test_delete_engagement_details_tab_translation(session):
    """Assert that an engagement details tab translation can be deleted."""
    engagement = factory_engagement_model({
        **TestEngagementInfo.engagement1,
    })
    engagement_details_tab = factory_engagement_details_tab_model({
        **TestEngagementDetailsTabsInfo.details_tab1.value,
        'engagement_id': engagement.id,
    })
    translation = factory_engagement_details_tab_translation_model(
        {
            **TestEngagementDetailsTabTranslationInfo.translation_info1.value,
            'engagement_details_tab_id': engagement_details_tab.id,
            'language_id': 49,
        }
    )
    session.commit()

    EngagementDetailsTabTranslation.delete_translations_by_ids([translation.id])
    session.commit()

    deleted_translation = EngagementDetailsTabTranslation.find_by_id(925)
    assert deleted_translation is None
