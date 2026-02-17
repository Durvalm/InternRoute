"""seed coding challenge tasks for skills ide

Revision ID: f7e1c2d3a4b5
Revises: c4a7d9e2f1ab
Create Date: 2026-02-17 17:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f7e1c2d3a4b5"
down_revision = "c4a7d9e2f1ab"
branch_labels = None
depends_on = None


TASKS = [
    {
        "title": "Coding Challenge #1: String Reversal",
        "description": "Read a string from stdin and print it reversed.",
        "sort_order": 1,
    },
    {
        "title": "Coding Challenge #2: FizzBuzz Logic",
        "description": "Read n from stdin and print the FizzBuzz sequence from 1 to n.",
        "sort_order": 2,
    },
    {
        "title": "Coding Challenge #3: List Filtering",
        "description": "Read numbers and print only the even values (or NONE if there are none).",
        "sort_order": 3,
    },
    {
        "title": "Coding Challenge #4: Dictionary Basics",
        "description": "Read words and print the most frequent word with its count.",
        "sort_order": 4,
    },
    {
        "title": "Coding Challenge #5: Palindrome Check",
        "description": "Read a string and print YES if it is a palindrome, otherwise NO.",
        "sort_order": 5,
    },
    {
        "title": "Coding Challenge #6: Sum of Two",
        "description": "Read a target and numbers, print YES if any pair sums to target, otherwise NO.",
        "sort_order": 6,
    },
]


def upgrade():
    conn = op.get_bind()
    coding_module_id = conn.execute(sa.text("SELECT id FROM modules WHERE key = 'coding'")).scalar()
    if coding_module_id is None:
        return

    tasks_table = sa.table(
        "tasks",
        sa.column("id", sa.Integer()),
        sa.column("module_id", sa.Integer()),
        sa.column("title", sa.String(length=255)),
        sa.column("description", sa.Text()),
        sa.column("weight", sa.Integer()),
        sa.column("is_bonus", sa.Boolean()),
        sa.column("sort_order", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
        sa.column("created_at", sa.DateTime()),
        sa.column("updated_at", sa.DateTime()),
    )

    challenge_titles = [task["title"] for task in TASKS]

    conn.execute(
        tasks_table.update()
        .where(tasks_table.c.module_id == coding_module_id)
        .where(~tasks_table.c.title.in_(challenge_titles))
        .values(is_active=False)
    )

    for task in TASKS:
        existing_id = conn.execute(
            sa.select(tasks_table.c.id)
            .where(tasks_table.c.module_id == coding_module_id)
            .where(tasks_table.c.title == task["title"])
            .limit(1)
        ).scalar()

        if existing_id is None:
            conn.execute(
                tasks_table.insert().values(
                    module_id=coding_module_id,
                    title=task["title"],
                    description=task["description"],
                    weight=100,
                    is_bonus=False,
                    sort_order=task["sort_order"],
                    is_active=True,
                    created_at=sa.func.now(),
                    updated_at=sa.func.now(),
                )
            )
        else:
            conn.execute(
                tasks_table.update()
                .where(tasks_table.c.id == existing_id)
                .values(
                    description=task["description"],
                    weight=100,
                    is_bonus=False,
                    sort_order=task["sort_order"],
                    is_active=True,
                    updated_at=sa.func.now(),
                )
            )


def downgrade():
    conn = op.get_bind()
    coding_module_id = conn.execute(sa.text("SELECT id FROM modules WHERE key = 'coding'")).scalar()
    if coding_module_id is None:
        return

    tasks_table = sa.table(
        "tasks",
        sa.column("id", sa.Integer()),
        sa.column("module_id", sa.Integer()),
        sa.column("title", sa.String(length=255)),
    )

    task_titles = [task["title"] for task in TASKS]
    if not task_titles:
        return

    conn.execute(
        tasks_table.delete()
        .where(tasks_table.c.module_id == coding_module_id)
        .where(tasks_table.c.title.in_(task_titles))
    )

    conn.execute(
        sa.text(
            """
            UPDATE tasks
            SET is_active = true, updated_at = NOW()
            WHERE module_id = :module_id
            """
        ),
        {"module_id": coding_module_id},
    )
