"""add onboarding assessment tables

Revision ID: 6b4a2e9c1d8f
Revises: 9d4c2a7b1e0f
Create Date: 2026-03-26 00:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "6b4a2e9c1d8f"
down_revision = "9d4c2a7b1e0f"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "project_submissions",
        sa.Column("source_type", sa.String(length=32), nullable=False, server_default="github"),
    )
    op.add_column(
        "project_submissions",
        sa.Column("source_label", sa.String(length=255), nullable=True),
    )

    op.create_table(
        "onboarding_assessments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("track_key", sa.String(length=64), nullable=True),
        sa.Column("can_skip_coding_skills", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("coding_skip_confidence", sa.Float(), nullable=True),
        sa.Column("resume_submission_id", sa.Integer(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["resume_submission_id"], ["resume_submissions.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_onboarding_assessments_user_id", "onboarding_assessments", ["user_id"], unique=False)
    op.create_index("ix_onboarding_assessments_status", "onboarding_assessments", ["status"], unique=False)

    op.create_table(
        "onboarding_project_assessments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("assessment_id", sa.Integer(), nullable=False),
        sa.Column("slot_index", sa.Integer(), nullable=False),
        sa.Column("input_mode", sa.String(length=32), nullable=False, server_default="repo"),
        sa.Column("repo_url", sa.String(length=500), nullable=True),
        sa.Column("uploaded_file_name", sa.String(length=255), nullable=True),
        sa.Column("has_api", sa.Boolean(), nullable=True),
        sa.Column("has_database", sa.Boolean(), nullable=True),
        sa.Column("has_coding_skills", sa.Boolean(), nullable=True),
        sa.Column("coding_confidence", sa.Float(), nullable=True),
        sa.Column("project_pass", sa.Boolean(), nullable=True),
        sa.Column("is_coding_signal_only", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("evidence_files_json", sa.Text(), nullable=True),
        sa.Column("analysis_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["assessment_id"], ["onboarding_assessments.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("assessment_id", "slot_index", name="uq_onboarding_project_slot"),
    )
    op.create_index(
        "ix_onboarding_project_assessments_assessment_id",
        "onboarding_project_assessments",
        ["assessment_id"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_onboarding_project_assessments_assessment_id", table_name="onboarding_project_assessments")
    op.drop_table("onboarding_project_assessments")

    op.drop_index("ix_onboarding_assessments_status", table_name="onboarding_assessments")
    op.drop_index("ix_onboarding_assessments_user_id", table_name="onboarding_assessments")
    op.drop_table("onboarding_assessments")

    op.drop_column("project_submissions", "source_label")
    op.drop_column("project_submissions", "source_type")
