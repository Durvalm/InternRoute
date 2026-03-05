"""seed interview prep completion task

Revision ID: 2a4b6c8d0e1f
Revises: 1f9a8c7b6d5e
Create Date: 2026-03-05 11:10:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "2a4b6c8d0e1f"
down_revision = "1f9a8c7b6d5e"
branch_labels = None
depends_on = None


TASK_CHALLENGE_ID = "interview_prep_checklist_complete"
TASK_TITLE = "Interview Prep Module: Complete interview preparation checklist."
TASK_DESCRIPTION = (
    "Finish the in-module checklist covering behavioral prep, technical prep, and interview execution basics."
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
          AND module_id = (SELECT id FROM modules WHERE key = 'interview_prep')
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
        WHERE m.key = 'interview_prep'
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
        WHERE module_id = (SELECT id FROM modules WHERE key = 'interview_prep')
          AND challenge_id = '{TASK_CHALLENGE_ID}'
        """
    )
