"""add progression foundation tables and module seed data

Revision ID: 8a1c9d2f4b6e
Revises: d7a4c0b2e1f9
Create Date: 2026-02-13 14:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "8a1c9d2f4b6e"
down_revision = "d7a4c0b2e1f9"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("user_progress", sa.Column("coding_override_score", sa.Integer(), nullable=True))
    op.add_column("user_progress", sa.Column("coding_override_source", sa.String(length=100), nullable=True))

    op.create_table(
        "modules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("overall_weight", sa.Integer(), nullable=False),
        sa.Column("unlock_threshold", sa.Integer(), nullable=False, server_default=sa.text("80")),
        sa.Column("next_module_id", sa.Integer(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["next_module_id"], ["modules.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("module_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("weight", sa.Integer(), nullable=False),
        sa.Column("is_bonus", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user_task_completions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("task_id", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "task_id", name="uq_user_task_completion"),
    )

    modules_table = sa.table(
        "modules",
        sa.column("key", sa.String(length=64)),
        sa.column("name", sa.String(length=120)),
        sa.column("category", sa.String(length=32)),
        sa.column("overall_weight", sa.Integer()),
        sa.column("unlock_threshold", sa.Integer()),
        sa.column("sort_order", sa.Integer()),
    )

    op.bulk_insert(
        modules_table,
        [
            {"key": "timeline", "name": "Timeline & Strategy", "category": "other", "overall_weight": 5, "unlock_threshold": 80, "sort_order": 1},
            {"key": "coding", "name": "Coding Skills", "category": "coding", "overall_weight": 20, "unlock_threshold": 80, "sort_order": 2},
            {"key": "projects", "name": "Projects", "category": "projects", "overall_weight": 30, "unlock_threshold": 80, "sort_order": 3},
            {"key": "resume", "name": "Resume", "category": "resume", "overall_weight": 10, "unlock_threshold": 80, "sort_order": 4},
            {"key": "applications", "name": "Applications", "category": "other", "overall_weight": 5, "unlock_threshold": 80, "sort_order": 5},
            {"key": "interview_prep", "name": "Interview Prep", "category": "other", "overall_weight": 5, "unlock_threshold": 80, "sort_order": 6},
            {"key": "leetcode", "name": "Leetcode", "category": "other", "overall_weight": 25, "unlock_threshold": 80, "sort_order": 7},
        ],
    )

    op.execute("UPDATE modules SET next_module_id = (SELECT id FROM modules m2 WHERE m2.key = 'coding') WHERE key = 'timeline'")
    op.execute("UPDATE modules SET next_module_id = (SELECT id FROM modules m2 WHERE m2.key = 'projects') WHERE key = 'coding'")
    op.execute("UPDATE modules SET next_module_id = (SELECT id FROM modules m2 WHERE m2.key = 'resume') WHERE key = 'projects'")
    op.execute("UPDATE modules SET next_module_id = (SELECT id FROM modules m2 WHERE m2.key = 'applications') WHERE key = 'resume'")
    op.execute("UPDATE modules SET next_module_id = (SELECT id FROM modules m2 WHERE m2.key = 'interview_prep') WHERE key = 'applications'")
    op.execute("UPDATE modules SET next_module_id = (SELECT id FROM modules m2 WHERE m2.key = 'leetcode') WHERE key = 'interview_prep'")


def downgrade():
    op.drop_table("user_task_completions")
    op.drop_table("tasks")
    op.drop_table("modules")
    op.drop_column("user_progress", "coding_override_source")
    op.drop_column("user_progress", "coding_override_score")
