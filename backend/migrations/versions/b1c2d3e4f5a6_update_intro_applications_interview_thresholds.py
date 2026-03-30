"""update intro and target module thresholds

Revision ID: b1c2d3e4f5a6
Revises: a2d4f6b8c0e1
Create Date: 2026-03-30 18:20:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "b1c2d3e4f5a6"
down_revision = "a2d4f6b8c0e1"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE modules SET name = 'Intro', unlock_threshold = 100 WHERE key IN ('timeline', 'intro')")
    op.execute("UPDATE modules SET unlock_threshold = 100 WHERE key IN ('applications', 'interview_prep')")


def downgrade():
    op.execute("UPDATE modules SET name = 'Timeline & Strategy' WHERE key = 'timeline'")
    op.execute("UPDATE modules SET unlock_threshold = 80 WHERE key IN ('timeline', 'intro', 'applications', 'interview_prep')")
