"""add name and rename experience_level

Revision ID: 3f1b2c4d5e6f
Revises: 9c2f2a4e3c1b
Create Date: 2026-02-13 00:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '3f1b2c4d5e6f'
down_revision = '9c2f2a4e3c1b'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('name', sa.String(length=120), nullable=True))
    op.alter_column('users', 'experience_level', new_column_name='coding_skill_level', existing_type=sa.String(length=50))


def downgrade():
    op.alter_column('users', 'coding_skill_level', new_column_name='experience_level', existing_type=sa.String(length=50))
    op.drop_column('users', 'name')
