"""add leetcode progress table and seed module task

Revision ID: 5d2c7b9a1e3f
Revises: 2a4b6c8d0e1f
Create Date: 2026-03-06 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "5d2c7b9a1e3f"
down_revision = "2a4b6c8d0e1f"
branch_labels = None
depends_on = None


TASK_CHALLENGE_ID = "leetcode_50_total_30_medium"
TASK_TITLE = "Leetcode Module: Reach 50 solved (30 medium)."
TASK_DESCRIPTION = (
    "Link your LeetCode username and reach at least 50 total solved problems with at least 30 medium."
)


def upgrade():
    op.create_table(
        "leetcode_verifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("leetcode_username", sa.String(length=100), nullable=False),
        sa.Column("ownership_code", sa.String(length=64), nullable=False),
        sa.Column("ownership_verified_at", sa.DateTime(), nullable=True),
        sa.Column("total_solved", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("easy_solved", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("medium_solved", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("hard_solved", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("completion_verified_at", sa.DateTime(), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_leetcode_verifications_user_id"),
        sa.UniqueConstraint("leetcode_username", name="uq_leetcode_verifications_username"),
    )

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
          AND module_id = (SELECT id FROM modules WHERE key = 'leetcode')
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
        WHERE m.key = 'leetcode'
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
        WHERE module_id = (SELECT id FROM modules WHERE key = 'leetcode')
          AND challenge_id = '{TASK_CHALLENGE_ID}'
        """
    )
    op.drop_table("leetcode_verifications")
