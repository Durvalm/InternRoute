"""align support module progression order with opportunities before interview prep

Revision ID: f2b7d1c9e4a0
Revises: e7c3b9a1d2f4
Create Date: 2026-04-11 00:50:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "f2b7d1c9e4a0"
down_revision = "e7c3b9a1d2f4"
branch_labels = None
depends_on = None


def upgrade():
    # Ensure opportunities exists as a support module.
    op.execute(
        """
        INSERT INTO modules (key, name, category, overall_weight, unlock_threshold, next_module_id, sort_order)
        SELECT 'opportunities', 'Opportunities', 'other', 0, 100, NULL, 6
        WHERE NOT EXISTS (SELECT 1 FROM modules WHERE key = 'opportunities')
        """
    )

    # Keep opportunities as non-readiness support (weight 0) and place it before interview prep.
    op.execute("UPDATE modules SET overall_weight = 0, unlock_threshold = 100, sort_order = 6 WHERE key = 'opportunities'")
    op.execute("UPDATE modules SET sort_order = 7 WHERE key = 'interview_prep'")
    op.execute("UPDATE modules SET sort_order = 8 WHERE key = 'leetcode'")

    # Chain module pointers to match the intended flow.
    op.execute(
        """
        UPDATE modules
        SET next_module_id = (SELECT id FROM modules m2 WHERE m2.key = 'opportunities')
        WHERE key = 'applications'
        """
    )
    op.execute(
        """
        UPDATE modules
        SET next_module_id = (SELECT id FROM modules m2 WHERE m2.key = 'interview_prep')
        WHERE key = 'opportunities'
        """
    )
    op.execute(
        """
        UPDATE modules
        SET next_module_id = (SELECT id FROM modules m2 WHERE m2.key = 'leetcode')
        WHERE key = 'interview_prep'
        """
    )


def downgrade():
    # Restore prior chain.
    op.execute(
        """
        UPDATE modules
        SET next_module_id = (SELECT id FROM modules m2 WHERE m2.key = 'interview_prep')
        WHERE key = 'applications'
        """
    )
    op.execute(
        """
        UPDATE modules
        SET next_module_id = (SELECT id FROM modules m2 WHERE m2.key = 'leetcode')
        WHERE key = 'interview_prep'
        """
    )

    # Restore prior sort order for interview prep and leetcode.
    op.execute("UPDATE modules SET sort_order = 6 WHERE key = 'interview_prep'")
    op.execute("UPDATE modules SET sort_order = 7 WHERE key = 'leetcode'")

    # Remove opportunities only if it has no tasks (safe rollback path).
    op.execute(
        """
        DELETE FROM modules
        WHERE key = 'opportunities'
          AND NOT EXISTS (
            SELECT 1 FROM tasks WHERE tasks.module_id = modules.id
          )
        """
    )
