"""Tests for querying engagement-file associations."""
from datetime import UTC, datetime

import pytest

from api.models.engagement_file import EngagementFile
from api.models.widget_image import WidgetImage
from api.services.engagement_file_service import EngagementFileService
from tests.utilities.factory_scenarios import TestEngagementInfo
from tests.utilities.factory_utils import (
    factory_document_model, factory_engagement_model, factory_tenant_model, factory_uploaded_file_model,
    factory_widget_model)


def test_get_engagement_files_excludes_deleted_files_by_default(session):
    """A soft-deleted UploadedFile is hidden from the Files tab unless requested."""
    tenant = factory_tenant_model()
    engagement = factory_engagement_model(
        {**TestEngagementInfo.engagement1, 'tenant_id': tenant.id}
    )
    active_file = factory_uploaded_file_model(tenant.id, filename='active.pdf')
    deleted_file = factory_uploaded_file_model(
        tenant.id, filename='deleted.pdf')
    deleted_file.deleted_at = datetime.now(UTC)
    deleted_file.deleted_by = 'someuser'
    session.add_all(
        [
            EngagementFile(engagement_id=engagement.id,
                           file_id=active_file.id),
            EngagementFile(engagement_id=engagement.id,
                           file_id=deleted_file.id),
        ]
    )
    session.commit()

    results = EngagementFileService(
        session).get_engagement_files(engagement.id)
    assert [item.uploaded_file.filename for item in results] == [
        'active.pdf']

    all_results = EngagementFileService(session).get_engagement_files(
        engagement.id, include_deleted=True)
    assert {item.uploaded_file.filename for item in all_results} == {
        'active.pdf', 'deleted.pdf'}


def test_unlink_file_clears_banner_and_retires_association(session):
    """Unlinking a banner file clears the engagement banner and retires the association."""
    tenant = factory_tenant_model()
    engagement = factory_engagement_model(
        {**TestEngagementInfo.engagement1, 'tenant_id': tenant.id}
    )
    uploaded_file = factory_uploaded_file_model(tenant.id)
    engagement.banner_file_id = uploaded_file.id
    association = EngagementFile(
        engagement_id=engagement.id, file_id=uploaded_file.id)
    session.add(association)
    session.commit()

    EngagementFileService(session).unlink_file(association)
    session.refresh(association)

    assert engagement.banner_file_id is None
    assert association.removed_at is not None


def test_unlink_file_removes_widget_image_and_document_widgets(session):
    """Unlinking a widget file deletes its widget-image/document rows and retires the association."""
    tenant = factory_tenant_model()
    engagement = factory_engagement_model(
        {**TestEngagementInfo.engagement1, 'tenant_id': tenant.id}
    )
    widget = factory_widget_model({'engagement_id': engagement.id})
    uploaded_file = factory_uploaded_file_model(tenant.id)
    image = WidgetImage(widget_id=widget.id,
                        engagement_id=engagement.id, file_id=uploaded_file.id)
    document = factory_document_model(
        {'widget_id': widget.id, 'file_id': uploaded_file.id, 'type': 'file'})
    association = EngagementFile(
        engagement_id=engagement.id, widget_id=widget.id, file_id=uploaded_file.id
    )
    session.add_all([image, association])
    session.commit()

    EngagementFileService(session).unlink_file(association)
    session.refresh(association)

    assert session.get(WidgetImage, image.id) is None
    assert session.get(type(document), document.id) is None
    assert association.removed_at is not None


def test_unlink_file_rejects_non_engagement_file_input(session):
    """Passing something other than an EngagementFile/str raises an error."""
    file_service = EngagementFileService(session)
    with pytest.raises(AttributeError):
        file_service.unlink_file(12345)  # type: ignore


def test_unlink_file_requires_engagement_id_when_passing_file_by_id(session):
    """Passing a file ID without an engagement ID raises an error."""
    file_service = EngagementFileService(session)
    with pytest.raises(ValueError):
        file_service.unlink_file('some-file-id')  # type: ignore


def test_get_engagement_files_returns_files_ordered_by_name(session):
    """The Files tab receives only this engagement's files in name order."""
    tenant = factory_tenant_model()
    engagement = factory_engagement_model(
        {**TestEngagementInfo.engagement1, 'tenant_id': tenant.id}
    )
    other_engagement = factory_engagement_model(
        {**TestEngagementInfo.engagement2, 'tenant_id': tenant.id}
    )
    zoo_file = factory_uploaded_file_model(tenant.id, filename='zoo.pdf')
    alpha_file = factory_uploaded_file_model(tenant.id, filename='alpha.pdf')
    other_file = factory_uploaded_file_model(tenant.id, filename='other.pdf')
    session.add_all(
        [
            EngagementFile(engagement_id=engagement.id, file_id=zoo_file.id),
            EngagementFile(engagement_id=engagement.id, file_id=alpha_file.id),
            EngagementFile(engagement_id=other_engagement.id,
                           file_id=other_file.id),
        ]
    )
    session.commit()

    results = EngagementFileService(
        session).get_engagement_files(engagement.id)

    assert [item.uploaded_file.filename for item in results] == [
        'alpha.pdf', 'zoo.pdf']
