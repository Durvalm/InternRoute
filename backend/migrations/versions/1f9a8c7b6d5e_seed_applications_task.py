"""seed applications completion task

Revision ID: 1f9a8c7b6d5e
Revises: 6f3c1b9e2d7a
Create Date: 2026-03-03 16:15:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "1f9a8c7b6d5e"
down_revision = "6f3c1b9e2d7a"
branch_labels = None
depends_on = None


TASK_CHALLENGE_ID = "applications_checklist_complete"
TASK_TITLE = "Applications Module: Complete application strategy checklist."
TASK_DESCRIPTION = (
    "Finish the in-module checklist covering job search channels, application speed, OAs, and tracking."
)


def upgrade():
    op.execute(
        f"""
        UPDATE tasks
        SET
          title = '{TASK_TITLE}',
          description = '{TASK_DESCRIPTION}',
          weight = 100,
          is_bonus = false,
          sort_order = 1,
          is_active = true,
          updated_at = NOW()
        WHERE challenge_id = '{TASK_CHALLENGE_ID}'
          AND module_id = (SELECT id FROM modules WHERE key = 'applications')
        """
    )

    op.execute(
        f"""
        INSERT INTO tasks (module_id, challenge_id, title, description, weight, is_bonus, sort_order, is_active, created_at, updated_at)
        SELECT
          m.id,
          '{TASK_CHALLENGE_ID}',
          '{TASK_TITLE}',
          '{TASK_DESCRIPTION}',
          100,
          false,
          1,
          true,
          NOW(),
          NOW()
        FROM modules m
        WHERE m.key = 'applications'
          AND NOT EXISTS (
            SELECT 1
            FROM tasks t
            WHERE t.module_id = m.id
              AND t.challenge_id = '{TASK_CHALLENGE_ID}'
          )
        """
    )


def downgrade():
    op.execute(
        f"""
        DELETE FROM tasks
        WHERE module_id = (SELECT id FROM modules WHERE key = 'applications')
          AND challenge_id = '{TASK_CHALLENGE_ID}'
        """
    )
