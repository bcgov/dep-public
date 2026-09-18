"""Tests for EngagementFile location serialization."""

from api.models.engagement_file import EngagementFile
from api.models.widget_image import WidgetImage
from api.schemas.engagement_file import EngagementFileSchema
from tests.utilities.factory_scenarios import TestEngagementInfo
from tests.utilities.factory_utils import (
    factory_document_model, factory_engagement_model, factory_tenant_model, factory_uploaded_file_model,
    factory_widget_model)


def _engagement_with_tenant():
    tenant = factory_tenant_model()
    engagement = factory_engagement_model(
        {**TestEngagementInfo.engagement1, 'tenant_id': tenant.id}
    )
    return tenant, engagement


def test_schema_marks_banner_file_location(session):
    """A file assigned as an engagement banner is reported as a banner."""
    tenant, engagement = _engagement_with_tenant()
    uploaded_file = factory_uploaded_file_model(tenant.id)
    engagement.banner_file_id = uploaded_file.id
    association = EngagementFile(
        engagement_id=engagement.id, file_id=uploaded_file.id)
    session.add(association)
    session.commit()

    result = EngagementFileSchema().dump(association)

    assert result['location'] == 'banner'
    assert result['uploaded_file']['id'] == str(uploaded_file.id)


def test_schema_marks_image_widget_file_location(session):
    """An UploadedFile referenced by an image widget is reported as a widget file."""
    tenant, engagement = _engagement_with_tenant()
    widget = factory_widget_model({'engagement_id': engagement.id})
    uploaded_file = factory_uploaded_file_model(tenant.id)
    image = WidgetImage(widget_id=widget.id,
                        engagement_id=engagement.id, file_id=uploaded_file.id)
    association = EngagementFile(
        engagement_id=engagement.id, widget_id=widget.id, file_id=uploaded_file.id
    )
    session.add_all([image, association])
    session.commit()

    assert EngagementFileSchema().dump(association)['location'] == 'widget'


def test_schema_marks_document_widget_file_location(session):
    """An UploadedFile referenced by a document widget is reported as a widget file."""
    tenant, engagement = _engagement_with_tenant()
    widget = factory_widget_model({'engagement_id': engagement.id})
    uploaded_file = factory_uploaded_file_model(tenant.id)
    factory_document_model(
        {'widget_id': widget.id, 'file_id': uploaded_file.id, 'type': 'file'})
    association = EngagementFile(
        engagement_id=engagement.id, widget_id=widget.id, file_id=uploaded_file.id
    )
    session.add(association)
    session.commit()

    assert EngagementFileSchema().dump(association)['location'] == 'widget'


def test_schema_leaves_unreferenced_upload_without_location(session):
    """An associated file without a banner or widget owner has no location."""
    tenant, engagement = _engagement_with_tenant()
    uploaded_file = factory_uploaded_file_model(tenant.id)
    association = EngagementFile(
        engagement_id=engagement.id, file_id=uploaded_file.id)
    session.add(association)
    session.commit()

    assert EngagementFileSchema().dump(association).get('location') is None
