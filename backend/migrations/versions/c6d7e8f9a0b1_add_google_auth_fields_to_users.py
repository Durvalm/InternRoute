"""add google auth fields to users

Revision ID: c6d7e8f9a0b1
Revises: b1c2d3e4f5a6
Create Date: 2026-04-02 13:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c6d7e8f9a0b1"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("google_sub", sa.String(length=255), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "password_login_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.create_unique_constraint("uq_users_google_sub", "users", ["google_sub"])


def downgrade():
    op.drop_constraint("uq_users_google_sub", "users", type_="unique")
    op.drop_column("users", "password_login_enabled")
    op.drop_column("users", "google_sub")
