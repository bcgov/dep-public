"""Tests for querying engagement-file associations."""

from api.models.engagement_file import EngagementFile
from api.services.engagement_file_service import EngagementFileService
from tests.utilities.factory_scenarios import TestEngagementInfo
from tests.utilities.factory_utils import factory_engagement_model, factory_tenant_model, factory_uploaded_file_model


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
