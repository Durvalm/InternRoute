"""add journey anchor date to user progress

Revision ID: a2d4f6b8c0e1
Revises: e1b7c4d9a2f0
Create Date: 2026-03-30 15:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a2d4f6b8c0e1"
down_revision = "e1b7c4d9a2f0"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("user_progress", sa.Column("journey_anchor_date", sa.Date(), nullable=True))


def downgrade():
    op.drop_column("user_progress", "journey_anchor_date")
