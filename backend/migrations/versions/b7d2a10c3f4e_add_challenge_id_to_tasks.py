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
    (1, "string_reversal", "Coding Challenge #1: String Reversal"),
    (2, "fizzbuzz_logic", "Coding Challenge #2: FizzBuzz Logic"),
    (3, "list_filtering", "Coding Challenge #3: List Filtering"),
    (4, "dictionary_basics", "Coding Challenge #4: Dictionary Basics"),
    (5, "palindrome_check", "Coding Challenge #5: Palindrome Check"),
    (6, "sum_of_two", "Coding Challenge #6: Sum of Two"),
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
