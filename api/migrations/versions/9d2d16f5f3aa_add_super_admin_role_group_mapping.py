"""Add super admin role/group mapping.

Revision ID: 9d2d16f5f3aa
Revises: 8e50e47b7d32
Create Date: 2026-04-30 12:00:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = '9d2d16f5f3aa'
down_revision = '8e50e47b7d32'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        INSERT INTO user_group (created_date, updated_date, id, name, created_by, updated_by)
        SELECT NOW(), NOW(), COALESCE((SELECT MAX(id) + 1 FROM user_group), 1), 'SUPER_ADMIN', NULL, NULL
        WHERE NOT EXISTS (
            SELECT 1 FROM user_group WHERE name = 'SUPER_ADMIN'
        )
        """
    )

    op.execute(
        """
        INSERT INTO user_role (created_date, updated_date, id, name, description, created_by, updated_by)
        SELECT NOW(), NOW(), COALESCE((SELECT MAX(id) + 1 FROM user_role), 1),
               'super_admin', 'Role for system-wide super administrator access', NULL, NULL
        WHERE NOT EXISTS (
            SELECT 1 FROM user_role WHERE name = 'super_admin'
        )
        """
    )

    op.execute(
        """
        INSERT INTO group_role_mapping (created_date, updated_date, id, role_id, group_id, created_by, updated_by)
        SELECT NOW(), NOW(), COALESCE((SELECT MAX(id) + 1 FROM group_role_mapping), 1),
               r.id, g.id, NULL, NULL
        FROM user_group g
        JOIN user_role r ON r.name = 'super_admin'
        WHERE g.name = 'SUPER_ADMIN'
          AND NOT EXISTS (
              SELECT 1
              FROM group_role_mapping m
              WHERE m.group_id = g.id
                AND m.role_id = r.id
          )
        """
    )


def downgrade():
    op.execute(
        """
        DELETE FROM user_group_membership
        WHERE group_id IN (
            SELECT id FROM user_group WHERE name = 'SUPER_ADMIN'
        )
        """
    )

    op.execute(
        """
        DELETE FROM group_role_mapping
        WHERE group_id IN (
            SELECT id FROM user_group WHERE name = 'SUPER_ADMIN'
        )
        OR role_id IN (
            SELECT id FROM user_role WHERE name = 'super_admin'
        )
        """
    )

    op.execute("DELETE FROM user_role WHERE name = 'super_admin'")
    op.execute("DELETE FROM user_group WHERE name = 'SUPER_ADMIN'")
