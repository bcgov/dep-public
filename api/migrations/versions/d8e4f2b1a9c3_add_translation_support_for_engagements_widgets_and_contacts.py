"""Add translation support for engagements, widgets, and contacts.

This migration consolidates the following changes:
- Adds translatable content fields to engagement_translation and migrates
  existing data out of the engagement table.
- Extends widget_translation to cover timeline, events, and documents widgets
  (via nullable sub-item FK columns and partial unique indexes), replacing the
  old dedicated per-widget-type translation tables.
- Creates widget_image_translation for image widget translations.
- Creates contact_translation for contact field translations.

Revision ID: d8e4f2b1a9c3
Revises: a6f15ee2c7b4
Create Date: 2026-05-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision = 'd8e4f2b1a9c3'
down_revision = 'a6f15ee2c7b4'
branch_labels = None
depends_on = None

# Columns being migrated out of `engagement` -> `engagement_translation`
_TRANSLATABLE_COLUMNS = [
    'description',
    'rich_description',
    'description_title',
    'feedback_heading',
    'feedback_body',
    'consent_message',
    'subscribe_section_heading',
    'subscribe_section_description',
    'subscribe_consent_message',
    'sponsor_name',
    'more_engagements_heading',
]


def upgrade():
    # ==================================================================
    # PART 1 — engagement_translation: new fields + data migration
    # ==================================================================

    # 1a. Add the new translatable columns to engagement_translation.
    with op.batch_alter_table('engagement_translation', schema=None) as batch_op:
        batch_op.add_column(sa.Column('feedback_heading',
                            sa.String(length=60), nullable=True))
        batch_op.add_column(
            sa.Column('feedback_body', sa.JSON(), nullable=True))
        batch_op.add_column(
            sa.Column('subscribe_section_heading', sa.String(length=60), nullable=True))
        batch_op.add_column(
            sa.Column('subscribe_section_description', sa.JSON(), nullable=True))
        batch_op.add_column(
            sa.Column('subscribe_consent_message', sa.JSON(), nullable=True))
        batch_op.add_column(
            sa.Column('more_engagements_heading', sa.String(length=60), nullable=True))

    # 1b. Upsert English translation rows for every existing engagement,
    #     copying all translatable fields from the engagement table.
    op.execute(
        """
        INSERT INTO engagement_translation (
            engagement_id,
            language_id,
            name,
            description,
            rich_description,
            description_title,
            feedback_heading,
            feedback_body,
            consent_message,
            subscribe_section_heading,
            subscribe_section_description,
            subscribe_consent_message,
            sponsor_name,
            more_engagements_heading,
            created_date,
            updated_date,
            created_by,
            updated_by
        )
        SELECT
            e.id,
            l.id,
            e.name,
            e.description,
            e.rich_description,
            e.description_title,
            e.feedback_heading,
            e.feedback_body,
            e.consent_message,
            e.subscribe_section_heading,
            e.subscribe_section_description,
            e.subscribe_consent_message,
            e.sponsor_name,
            e.more_engagements_heading,
            NOW(),
            NOW(),
            'migration',
            'migration'
        FROM engagement e
        CROSS JOIN language l
        WHERE l.code = 'en'
        ON CONFLICT (engagement_id, language_id) DO UPDATE SET
            name                          = EXCLUDED.name,
            description                   = EXCLUDED.description,
            rich_description              = EXCLUDED.rich_description,
            description_title             = EXCLUDED.description_title,
            feedback_heading              = EXCLUDED.feedback_heading,
            feedback_body                 = EXCLUDED.feedback_body,
            consent_message               = EXCLUDED.consent_message,
            subscribe_section_heading     = EXCLUDED.subscribe_section_heading,
            subscribe_section_description = EXCLUDED.subscribe_section_description,
            subscribe_consent_message     = EXCLUDED.subscribe_consent_message,
            sponsor_name                  = EXCLUDED.sponsor_name,
            more_engagements_heading      = EXCLUDED.more_engagements_heading
        """
    )

    # 1c. Drop the now-redundant columns from the engagement table.
    with op.batch_alter_table('engagement') as batch_op:
        for col in _TRANSLATABLE_COLUMNS:
            batch_op.drop_column(col)

    # 1d. Add translatable CTA button text fields to engagement_translation.
    with op.batch_alter_table('engagement_translation') as batch_op:
        batch_op.add_column(sa.Column(
            'open_status_block_button_text', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column(
            'view_results_status_block_button_text', sa.String(length=20), nullable=True))

    # 1e. Backfill English CTA button text from existing status blocks.
    op.execute(
        """
        UPDATE engagement_translation et
        SET
            open_status_block_button_text = (
                SELECT esb.button_text
                FROM engagement_status_block esb
                WHERE esb.engagement_id = et.engagement_id
                  AND esb.survey_status = 'Open'
                LIMIT 1
            ),
            view_results_status_block_button_text = (
                SELECT esb.button_text
                FROM engagement_status_block esb
                WHERE esb.engagement_id = et.engagement_id
                  AND esb.survey_status = 'ViewResults'
                LIMIT 1
            )
        WHERE et.language_id = (
            SELECT l.id FROM language l WHERE l.code = 'en' LIMIT 1
        )
        """
    )

    # ==================================================================
    # PART 2 — widget_translation: extend for timeline / events / documents
    # ==================================================================

    # 2a. Add sub-item FK columns and a general description column.
    op.add_column('widget_translation', sa.Column(
        'description', sa.Text(), nullable=True))
    op.add_column(
        'widget_translation',
        sa.Column(
            'widget_events_id',
            sa.Integer(),
            sa.ForeignKey('widget_events.id', ondelete='CASCADE'),
            nullable=True,
        ),
    )
    op.add_column(
        'widget_translation',
        sa.Column(
            'widget_documents_id',
            sa.Integer(),
            sa.ForeignKey('widget_documents.id', ondelete='CASCADE'),
            nullable=True,
        ),
    )

    # 2b. Replace the simple unique constraint with three partial indexes.
    op.drop_constraint('unique_widget_language',
                       'widget_translation', type_='unique')

    op.create_index(
        'uix_widget_translation_widget_language',
        'widget_translation',
        ['widget_id', 'language_id'],
        unique=True,
        postgresql_where=sa.text(
            'widget_events_id IS NULL AND widget_documents_id IS NULL'),
    )
    op.create_index(
        'uix_widget_translation_events_language',
        'widget_translation',
        ['widget_events_id', 'language_id'],
        unique=True,
        postgresql_where=sa.text('widget_events_id IS NOT NULL'),
    )
    op.create_index(
        'uix_widget_translation_documents_language',
        'widget_translation',
        ['widget_documents_id', 'language_id'],
        unique=True,
        postgresql_where=sa.text('widget_documents_id IS NOT NULL'),
    )

    # 2c. Migrate listening_description -> description, then drop old column.
    bind = op.get_bind()
    bind.execute(sa.text("""
        UPDATE widget_translation
        SET    description = listening_description
        WHERE  listening_description IS NOT NULL
    """))
    op.drop_column('widget_translation', 'listening_description')

    # 2d. Seed widget_translation with existing timeline widget data
    #     (widget-level row: title + description from widget_timeline).
    bind.execute(sa.text("""
        INSERT INTO widget_translation
            (widget_id, language_id, title, description, created_date, updated_date)
        SELECT wt.widget_id,
               l.id,
               wt.title,
               wt.description,
               NOW(),
               NOW()
        FROM   widget_timeline wt
        CROSS JOIN language l
        WHERE  l.code = 'en'
          AND  (wt.title IS NOT NULL OR wt.description IS NOT NULL)
        ON CONFLICT DO NOTHING
    """))

    # 2e. Seed widget_translation with existing events widget data
    #     (per-event row: title from widget_events, with widget_events_id set).
    bind.execute(sa.text("""
        INSERT INTO widget_translation
            (widget_id, language_id, widget_events_id, title, created_date, updated_date)
        SELECT we.widget_id,
               l.id,
               we.id,
               we.title,
               NOW(),
               NOW()
        FROM   widget_events we
        CROSS JOIN language l
        WHERE  l.code = 'en'
          AND  we.title IS NOT NULL
        ON CONFLICT DO NOTHING
    """))

    # 2f. Seed widget_translation with existing documents widget data
    #     (per-document row: title from widget_documents, with widget_documents_id set).
    bind.execute(sa.text("""
        INSERT INTO widget_translation
            (widget_id, language_id, widget_documents_id, title, created_date, updated_date)
        SELECT wd.widget_id,
               l.id,
               wd.id,
               wd.title,
               NOW(),
               NOW()
        FROM   widget_documents wd
        CROSS JOIN language l
        WHERE  l.code = 'en'
          AND  wd.title IS NOT NULL
        ON CONFLICT DO NOTHING
    """))

    # ==================================================================
    # PART 3 — widget_image_translation table
    # ==================================================================
    op.create_table(
        'widget_image_translation',
        sa.Column('created_date', sa.DateTime(), nullable=False),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('widget_image_id', sa.Integer(),
                  sa.ForeignKey('widget_image.id', ondelete='CASCADE'), nullable=False),
        sa.Column('language_id', sa.Integer(),
                  sa.ForeignKey('language.id', ondelete='CASCADE'), nullable=False),
        sa.Column('alt_text', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('updated_by', sa.String(50), nullable=True),
        sa.UniqueConstraint('widget_image_id', 'language_id',
                            name='unique_widget_image_language'),
    )

    # Seed widget_image_translation from existing widget_image data.
    bind.execute(sa.text("""
        INSERT INTO widget_image_translation
            (widget_image_id, language_id, alt_text, description, created_date, updated_date)
        SELECT wi.id,
               l.id,
               wi.alt_text,
               wi.description,
               NOW(),
               NOW()
        FROM   widget_image wi
        CROSS JOIN language l
        WHERE  l.code = 'en'
          AND  (wi.alt_text IS NOT NULL OR wi.description IS NOT NULL)
        ON CONFLICT DO NOTHING
    """))

    # ==================================================================
    # PART 4 — contact_translation table
    # ==================================================================
    op.create_table(
        'contact_translation',
        sa.Column('created_date', sa.DateTime(), nullable=False),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('contact_id', sa.Integer(),
                  sa.ForeignKey('contact.id', ondelete='CASCADE'), nullable=False),
        sa.Column('language_id', sa.Integer(),
                  sa.ForeignKey('language.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(50), nullable=True),
        sa.Column('title', sa.String(50), nullable=True),
        sa.Column('address', sa.String(150), nullable=True),
        sa.Column('bio', sa.String(500), nullable=True),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('updated_by', sa.String(50), nullable=True),
        sa.UniqueConstraint('contact_id', 'language_id',
                            name='unique_contact_language'),
    )


def downgrade():
    # ==================================================================
    # PART 4 — contact_translation (reverse)
    # ==================================================================
    op.drop_table('contact_translation')

    # ==================================================================
    # PART 3 — widget_image_translation (reverse)
    # ==================================================================
    op.drop_table('widget_image_translation')

    # ==================================================================
    # PART 2 — widget_translation (reverse)
    # ==================================================================

    # Remove sub-item rows before restoring the simple unique constraint.
    bind = op.get_bind()
    bind.execute(sa.text(
        'DELETE FROM widget_translation WHERE widget_events_id IS NOT NULL OR widget_documents_id IS NOT NULL'
    ))

    # Restore listening_description column and copy data back for WhoIsListening.
    op.add_column('widget_translation', sa.Column(
        'listening_description', sa.Text(), nullable=True))
    bind.execute(sa.text("""
        UPDATE widget_translation
        SET    listening_description = description
        WHERE  description IS NOT NULL
          AND  widget_events_id IS NULL
          AND  widget_documents_id IS NULL
          AND  EXISTS (
              SELECT 1 FROM widget w
              WHERE  w.id = widget_translation.widget_id
                AND  w.widget_type_id = 1
          )
    """))

    op.drop_index('uix_widget_translation_widget_language',
                  table_name='widget_translation')
    op.drop_index('uix_widget_translation_events_language',
                  table_name='widget_translation')
    op.drop_index('uix_widget_translation_documents_language',
                  table_name='widget_translation')

    op.drop_column('widget_translation', 'widget_documents_id')
    op.drop_column('widget_translation', 'widget_events_id')
    op.drop_column('widget_translation', 'description')

    op.create_unique_constraint('unique_widget_language', 'widget_translation', [
                                'widget_id', 'language_id'])

    # ==================================================================
    # PART 1 — engagement_translation (reverse)
    # ==================================================================

    # Remove CTA button text columns.
    with op.batch_alter_table('engagement_translation') as batch_op:
        batch_op.drop_column('view_results_status_block_button_text')
        batch_op.drop_column('open_status_block_button_text')

    # Re-add translatable columns to engagement (all nullable).
    with op.batch_alter_table('engagement') as batch_op:
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column('rich_description', JSON(), nullable=True))
        batch_op.add_column(sa.Column('description_title',
                            sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('feedback_heading',
                            sa.String(length=60), nullable=True))
        batch_op.add_column(sa.Column('feedback_body', JSON(), nullable=True))
        batch_op.add_column(
            sa.Column('consent_message', JSON(), nullable=True))
        batch_op.add_column(
            sa.Column('subscribe_section_heading', sa.String(length=60), nullable=True))
        batch_op.add_column(
            sa.Column('subscribe_section_description', JSON(), nullable=True))
        batch_op.add_column(
            sa.Column('subscribe_consent_message', JSON(), nullable=True))
        batch_op.add_column(
            sa.Column('sponsor_name', sa.String(length=50), nullable=True))
        batch_op.add_column(
            sa.Column('more_engagements_heading', sa.String(length=60), nullable=True))

    # Copy data back from the English translation rows.
    op.execute(
        """
        UPDATE engagement e
        SET
            description                   = et.description,
            rich_description              = et.rich_description,
            description_title             = et.description_title,
            feedback_heading              = et.feedback_heading,
            feedback_body                 = et.feedback_body,
            consent_message               = et.consent_message,
            subscribe_section_heading     = et.subscribe_section_heading,
            subscribe_section_description = et.subscribe_section_description,
            subscribe_consent_message     = et.subscribe_consent_message,
            sponsor_name                  = et.sponsor_name,
            more_engagements_heading      = et.more_engagements_heading
        FROM engagement_translation et
        JOIN language l ON l.id = et.language_id
        WHERE et.engagement_id = e.id
          AND l.code = 'en'
        """
    )

    # Drop the engagement_translation columns added by this migration.
    with op.batch_alter_table('engagement_translation', schema=None) as batch_op:
        batch_op.drop_column('more_engagements_heading')
        batch_op.drop_column('subscribe_consent_message')
        batch_op.drop_column('subscribe_section_description')
        batch_op.drop_column('subscribe_section_heading')
        batch_op.drop_column('feedback_body')
        batch_op.drop_column('feedback_heading')
