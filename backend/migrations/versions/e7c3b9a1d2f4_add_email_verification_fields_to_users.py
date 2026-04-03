"""add email verification fields to users

Revision ID: e7c3b9a1d2f4
Revises: c6d7e8f9a0b1
Create Date: 2026-04-03 15:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e7c3b9a1d2f4"
down_revision = "c6d7e8f9a0b1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column("users", sa.Column("email_verified_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("email_verification_sent_at", sa.DateTime(), nullable=True))
    op.execute(
        sa.text(
            "UPDATE users SET email_verified = true, email_verified_at = CURRENT_TIMESTAMP"
        )
    )


def downgrade():
    op.drop_column("users", "email_verification_sent_at")
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "email_verified")
