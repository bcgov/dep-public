"""Tests for aggregated engagement content translation API endpoint."""

from http import HTTPStatus

from api.models.widget_image import WidgetImage
from api.models.widget_image_translation import WidgetImageTranslation
from api.models.widget_timeline_translation import WidgetTimelineTranslation
from api.models.widget_translation import WidgetTranslation
from api.utils.enums import ContentType
from tests.utilities.factory_scenarios import (
    TestEngagementDetailsTabsInfo, TestEngagementDetailsTabTranslationInfo, TestEngagementInfo, TestWidgetDocumentInfo,
    TestWidgetInfo)
from tests.utilities.factory_utils import (
    factory_auth_header, factory_document_model, factory_engagement_details_tab_model,
    factory_engagement_details_tab_translation_model, factory_engagement_model, factory_widget_event_model,
    factory_widget_model, factory_widget_timeline_model)


def test_get_engagement_content_translation_includes_new_widget_translation_buckets(client, jwt, session):
    """Assert aggregated GET includes timeline/events/documents/image translation buckets."""
    headers = factory_auth_header(jwt=jwt, claims={})

    engagement = factory_engagement_model({**TestEngagementInfo.engagement1.value})
    details_tab = factory_engagement_details_tab_model(
        {
            **TestEngagementDetailsTabsInfo.details_tab1.value,
            'engagement_id': engagement.id,
        }
    )
    factory_engagement_details_tab_translation_model(
        {
            **TestEngagementDetailsTabTranslationInfo.translation_info1.value,
            'engagement_details_tab_id': details_tab.id,
            'language_id': 49,
        }
    )

    _ = factory_widget_model({'engagement_id': engagement.id})

    # Use a Timeline-type widget so get_timeline_translations filters correctly
    timeline_widget = factory_widget_model({**TestWidgetInfo.widget_timeline.value, 'engagement_id': engagement.id})
    widget_timeline = factory_widget_timeline_model(
        {
            'widget_id': timeline_widget.id,
            'engagement_id': engagement.id,
            'title': 'Timeline EN',
            'description': 'Timeline description EN',
        }
    )
    timeline_translation = WidgetTimelineTranslation(
        widget_timeline_id=widget_timeline.id,
        language_id=49,
        title='Timeline FR',
        description='Description chronologie FR',
    )
    timeline_translation.save()

    events_widget = factory_widget_model({**TestWidgetInfo.widget_events.value, 'engagement_id': engagement.id})
    event = factory_widget_event_model(widget_model=events_widget)
    event_translation = WidgetTranslation(
        widget_id=events_widget.id,
        widget_events_id=event.id,
        language_id=49,
        title='Evenement FR',
    )
    event_translation.save()

    docs_widget = factory_widget_model({**TestWidgetInfo.widget2.value, 'engagement_id': engagement.id})
    document = factory_document_model(
        {
            **TestWidgetDocumentInfo.document1.value,
            'widget_id': docs_widget.id,
            'title': 'Document EN',
        }
    )
    document_translation = WidgetTranslation(
        widget_id=docs_widget.id,
        widget_documents_id=document.id,
        language_id=49,
        title='Document FR',
    )
    document_translation.save()

    image_widget = factory_widget_model({**TestWidgetInfo.widget_image.value, 'engagement_id': engagement.id})
    image = WidgetImage(
        widget_id=image_widget.id,
        engagement_id=engagement.id,
        image_url='https://example.com/image.jpg',
        alt_text='Alt EN',
        description='Description EN',
    )
    image.save()
    image_translation = WidgetImageTranslation(
        widget_image_id=image.id,
        language_id=49,
        alt_text='Alt FR',
        description='Description image FR',
    )
    image_translation.save()

    rv = client.get(
        f'/api/engagement/{engagement.id}/content/translations/language/{49}',
        headers=headers,
        content_type=ContentType.JSON.value,
    )

    assert rv.status_code == HTTPStatus.OK
    response = rv.get_json()
    assert 'details_tabs' in response
    assert 'widgets' in response
    assert 'timeline_widgets' in response
    assert 'events_widgets' in response
    assert 'documents_widgets' in response
    assert 'image_widgets' in response

    assert response['timeline_widgets'][0]['id'] == timeline_translation.id
    assert response['timeline_widgets'][0]['widget_id'] == timeline_widget.id
    assert response['events_widgets'][0]['id'] == event_translation.id
    assert response['documents_widgets'][0]['id'] == document_translation.id
    assert response['image_widgets'][0]['id'] == image_translation.id


