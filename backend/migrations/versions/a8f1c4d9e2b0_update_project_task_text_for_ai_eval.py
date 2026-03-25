"""update projects task copy to ai evaluation

Revision ID: a8f1c4d9e2b0
Revises: 9d4c2a7b1e0f
Create Date: 2026-03-25 13:20:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "a8f1c4d9e2b0"
down_revision = "9d4c2a7b1e0f"
branch_labels = None
depends_on = None


def upgrade():
  op.execute(
    """
    UPDATE tasks
    SET
      title = 'Projects Module: Core Project 1 passed AI evaluation.',
      description = 'First backend project accepted by automated AI layer checks.',
      updated_at = NOW()
    WHERE challenge_id = 'projects_core_1'
      AND module_id = (SELECT id FROM modules WHERE key = 'projects')
    """
  )

  op.execute(
    """
    UPDATE tasks
    SET
      title = 'Projects Module: Core Project 2 passed AI evaluation.',
      description = 'Second backend project accepted by automated AI layer checks.',
      updated_at = NOW()
    WHERE challenge_id = 'projects_core_2'
      AND module_id = (SELECT id FROM modules WHERE key = 'projects')
    """
  )

  op.execute(
    """
    UPDATE tasks
    SET
      title = 'Projects Module: Bonus real-user deployment passed AI evaluation.',
      description = 'Optional bonus project with deployed URL and real-user usage signal.',
      updated_at = NOW()
    WHERE challenge_id = 'projects_bonus_real_user'
      AND module_id = (SELECT id FROM modules WHERE key = 'projects')
    """
  )


def downgrade():
  op.execute(
    """
    UPDATE tasks
    SET
      title = 'Projects Module: Core Project 1 passed review.',
      description = 'First backend project accepted in manual review.',
      updated_at = NOW()
    WHERE challenge_id = 'projects_core_1'
      AND module_id = (SELECT id FROM modules WHERE key = 'projects')
    """
  )

  op.execute(
    """
    UPDATE tasks
    SET
      title = 'Projects Module: Core Project 2 passed review.',
      description = 'Second backend project accepted in manual review.',
      updated_at = NOW()
    WHERE challenge_id = 'projects_core_2'
      AND module_id = (SELECT id FROM modules WHERE key = 'projects')
    """
  )

  op.execute(
    """
    UPDATE tasks
    SET
      title = 'Projects Module: Bonus real-user deployment passed review.',
      description = 'Optional bonus project with deployed URL and real-user usage signal.',
      updated_at = NOW()
    WHERE challenge_id = 'projects_bonus_real_user'
      AND module_id = (SELECT id FROM modules WHERE key = 'projects')
    """
  )
