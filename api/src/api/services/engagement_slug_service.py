"""Service for engagement slug management."""
from api.models.engagement_slug import EngagementSlug as EngagementSlugModel
from api.models.engagement import Engagement as EngagementModel
from api.constants.engagement_status import Status
from api.services.slug_generation_service import SlugGenerationService


class EngagementSlugService:
    """Service for engagement slug management."""

    @classmethod
    def get_engagement_slug(cls, slug: str) -> EngagementSlugModel:
        """Get an engagement slug by slug."""
        engagement_slug = EngagementSlugModel.find_by_slug(slug)
        if not engagement_slug:
            raise ValueError(f'No engagement slug found for {slug}')
        return {
            'slug': engagement_slug.slug,
            'engagement_id': engagement_slug.engagement_id,
        }

    @classmethod
    def get_engagement_slug_by_engagement_id(cls, engagement_id: int) -> EngagementSlugModel:
        """Get an engagement slug by slug."""
        engagement_slug = EngagementSlugModel.find_by_engagement_id(engagement_id)
        if not engagement_slug:
            return {
                'slug': '',
                'engagement_id': engagement_id,
            }
        return {
            'slug': engagement_slug.slug,
            'engagement_id': engagement_slug.engagement_id,
        }

    @classmethod
    def create_engagement_slug(cls, engagement_id: int) -> EngagementSlugModel:
        """Create an engagement slug."""
        existing_slug = EngagementSlugModel.find_by_engagement_id(engagement_id)
        if existing_slug:
            return {
                'slug': existing_slug.slug,
                'engagement_id': existing_slug.engagement_id,
            }

        engagement = cls._verify_engagement(engagement_id)
        slug = cls.generate_unique_slug(engagement.name)
        engagement_slug = EngagementSlugModel(engagement_id=engagement_id, slug=slug)
        engagement_slug.save()
        return {
            'slug': engagement_slug.slug,
            'engagement_id': engagement_slug.engagement_id,
        }

    @classmethod
    def generate_unique_slug(cls, text: str) -> str:
        """Generate a unique slug."""
        normalized_slug = SlugGenerationService.generate_slug(text)

        similar_slugs = EngagementSlugModel.find_similar_slugs(normalized_slug)

        if not similar_slugs:
            return normalized_slug

        suffix_separator = '-'
        suffix_numbers = cls._get_suffix_numbers(normalized_slug, similar_slugs, suffix_separator)

        counter = max(suffix_numbers) + 1 if suffix_numbers else 1

        unique_slug = f'{normalized_slug}{suffix_separator}{counter}'
        return unique_slug

    @classmethod
    def _get_suffix_numbers(cls, normalized_slug, similar_slugs, suffix_separator):
        suffix_numbers = []
        for similar_slug in similar_slugs:
            slug_parts = similar_slug.slug.split(normalized_slug + suffix_separator)
            if len(slug_parts) > 1:
                suffix = slug_parts[-1]
                if suffix.isdigit():
                    suffix_numbers.append(int(suffix))
        return suffix_numbers

    @classmethod
    def update_engagement_slug(cls, slug: str, engagement_id: int) -> EngagementSlugModel:
        """Update an engagement slug."""
        cls._verify_engagement(engagement_id)
        existing_slug = EngagementSlugModel.find_by_slug(slug)
        if existing_slug and existing_slug.engagement_id != engagement_id:
            raise ValueError(f'{slug} is already used by another engagement')

        engagement_slug = EngagementSlugModel.find_by_engagement_id(engagement_id)
        if engagement_slug:
            engagement_slug.slug = slug
        else:
            engagement_slug = EngagementSlugModel(engagement_id=engagement_id, slug=slug)

        engagement_slug.save()
        return {
            'slug': engagement_slug.slug,
            'engagement_id': engagement_slug.engagement_id,
        }

    @staticmethod
    def _verify_engagement(engagement_id):
        """Verify the engagement."""
        if not engagement_id:
            raise KeyError('engagement_id is required')
        engagement = EngagementModel.find_by_id(engagement_id)
        valid_statuses = [Status.Draft.value, Status.Scheduled.value]
        if not engagement:
            raise ValueError(f'No engagement found for {engagement_id}')
        if engagement.status_id not in valid_statuses:
            raise ValueError(f'Engagement {engagement_id} has already been published; cannot update slug.')
        return engagement
