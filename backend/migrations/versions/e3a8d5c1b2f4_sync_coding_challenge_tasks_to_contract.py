"""sync coding challenge tasks to current challenge contract

Revision ID: e3a8d5c1b2f4
Revises: c9f1b2d3e4a5
Create Date: 2026-02-17 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e3a8d5c1b2f4"
down_revision = "c9f1b2d3e4a5"
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
        "description": "Count how many times each word appears and return one \"word:count\" item per unique word.",
    },
    {
        "challenge_id": "summarize_orders",
        "sort_order": 3,
        "title": "Coding Challenge #3: Build Order Summary",
        "description": "From aligned users and amounts, return one summary string per user with count and total.",
    },
    {
        "challenge_id": "cart_total",
        "sort_order": 4,
        "title": "Coding Challenge #4: Shopping Cart Total with Coupons",
        "description": "Compute subtotal from aligned prices/qty and apply SAVE10 or conditional SAVE20.",
    },
    {
        "challenge_id": "group_anagrams",
        "sort_order": 5,
        "title": "Coding Challenge #5: Group Anagrams",
        "description": "Group words that are anagrams and return them as groups of string lists.",
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

    for task in TASKS:
        existing_id = conn.execute(
            sa.select(tasks_table.c.id)
            .where(tasks_table.c.module_id == coding_module_id)
            .where(
                sa.or_(
                    tasks_table.c.challenge_id == task["challenge_id"],
                    sa.and_(
                        tasks_table.c.challenge_id.is_(None),
                        sa.or_(
                            tasks_table.c.sort_order == task["sort_order"],
                            tasks_table.c.title == task["title"],
                        ),
                    ),
                )
            )
            .order_by(
                sa.case((tasks_table.c.challenge_id == task["challenge_id"], 0), else_=1),
                tasks_table.c.id.asc(),
            )
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
                    challenge_id=task["challenge_id"],
                    title=task["title"],
                    description=task["description"],
                    weight=100,
                    is_bonus=False,
                    sort_order=task["sort_order"],
                    is_active=True,
                    updated_at=sa.func.now(),
                )
            )

    challenge_ids = [task["challenge_id"] for task in TASKS]
    conn.execute(
        tasks_table.update()
        .where(tasks_table.c.module_id == coding_module_id)
        .where(
            sa.or_(
                tasks_table.c.challenge_id.is_(None),
                ~tasks_table.c.challenge_id.in_(challenge_ids),
            )
        )
        .values(is_active=False, updated_at=sa.func.now())
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
