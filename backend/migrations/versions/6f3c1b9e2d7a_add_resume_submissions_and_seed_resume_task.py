"""add resume submissions table and seed resume progression task

Revision ID: 6f3c1b9e2d7a
Revises: 2f1c8a7b9d4e
Create Date: 2026-02-25 12:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "6f3c1b9e2d7a"
down_revision = "2f1c8a7b9d4e"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "resume_submissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("page_count", sa.Integer(), nullable=True),
        sa.Column("extracted_char_count", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="failed"),
        sa.Column("provider", sa.String(length=64), nullable=True),
        sa.Column("model", sa.String(length=120), nullable=True),
        sa.Column("prompt_version", sa.String(length=64), nullable=True),
        sa.Column("overall_score", sa.Integer(), nullable=True),
        sa.Column("formatting_score", sa.Integer(), nullable=True),
        sa.Column("content_score", sa.Integer(), nullable=True),
        sa.Column("ats_score", sa.Integer(), nullable=True),
        sa.Column("impact_score", sa.Integer(), nullable=True),
        sa.Column("strengths_json", sa.Text(), nullable=True),
        sa.Column("improvements_json", sa.Text(), nullable=True),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_resume_submissions_user_created_at",
        "resume_submissions",
        ["user_id", "created_at"],
        unique=False,
    )

    op.execute(
        """
        UPDATE tasks
        SET
          title = 'Resume Module: Reach resume score threshold.',
          description = 'Upload your resume and reach a score of at least 80.',
          weight = 100,
          is_bonus = false,
          sort_order = 1,
          is_active = true,
          updated_at = NOW()
        WHERE challenge_id = 'resume_pass_threshold'
          AND module_id = (SELECT id FROM modules WHERE key = 'resume')
        """
    )

    op.execute(
        """
        INSERT INTO tasks (module_id, challenge_id, title, description, weight, is_bonus, sort_order, is_active, created_at, updated_at)
        SELECT
          m.id,
          'resume_pass_threshold',
          'Resume Module: Reach resume score threshold.',
          'Upload your resume and reach a score of at least 80.',
          100,
          false,
          1,
          true,
          NOW(),
          NOW()
        FROM modules m
        WHERE m.key = 'resume'
          AND NOT EXISTS (
            SELECT 1
            FROM tasks t
            WHERE t.module_id = m.id
              AND t.challenge_id = 'resume_pass_threshold'
          )
        """
    )


def downgrade():
    op.execute(
        """
        DELETE FROM tasks
        WHERE module_id = (SELECT id FROM modules WHERE key = 'resume')
          AND challenge_id = 'resume_pass_threshold'
        """
    )
    op.drop_index("ix_resume_submissions_user_created_at", table_name="resume_submissions")
    op.drop_table("resume_submissions")
