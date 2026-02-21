"""seed projects module tasks for pass/fail progression

Revision ID: 7c3b1a9d4e2f
Revises: 4a9f3d8b7c1e
Create Date: 2026-02-21 12:15:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "7c3b1a9d4e2f"
down_revision = "4a9f3d8b7c1e"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        UPDATE tasks
        SET
          title = 'Projects Module: Core Project 1 passed review.',
          description = 'First backend project accepted in manual review.',
          weight = 40,
          is_bonus = false,
          sort_order = 1,
          is_active = true,
          updated_at = NOW()
        WHERE challenge_id = 'projects_core_1'
          AND module_id = (SELECT id FROM modules WHERE key = 'projects')
        """
    )

    op.execute(
        """
        INSERT INTO tasks (module_id, challenge_id, title, description, weight, is_bonus, sort_order, is_active, created_at, updated_at)
        SELECT
          m.id,
          'projects_core_1',
          'Projects Module: Core Project 1 passed review.',
          'First backend project accepted in manual review.',
          40,
          false,
          1,
          true,
          NOW(),
          NOW()
        FROM modules m
        WHERE m.key = 'projects'
          AND NOT EXISTS (
            SELECT 1
            FROM tasks t
            WHERE t.module_id = m.id
              AND t.challenge_id = 'projects_core_1'
          )
        """
    )

    op.execute(
        """
        UPDATE tasks
        SET
          title = 'Projects Module: Core Project 2 passed review.',
          description = 'Second backend project accepted in manual review.',
          weight = 40,
          is_bonus = false,
          sort_order = 2,
          is_active = true,
          updated_at = NOW()
        WHERE challenge_id = 'projects_core_2'
          AND module_id = (SELECT id FROM modules WHERE key = 'projects')
        """
    )

    op.execute(
        """
        INSERT INTO tasks (module_id, challenge_id, title, description, weight, is_bonus, sort_order, is_active, created_at, updated_at)
        SELECT
          m.id,
          'projects_core_2',
          'Projects Module: Core Project 2 passed review.',
          'Second backend project accepted in manual review.',
          40,
          false,
          2,
          true,
          NOW(),
          NOW()
        FROM modules m
        WHERE m.key = 'projects'
          AND NOT EXISTS (
            SELECT 1
            FROM tasks t
            WHERE t.module_id = m.id
              AND t.challenge_id = 'projects_core_2'
          )
        """
    )

    op.execute(
        """
        UPDATE tasks
        SET
          title = 'Projects Module: Bonus real-user deployment passed review.',
          description = 'Optional bonus project with deployed URL and real-user usage signal.',
          weight = 20,
          is_bonus = true,
          sort_order = 3,
          is_active = true,
          updated_at = NOW()
        WHERE challenge_id = 'projects_bonus_real_user'
          AND module_id = (SELECT id FROM modules WHERE key = 'projects')
        """
    )

    op.execute(
        """
        INSERT INTO tasks (module_id, challenge_id, title, description, weight, is_bonus, sort_order, is_active, created_at, updated_at)
        SELECT
          m.id,
          'projects_bonus_real_user',
          'Projects Module: Bonus real-user deployment passed review.',
          'Optional bonus project with deployed URL and real-user usage signal.',
          20,
          true,
          3,
          true,
          NOW(),
          NOW()
        FROM modules m
        WHERE m.key = 'projects'
          AND NOT EXISTS (
            SELECT 1
            FROM tasks t
            WHERE t.module_id = m.id
              AND t.challenge_id = 'projects_bonus_real_user'
          )
        """
    )


def downgrade():
    op.execute(
        """
        DELETE FROM tasks
        WHERE module_id = (SELECT id FROM modules WHERE key = 'projects')
          AND challenge_id IN (
            'projects_core_1',
            'projects_core_2',
            'projects_bonus_real_user'
          )
        """
    )
