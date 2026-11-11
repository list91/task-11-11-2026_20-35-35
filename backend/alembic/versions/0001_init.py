"""init"""
revision = "0001"
down_revision = None
from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    events = op.create_table(
        "events",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("capacity", sa.Integer, nullable=False),
        sa.Column("seats_left", sa.Integer, nullable=False),
        sa.CheckConstraint("seats_left >= 0", name="seats_non_negative"),
    )
    op.create_table(
        "orders",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("event_id", sa.Integer, sa.ForeignKey("events.id"), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("total", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "participants",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("age", sa.Integer, nullable=False),
        sa.Column("price", sa.Integer, nullable=False),
    )
    op.bulk_insert(events, [{"id": 1, "title": "Мероприятие", "capacity": 8, "seats_left": 8}])


def downgrade() -> None:
    op.drop_table("participants")
    op.drop_table("orders")
    op.drop_table("events")
