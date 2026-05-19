"""Engagement translation model class.

Manages the Engagement Translations.
"""

from __future__ import annotations
from typing import Optional
from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON
from api.models.language import Language as LanguageModel
from .base_model import BaseModel
from .db import db


class EngagementTranslation(BaseModel):
    """Definition of the Engagement Translation entity."""

    __tablename__ = 'engagement_translation'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    engagement_id = db.Column(db.Integer, db.ForeignKey('engagement.id', ondelete='CASCADE'), nullable=False)
    language_id = db.Column(db.Integer, db.ForeignKey('language.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(50))
    description = db.Column(db.Text())
    rich_description = db.Column(JSON, unique=False, nullable=True)
    description_title = db.Column(db.String(255))
    content = db.Column(db.Text())
    rich_content = db.Column(JSON, unique=False, nullable=True)
    consent_message = db.Column(JSON, unique=False, nullable=True)
    slug = db.Column(db.String(200))
    upcoming_status_block_text = db.Column(JSON, unique=False, nullable=True)
    open_status_block_text = db.Column(JSON, unique=False, nullable=True)
    closed_status_block_text = db.Column(JSON, unique=False, nullable=True)
    open_status_block_button_text = db.Column(db.String(20), unique=False, nullable=True)
    view_results_status_block_button_text = db.Column(db.String(20), unique=False, nullable=True)
    sponsor_name = db.Column(db.String(50))
    feedback_heading = db.Column(db.String(60), unique=False, nullable=True)
    feedback_body = db.Column(JSON, unique=False, nullable=True)
    subscribe_section_heading = db.Column(db.String(60), unique=False, nullable=True)
    subscribe_section_description = db.Column(JSON, unique=False, nullable=True)
    subscribe_consent_message = db.Column(JSON, unique=False, nullable=True)
    more_engagements_heading = db.Column(db.String(60), nullable=True)

    # Add a unique constraint on engagement_id and language_id
    # A engagement has only one version in a particular language
    __table_args__ = (
        UniqueConstraint(
            'engagement_id', 'language_id', name='_engagement_language_uc'
        ),
    )

    @staticmethod
    def get_engagement_translation_by_engagement_and_language(
        engagement_id=None, language_id=None
    ):
        """Get engagement translation by engagement_id and language_id, or by either one."""
        query = EngagementTranslation.query
        if engagement_id is not None:
            query = query.filter_by(engagement_id=engagement_id)
        if language_id is not None:
            query = query.filter_by(language_id=language_id)

        engagement_translation_records = query.all()
        return engagement_translation_records

    @classmethod
    def create_engagement_translation(cls, data):
        """Create a new engagement translation."""
        engagement_translation = cls.__create_new_engagement_translation_entity(data)
        db.session.add(engagement_translation)
        db.session.commit()
        return engagement_translation

    @staticmethod
    def __create_new_engagement_translation_entity(data):
        """Create new engagement translation entity."""
        return EngagementTranslation(
            engagement_id=data.get('engagement_id'),
            language_id=data.get('language_id'),
            name=data.get('name', None),
            description=data.get('description', None),
            rich_description=data.get('rich_description', None),
            content=data.get('content', None),
            rich_content=data.get('rich_content', None),
            consent_message=data.get('consent_message', None),
            slug=data.get('slug', None),
            upcoming_status_block_text=data.get('upcoming_status_block_text', None),
            open_status_block_text=data.get('open_status_block_text', None),
            closed_status_block_text=data.get('closed_status_block_text', None),
            open_status_block_button_text=data.get('open_status_block_button_text', None),
            view_results_status_block_button_text=data.get('view_results_status_block_button_text', None),
            sponsor_name=data.get('sponsor_name', None),
            feedback_heading=data.get('feedback_heading', None),
            feedback_body=data.get('feedback_body', None),
            subscribe_section_heading=data.get('subscribe_section_heading', None),
            subscribe_section_description=data.get('subscribe_section_description', None),
            subscribe_consent_message=data.get('subscribe_consent_message', None),
            more_engagements_heading=data.get('more_engagements_heading', None),
        )

    @staticmethod
    def update_engagement_translation(engagement_translation_id, data: dict) -> Optional[EngagementTranslation]:
        """Update an existing engagement translation."""
        query = EngagementTranslation.query.filter_by(id=engagement_translation_id)
        engagement_translation: EngagementTranslation = query.first()
        if not engagement_translation:
            return None
        query.update(data)
        db.session.commit()
        return engagement_translation

    @staticmethod
    def delete_engagement_translation(engagement_translation_id):
        """Delete a engagement translation."""
        engagement_translation = EngagementTranslation.query.get(engagement_translation_id)
        if engagement_translation:
            db.session.delete(engagement_translation)
            db.session.commit()
            return True
        return False

    @staticmethod
    def get_available_translation_languages(engagement_id):
        """Get the list of translations for this engagement, then tally the languages that are used."""
        available_translations_query = db.session.query(EngagementTranslation.language_id)\
            .filter_by(engagement_id=engagement_id)
        language_list = db.session.query(LanguageModel)\
            .filter(LanguageModel.id.in_(available_translations_query))\
            .all()
        return language_list
