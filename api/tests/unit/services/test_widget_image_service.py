"""Tests for image widget file replacement."""
from unittest.mock import patch

from api.models.engagement_file import EngagementFile
from api.models.widget_image import WidgetImage
from api.services.widget_image_service import WidgetImageService
from tests.utilities.factory_scenarios import TestEngagementInfo
from tests.utilities.factory_utils import (
    factory_engagement_model, factory_tenant_model, factory_uploaded_file_model, factory_widget_model)


def test_replacing_image_file_retires_previous_engagement_file(session, monkeypatch):
    """Replacing an image widget file records removal details for the old file."""
    tenant = factory_tenant_model()
    engagement = factory_engagement_model(
        {**TestEngagementInfo.engagement1, 'tenant_id': tenant.id}
    )
    widget = factory_widget_model({'engagement_id': engagement.id})
    previous_file = factory_uploaded_file_model(tenant.id)
    replacement_file = factory_uploaded_file_model(tenant.id)
    image = WidgetImage(
        widget_id=widget.id,
        engagement_id=engagement.id,
        file_id=previous_file.id,
    )
    previous_association = EngagementFile(
        engagement_id=engagement.id,
        widget_id=widget.id,
        file_id=previous_file.id,
    )
    replacement_association = EngagementFile(
        engagement_id=engagement.id,
        widget_id=widget.id,
        file_id=replacement_file.id,
    )
    session.add_all([image, previous_association, replacement_association])
    session.commit()
    monkeypatch.setattr(
        'api.services.engagement_file_service.TokenInfo.get_id', lambda: 'editor-id'
    )

    with patch('api.services.widget_image_service.authorization.check_auth'):
        WidgetImageService.update_image(
            widget.id, image.id, {'file_id': replacement_file.id})

    session.refresh(previous_association)
    session.refresh(replacement_association)
    assert previous_association.removed_at is not None
    assert previous_association.removed_by == 'editor-id'
    assert replacement_association.removed_at is None
