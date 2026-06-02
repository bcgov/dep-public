"""Tests to verify the EngagementDetailsTabTranslation API endpoints."""

from http import HTTPStatus
import json

from api.utils.enums import ContentType
from tests.utilities.factory_scenarios import (
    TestEngagementDetailsTabsInfo, TestEngagementDetailsTabTranslationInfo, TestEngagementInfo)
from tests.utilities.factory_utils import (
    factory_auth_header, factory_engagement_details_tab_model, factory_engagement_details_tab_translation_model,
    factory_engagement_model)


def test_get_engagement_details_tab_translation_by_language(client, jwt, session):
    """Assert that engagement details tab translations can be fetched by Engagement ID and Language ID."""
    headers = factory_auth_header(jwt=jwt, claims={})
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

    rv = client.get(
        f'/api/engagement/{engagement.id}/details/translations/language/{49}',
        headers=headers,
        content_type=ContentType.JSON.value
    )

    assert rv.status_code == HTTPStatus.OK
    json_data = rv.json
    assert json_data[0]['id'] == translation.id


def test_create_engagement_details_tab_translation(client, jwt, session, setup_admin_user_and_claims):
    """Assert that a new engagement details tab translation can be created using the POST API endpoint."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
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
    session.commit()

    data = {
        'engagement_details_tab_id': engagement_details_tab.id,
        'language_id': 49,
        'label': 'Tab Label FR',
        'slug': 'tab_label_fr',
        'heading': 'Titre en français',
        'body': json.dumps(
            {
                'blocks': [
                    {
                        'key': 'fclgj',
                        'text': 'Contenu riche',
                        'type': 'unstyled',
                        'depth': 0,
                        'inlineStyleRanges': [],
                        'entityRanges': [],
                        'data': {},
                    }
                ],
                'entityMap': {},
            },
            separators=(',', ':'),
            ensure_ascii=False,
        )
    }

    rv = client.post(
        f'/api/engagement/{engagement.id}/details/translations/language/{data["language_id"]}',
        json=data,
        headers=headers,
        content_type=ContentType.JSON.value,
    )
    json_data = rv.get_json()

    assert rv.status_code == HTTPStatus.CREATED
    assert json_data[0]['heading'] == data['heading']


def test_update_engagement_details_tab_translation(client, jwt, session, setup_admin_user_and_claims):
    """Assert that an engagement details tab translation can be updated using the PATCH API endpoint."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
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
    translation = factory_engagement_details_tab_translation_model({
        **TestEngagementDetailsTabTranslationInfo.translation_info1.value,
        'engagement_details_tab_id': engagement_details_tab.id,
        'language_id': 49,  # French lang ID from pre-populated DB.
    })
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
    rv = client.put(
        f'/api/engagement/{engagement.id}/details/translations/language/{updated_data["language_id"]}',
        json=[updated_data],
        headers=headers,
        content_type=ContentType.JSON.value
    )
    returned_data = rv.get_json()

    assert rv.status_code == HTTPStatus.OK
    assert returned_data['tabs'][0]['heading'] == 'Updated Title'
    assert returned_data['summary']['deleted'] == 0
    assert returned_data['summary']['created'] == 0
    assert returned_data['summary']['updated'] == 1


def test_delete_engagement_details_tab_translation(client, jwt, session, setup_admin_user_and_claims):
    """Assert that an engagement details tab translation can be deleted using the DELETE API endpoint."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
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

    rv = client.put(
        f'/api/engagement/{engagement.id}/details/translations/language/{translation.language_id}',
        json=[],
        headers=headers,
        content_type=ContentType.JSON.value
    )
    results = rv.get_json()

    assert results['summary']['deleted'] == 1
    assert results['summary']['created'] == 0
    assert results['summary']['updated'] == 0
    assert results['tabs'] == []
