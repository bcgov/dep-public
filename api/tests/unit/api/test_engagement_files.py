"""Tests for the per-engagement file management endpoints."""
import json
from http import HTTPStatus

import pytest

from api.models.engagement_file import EngagementFile
from api.models.widget_image import WidgetImage
from tests.utilities.factory_scenarios import TestEngagementInfo
from tests.utilities.factory_utils import (
    factory_auth_header, factory_engagement_model, factory_tenant_model, factory_uploaded_file_model,
    factory_widget_model)


def _engagement_with_tenant():
    tenant = factory_tenant_model()
    engagement = factory_engagement_model(
        {**TestEngagementInfo.engagement1, 'tenant_id': tenant.id}
    )
    return tenant, engagement


def test_patch_engagement_file_unlinks_banner_file(client,
                                                   jwt, session,
                                                   setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Patching {location: null} unlinks a banner file from its engagement."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    tenant, engagement = _engagement_with_tenant()
    uploaded_file = factory_uploaded_file_model(tenant.id)
    engagement.banner_file_id = uploaded_file.id
    association = EngagementFile(
        engagement_id=engagement.id, file_id=uploaded_file.id)
    session.add(association)
    session.commit()

    rv = client.patch(
        f'/api/engagements/{engagement.id}/files/{uploaded_file.id}',
        data=json.dumps({'location': None}),
        headers=headers,
        content_type='application/json',
    )

    assert rv.status_code == HTTPStatus.OK
    # BaseSchema strips None values from dump output, so location is simply absent.
    assert 'location' not in rv.json
    session.refresh(engagement)
    session.refresh(association)
    assert engagement.banner_file_id is None
    assert association.removed_at is not None


def test_patch_engagement_file_unlinks_widget_file(client,
                                                   jwt, session,
                                                   setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Patching {location: null} removes a file's widget-image/document usage."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
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

    rv = client.patch(
        f'/api/engagements/{engagement.id}/files/{uploaded_file.id}',
        data=json.dumps({'location': None}),
        headers=headers,
        content_type='application/json',
    )

    assert rv.status_code == HTTPStatus.OK
    session.refresh(association)
    assert session.get(WidgetImage, image.id) is None
    assert association.removed_at is not None


def test_patch_engagement_file_rejects_new_location(client,
                                                    jwt, session,
                                                    setup_admin_user_and_claims):  # pylint:disable=unused-argument
    """Attempting to set a new location value is not supported."""
    _, claims = setup_admin_user_and_claims
    headers = factory_auth_header(jwt=jwt, claims=claims)
    tenant, engagement = _engagement_with_tenant()
    uploaded_file = factory_uploaded_file_model(tenant.id)
    association = EngagementFile(
        engagement_id=engagement.id, file_id=uploaded_file.id)
    session.add(association)
    session.commit()

    with pytest.raises(ValueError):
        client.patch(
            f'/api/engagements/{engagement.id}/files/{uploaded_file.id}',
            data=json.dumps({'location': 'banner'}),
            headers=headers,
            content_type='application/json',
        )
