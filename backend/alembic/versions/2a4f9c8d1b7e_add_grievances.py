"""add grievances table

Revision ID: 2a4f9c8d1b7e
Revises: 0787aa01215d
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2a4f9c8d1b7e"
down_revision: Union[str, Sequence[str], None] = "0787aa01215d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "grievances",
        sa.Column("id", sa.String(length=100), nullable=False),
        sa.Column("user_id", sa.String(length=100), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_grievances_user_id", "grievances", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_grievances_user_id", table_name="grievances")
    op.drop_table("grievances")