def test_put_engagement_content_translation_syncs_new_widget_translation_buckets(
    client,
    jwt,
    session,
    setup_admin_user_and_claims,
):
    """Assert aggregated PUT updates and deletes records for new translation buckets."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)

    engagement = factory_engagement_model({**TestEngagementInfo.engagement1.value})

    timeline_widget = factory_widget_model({**TestWidgetInfo.widget_timeline.value, 'engagement_id': engagement.id})
    widget_timeline = factory_widget_timeline_model(
        {
            'widget_id': timeline_widget.id,
            'engagement_id': engagement.id,
            'title': 'Timeline EN',
            'description': 'Timeline description EN',
        }
    )
    timeline_translation = WidgetTimelineTranslation(
        widget_timeline_id=widget_timeline.id,
        language_id=49,
        title='Timeline FR',
        description='Description chronologie FR',
    )
    timeline_translation.save()

    events_widget = factory_widget_model({**TestWidgetInfo.widget_events.value, 'engagement_id': engagement.id})
    event = factory_widget_event_model(widget_model=events_widget)
    event_translation = WidgetTranslation(
        widget_id=events_widget.id,
        widget_events_id=event.id,
        language_id=49,
        title='Evenement FR',
    )
    event_translation.save()

    docs_widget = factory_widget_model({**TestWidgetInfo.widget2.value, 'engagement_id': engagement.id})
    document = factory_document_model(
        {
            **TestWidgetDocumentInfo.document1.value,
            'widget_id': docs_widget.id,
            'title': 'Document EN',
        }
    )
    document_translation = WidgetTranslation(
        widget_id=docs_widget.id,
        widget_documents_id=document.id,
        language_id=49,
        title='Document FR',
    )
    document_translation.save()
    document_translation_id = document_translation.id

    image_widget = factory_widget_model({**TestWidgetInfo.widget_image.value, 'engagement_id': engagement.id})
    image = WidgetImage(
        widget_id=image_widget.id,
        engagement_id=engagement.id,
        image_url='https://example.com/image.jpg',
        alt_text='Alt EN',
        description='Description EN',
    )
    image.save()
    image_translation = WidgetImageTranslation(
        widget_image_id=image.id,
        language_id=49,
        alt_text='Alt FR',
        description='Description image FR',
    )
    image_translation.save()

    payload = {
        'timeline_widgets': [
            {
                'id': timeline_translation.id,
                'widget_id': timeline_widget.id,
                'language_id': 49,
                'title': 'Timeline FR Updated',
                'description': 'Description chronologie FR mise a jour',
            }
        ],
        'events_widgets': [
            {
                'id': event_translation.id,
                'widget_events_id': event.id,
                'widget_id': events_widget.id,
                'language_id': 49,
                'title': 'Evenement FR Updated',
            }
        ],
        'documents_widgets': [],
        'image_widgets': [
            {
                'id': image_translation.id,
                'widget_image_id': image.id,
                'language_id': 49,
                'alt_text': 'Alt FR Updated',
                'description': 'Description image FR mise a jour',
            }
        ],
    }

    rv = client.put(
        f'/api/engagement/{engagement.id}/content/translations/language/{49}',
        json=payload,
        headers=headers,
        content_type=ContentType.JSON.value,
    )

    assert rv.status_code == HTTPStatus.OK
    response = rv.get_json()

    assert response['timeline_widgets']['summary']['updated'] == 1
    assert response['events_widgets']['summary']['updated'] == 1
    assert response['documents_widgets']['summary']['deleted'] == 1
    assert response['image_widgets']['summary']['updated'] == 1

    updated_timeline_translation = WidgetTimelineTranslation.query.get(timeline_translation.id)
    updated_event_translation = WidgetTranslation.query.get(event_translation.id)
    deleted_document_translation = WidgetTranslation.query.get(document_translation_id)
    updated_image_translation = WidgetImageTranslation.query.get(image_translation.id)

    assert updated_timeline_translation.title == 'Timeline FR Updated'
    assert updated_event_translation.title == 'Evenement FR Updated'
    assert deleted_document_translation is None
    assert updated_image_translation.alt_text == 'Alt FR Updated'


def test_put_engagement_content_translation_requires_payload(client, jwt, session, setup_admin_user_and_claims):
    """Assert aggregated PUT rejects empty payloads."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)

    engagement = factory_engagement_model({**TestEngagementInfo.engagement1.value})

    rv = client.put(
        f'/api/engagement/{engagement.id}/content/translations/language/{49}',
        json={},
        headers=headers,
        content_type=ContentType.JSON.value,
    )

    assert rv.status_code == HTTPStatus.BAD_REQUEST
    assert rv.get_json()['message'] == 'No content translation payload provided'
