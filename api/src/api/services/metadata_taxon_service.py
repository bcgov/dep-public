"""Service for engagement management."""

from typing import List, Optional

from api.models import db
from api.models.db import transactional
from api.models.engagement_metadata import EngagementMetadata, MetadataTaxon, MetadataTaxonFilterType
from api.models.tenant import Tenant
from api.schemas.engagement_metadata import MetadataTaxonFilterSchema, MetadataTaxonSchema


class MetadataTaxonService:
    """Metadata taxon management service."""

    @staticmethod
    def get_by_id(taxon_id: int) -> Optional[dict]:
        """Get a taxon by id."""
        taxon = MetadataTaxon.query.get(taxon_id)
        if not taxon:
            return None
        return dict(MetadataTaxonSchema().dump(taxon))

    @staticmethod
    def get_by_tenant(tenant_id: int) -> List[dict]:
        """Get all taxa for a tenant."""
        tenant = Tenant.query.get(tenant_id)
        results = tenant.metadata_taxa if tenant else []
        sorted_results = sorted(results, key=lambda taxon: taxon.position)
        return MetadataTaxonSchema(many=True).dump(sorted_results)

    @staticmethod
    def _get_filter_values(taxon: MetadataTaxon) -> list:
        """Get the unique selectable values for a taxon, excluding its wildcard."""
        if taxon.freeform and taxon.include_freeform:
            # Include values specified on engagements as usable options
            values = {entry.value for entry in taxon.entries}
        else:
            values = {preset['value'] for preset in taxon.preset_values}
        if taxon.wildcard_enabled and taxon.wildcard_name:
            values.discard(taxon.wildcard_name)
        return list(values)

    @staticmethod
    def _is_offered(taxon: MetadataTaxon, scope: str) -> bool:
        """Check whether a taxon is a filter offered in the given scope."""
        available_filters = [e.value for e in MetadataTaxonFilterType]
        return (taxon.filter_type in available_filters and
                (taxon.filter_scope or 'public') in (scope, 'both'))

    @staticmethod
    def get_filter_options(tenant_id: int, scope: str = 'public') -> dict:
        """Get the filterable taxa for a tenant that are offered in the given scope ('public' or 'admin')."""
        tenant = Tenant.query.get(tenant_id)
        results = sorted(tenant.metadata_taxa,
                         key=lambda taxon: taxon.position) if tenant else []
        filters = []
        for taxon in results:
            if not MetadataTaxonService._is_offered(taxon, scope):
                continue
            values = MetadataTaxonService._get_filter_values(taxon)
            # Don't return the filter if the user has no options; this prevents
            # the frontend from displaying a useless filter
            if not values:
                continue
            filters.append({
                'taxon_id': taxon.id,
                'name': taxon.name,
                'filter_type': taxon.filter_type,
                'values': values,
                'wildcard_name': taxon.wildcard_name if taxon.wildcard_enabled else None,
            })
        return MetadataTaxonFilterSchema(many=True).dump(filters)

    @staticmethod
    def create(tenant_id: int, taxon_data: dict) -> dict:
        """Create a new taxon."""
        taxon_data['tenant_id'] = tenant_id
        taxon: MetadataTaxon = MetadataTaxonSchema().load(taxon_data, session=db.session)
        taxon.position = MetadataTaxon.query.filter_by(
            tenant_id=tenant_id).count() + 1
        taxon.save()
        return dict(MetadataTaxonSchema().dump(taxon))

    @staticmethod
    def create_default_taxa_for_tenant(tenant_id: int) -> List[dict]:
        """Create the required default taxa for a tenant."""
        default_taxa = [
            {
                'tenant_id': tenant_id,
                'name': 'Region',
                'data_type': 'geo_area',
                'filter_type': MetadataTaxonFilterType.CHIPS_ANY.value,
                'position': 1,
                'is_required': True,
                'wildcard_enabled': True,
                'wildcard_name': 'Province-wide'

            },
            {
                'tenant_id': tenant_id,
                'name': 'Category',
                'data_type': 'text',
                'filter_type': MetadataTaxonFilterType.CHIPS_ALL.value,
                'position': 2,
                'is_required': True,
                'wildcard_enabled': False,
                'wildcard_name': None
            }
        ]
        created_taxa = []
        for taxon_data in default_taxa:
            created_taxa.append(MetadataTaxonService.create(tenant_id, taxon_data))
        return created_taxa

    @staticmethod
    @transactional()
    def update(taxon_id: int, taxon_data: dict) -> dict:
        """Update a taxon."""
        taxon = MetadataTaxon.query.get(taxon_id)
        if not taxon:
            raise KeyError(f'Taxon with id {taxon_id} does not exist.')
        old_wildcard_name = taxon.wildcard_name if taxon.wildcard_enabled else None
        schema = MetadataTaxonSchema()
        taxon = schema.load(taxon_data, session=db.session,
                            instance=taxon, partial=True)
        if (
            old_wildcard_name and
            taxon.wildcard_name and
            taxon.wildcard_name != old_wildcard_name
        ):
            db.session.query(EngagementMetadata).filter(
                EngagementMetadata.taxon_id == taxon_id,
                EngagementMetadata.engagement_id.isnot(None),
                EngagementMetadata.value == old_wildcard_name,
            ).update(
                {EngagementMetadata.value: taxon.wildcard_name},
                synchronize_session=False,
            )
        return schema.dump(taxon)

    @staticmethod
    @transactional()
    def reorder_tenant(tenant_id: int, taxon_ids: List[int]) -> List[dict]:
        """
        Reorder Tenant.

        Reorder all taxa within a specific tenant based on a provided list of taxon IDs,
        setting their positions accordingly.
        """
        # get all taxa for the tenant
        tenant = Tenant.query.get(tenant_id)
        if not tenant:
            raise KeyError(f'Tenant with id {tenant_id} does not exist.')
        taxa: List[MetadataTaxon] = list(tenant.metadata_taxa)
        # create a dictionary of taxon IDs to taxon objects
        taxon_dict = {taxon.id: taxon for taxon in taxa}
        # iterate through the provided taxon IDs and update their positions
        for index, taxon_id in enumerate(taxon_ids):
            taxon = taxon_dict[taxon_id]
            taxon.position = index + 1
        # return MetadataTaxonService.get_by_tenant(tenant_id)
        # It's possible that method was called with a list of taxon IDs that is not
        # contiguous, so we need to ensure that all taxa have a valid position
        return MetadataTaxonService.auto_order_tenant(tenant_id)

    @staticmethod
    @transactional()
    def auto_order_tenant(tenant_id: int) -> List[dict]:
        """
        Automatically order all taxa within a specific tenant based on their current positions.

        This has the benefit of ensuring that the position
        indices are contiguous and that there are no gaps or duplicates. The
        new ordering will be as close to the original as possible.
        """
        tenant = Tenant.query.get(tenant_id)
        schema = MetadataTaxonSchema()
        taxon_ordered = sorted(tenant.metadata_taxa,
                               key=lambda taxon: taxon.position)
        for index, taxon in enumerate(taxon_ordered):
            taxon.position = index + 1
        return schema.dump(taxon_ordered, many=True)

    @staticmethod
    @transactional()
    def delete(taxon_id: int) -> None:
        """Delete a taxon."""
        taxon: MetadataTaxon = MetadataTaxon.query.get(taxon_id)
        if taxon.is_required:
            raise ValueError(f'Cannot delete required taxon with id {taxon_id}.')
        if not taxon:
            raise KeyError(f'Taxon with id {taxon_id} does not exist.')
        for entry in taxon.entries:
            entry.delete()
        taxon.delete()
