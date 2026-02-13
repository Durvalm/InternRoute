"""add user_progress table

Revision ID: 9c2f2a4e3c1b
Revises: b5f84319b351
Create Date: 2026-02-13 00:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '9c2f2a4e3c1b'
down_revision = 'b5f84319b351'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('readiness_score', sa.Integer(), nullable=True),
        sa.Column('category_coding', sa.Integer(), nullable=True),
        sa.Column('category_projects', sa.Integer(), nullable=True),
        sa.Column('category_resume', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )


def downgrade():
    op.drop_table('user_progress')
