import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, Integer, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base


class Event(Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    capacity: Mapped[int] = mapped_column(Integer)
    seats_left: Mapped[int] = mapped_column(Integer)


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    email: Mapped[str] = mapped_column(String(320))
    total: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    participants: Mapped[list["Participant"]] = relationship(lazy="selectin")


class Participant(Base):
    __tablename__ = "participants"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"))
    name: Mapped[str] = mapped_column(String(200))
    age: Mapped[int] = mapped_column(Integer)
    price: Mapped[int] = mapped_column(Integer)
