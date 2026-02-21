"""add is_superuser to users

Revision ID: 2f1c8a7b9d4e
Revises: 7c3b1a9d4e2f
Create Date: 2026-02-21 13:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "2f1c8a7b9d4e"
down_revision = "7c3b1a9d4e2f"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade():
    op.drop_column("users", "is_superuser")
