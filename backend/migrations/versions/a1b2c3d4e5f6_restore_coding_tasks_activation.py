"""restore coding tasks activation after skills ide seed behavior

Revision ID: a1b2c3d4e5f6
Revises: f7e1c2d3a4b5
Create Date: 2026-02-17 19:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "f7e1c2d3a4b5"
branch_labels = None
depends_on = None


CHALLENGE_TITLES = [
    "Coding Challenge #1: Clean Username",
    "Coding Challenge #2: Word Counter",
    "Coding Challenge #3: Build Order Summary",
    "Coding Challenge #4: Shopping Cart Total with Coupons",
    "Coding Challenge #5: Group Anagrams",
]


def upgrade():
    conn = op.get_bind()
    coding_module_id = conn.execute(sa.text("SELECT id FROM modules WHERE key = 'coding'")).scalar()
    if coding_module_id is None:
        return

    # Corrective: if previous migration deactivated existing coding tasks,
    # restore them so future/legacy coding tasks remain usable.
    conn.execute(
        sa.text(
            """
            UPDATE tasks
            SET is_active = true, updated_at = NOW()
            WHERE module_id = :module_id
              AND is_active = false
              AND title != ALL(:challenge_titles)
            """
        ),
        {"module_id": coding_module_id, "challenge_titles": CHALLENGE_TITLES},
    )


def downgrade():
    # No safe automatic downgrade: we cannot infer which tasks were truly inactive before.
    pass
