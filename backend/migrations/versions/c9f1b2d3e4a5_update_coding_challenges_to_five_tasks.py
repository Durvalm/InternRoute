"""update coding challenges to five-task lineup

Revision ID: c9f1b2d3e4a5
Revises: b7d2a10c3f4e
Create Date: 2026-02-17 21:25:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c9f1b2d3e4a5"
down_revision = "b7d2a10c3f4e"
branch_labels = None
depends_on = None


TASKS = [
    {
        "challenge_id": "clean_username",
        "sort_order": 1,
        "title": "Coding Challenge #1: Clean Username",
        "description": "Normalize a username by trimming spaces, lowercasing, and replacing spaces with underscores.",
    },
    {
        "challenge_id": "word_counter",
        "sort_order": 2,
        "title": "Coding Challenge #2: Word Counter",
        "description": "Count each word and format counts as sorted word:count pairs.",
    },
    {
        "challenge_id": "summarize_orders",
        "sort_order": 3,
        "title": "Coding Challenge #3: Build Order Summary",
        "description": "Aggregate per-user order counts and totals from aligned user and amount lists.",
    },
    {
        "challenge_id": "cart_total",
        "sort_order": 4,
        "title": "Coding Challenge #4: Shopping Cart Total with Coupons",
        "description": "Compute cart total from price and quantity lists, then apply SAVE10 or SAVE20 rules.",
    },
    {
        "challenge_id": "group_anagrams",
        "sort_order": 5,
        "title": "Coding Challenge #5: Group Anagrams",
        "description": "Group words by anagram key and return the deterministic grouped representation.",
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
        sa.column("challenge_id", sa.String(length=64)),
        sa.column("title", sa.String(length=255)),
        sa.column("description", sa.Text()),
        sa.column("weight", sa.Integer()),
        sa.column("is_bonus", sa.Boolean()),
        sa.column("sort_order", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
        sa.column("created_at", sa.DateTime()),
        sa.column("updated_at", sa.DateTime()),
    )

    conn.execute(
        tasks_table.update()
        .where(tasks_table.c.module_id == coding_module_id)
        .where(tasks_table.c.challenge_id.is_not(None))
        .values(
            is_active=False,
            updated_at=sa.func.now(),
        )
    )

    for task in TASKS:
        existing_id = conn.execute(
            sa.select(tasks_table.c.id)
            .where(tasks_table.c.module_id == coding_module_id)
            .where(tasks_table.c.challenge_id == task["challenge_id"])
            .limit(1)
        ).scalar()

        if existing_id is None:
            conn.execute(
                tasks_table.insert().values(
                    module_id=coding_module_id,
                    challenge_id=task["challenge_id"],
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
                    title=task["title"],
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

    challenge_ids = [task["challenge_id"] for task in TASKS]
    tasks_table = sa.table(
        "tasks",
        sa.column("module_id", sa.Integer()),
        sa.column("challenge_id", sa.String(length=64)),
        sa.column("is_active", sa.Boolean()),
        sa.column("updated_at", sa.DateTime()),
    )

    conn.execute(
        tasks_table.update()
        .where(tasks_table.c.module_id == coding_module_id)
        .where(tasks_table.c.challenge_id.in_(challenge_ids))
        .values(is_active=False, updated_at=sa.func.now())
    )
