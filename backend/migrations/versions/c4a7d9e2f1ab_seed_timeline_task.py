"""seed timeline completion task

Revision ID: c4a7d9e2f1ab
Revises: 8a1c9d2f4b6e
Create Date: 2026-02-15 14:55:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "c4a7d9e2f1ab"
down_revision = "8a1c9d2f4b6e"
branch_labels = None
depends_on = None


TASK_TITLE = "Timeline Module: Understand timeline and recruiting strategy."
OLD_TASK_TITLE = "I understand the timeline and recruiting strategy for internships."


def upgrade():
    op.execute(
        f"""
        UPDATE tasks
        SET title = '{TASK_TITLE}', updated_at = NOW()
        WHERE title = '{OLD_TASK_TITLE}'
          AND module_id = (SELECT id FROM modules WHERE key = 'timeline')
        """
    )

    op.execute(
        f"""
        INSERT INTO tasks (module_id, title, description, weight, is_bonus, sort_order, is_active, created_at, updated_at)
        SELECT
          m.id,
          '{TASK_TITLE}',
          'This includes seasons, summers-left planning, and why applying timing matters.',
          100,
          false,
          1,
          true,
          NOW(),
          NOW()
        FROM modules m
        WHERE m.key = 'timeline'
          AND NOT EXISTS (
            SELECT 1
            FROM tasks t
            WHERE t.module_id = m.id
              AND t.title = '{TASK_TITLE}'
          )
        """
    )


def downgrade():
    op.execute(
        f"""
        DELETE FROM tasks
        WHERE title IN ('{TASK_TITLE}', '{OLD_TASK_TITLE}')
          AND module_id = (SELECT id FROM modules WHERE key = 'timeline')
        """
    )
