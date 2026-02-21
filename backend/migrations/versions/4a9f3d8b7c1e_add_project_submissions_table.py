"""add project_submissions table

Revision ID: 4a9f3d8b7c1e
Revises: e3a8d5c1b2f4
Create Date: 2026-02-21 17:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "4a9f3d8b7c1e"
down_revision = "e3a8d5c1b2f4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "project_submissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("repo_url", sa.String(length=500), nullable=False),
        sa.Column("deployed_url", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("review_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("status IN ('pending', 'pass', 'fail')", name="ck_project_submissions_status"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_project_submissions_user_created",
        "project_submissions",
        ["user_id", "created_at"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_project_submissions_user_created", table_name="project_submissions")
    op.drop_table("project_submissions")
