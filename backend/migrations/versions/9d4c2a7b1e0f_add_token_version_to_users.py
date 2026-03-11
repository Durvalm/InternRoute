"""add token_version to users

Revision ID: 9d4c2a7b1e0f
Revises: 5d2c7b9a1e3f
Create Date: 2026-03-11 10:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "9d4c2a7b1e0f"
down_revision = "5d2c7b9a1e3f"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("token_version", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )


def downgrade():
    op.drop_column("users", "token_version")
