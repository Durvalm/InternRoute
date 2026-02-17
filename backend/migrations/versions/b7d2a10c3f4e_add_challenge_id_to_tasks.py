"""add challenge_id to tasks for coding challenge linkage

Revision ID: b7d2a10c3f4e
Revises: a1b2c3d4e5f6
Create Date: 2026-02-17 20:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b7d2a10c3f4e"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


CHALLENGE_MAPPINGS = [
    (1, "clean_username", "Coding Challenge #1: Clean Username"),
    (2, "word_counter", "Coding Challenge #2: Word Counter"),
    (3, "summarize_orders", "Coding Challenge #3: Build Order Summary"),
    (4, "cart_total", "Coding Challenge #4: Shopping Cart Total with Coupons"),
    (5, "group_anagrams", "Coding Challenge #5: Group Anagrams"),
]


def upgrade():
    op.add_column("tasks", sa.Column("challenge_id", sa.String(length=64), nullable=True))
    op.create_index(
        "ix_tasks_module_challenge_id",
        "tasks",
        ["module_id", "challenge_id"],
        unique=True,
        postgresql_where=sa.text("challenge_id IS NOT NULL"),
    )

    conn = op.get_bind()
    coding_module_id = conn.execute(sa.text("SELECT id FROM modules WHERE key = 'coding'")).scalar()
    if coding_module_id is None:
        return

    for sort_order, challenge_id, title in CHALLENGE_MAPPINGS:
        conn.execute(
            sa.text(
                """
                UPDATE tasks
                SET challenge_id = :challenge_id, updated_at = NOW()
                WHERE module_id = :module_id
                  AND challenge_id IS NULL
                  AND (sort_order = :sort_order OR title = :title)
                """
            ),
            {
                "module_id": coding_module_id,
                "sort_order": sort_order,
                "challenge_id": challenge_id,
                "title": title,
            },
        )


def downgrade():
    op.drop_index("ix_tasks_module_challenge_id", table_name="tasks")
    op.drop_column("tasks", "challenge_id")
