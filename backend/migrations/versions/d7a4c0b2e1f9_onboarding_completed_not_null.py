"""enforce users.onboarding_completed default and non-null

Revision ID: d7a4c0b2e1f9
Revises: 3f1b2c4d5e6f
Create Date: 2026-02-13 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d7a4c0b2e1f9"
down_revision = "3f1b2c4d5e6f"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE users SET onboarding_completed = false WHERE onboarding_completed IS NULL")
    op.alter_column(
        "users",
        "onboarding_completed",
        existing_type=sa.Boolean(),
        nullable=False,
        server_default=sa.text("false"),
    )


def downgrade():
    op.alter_column(
        "users",
        "onboarding_completed",
        existing_type=sa.Boolean(),
        nullable=True,
        server_default=None,
    )
