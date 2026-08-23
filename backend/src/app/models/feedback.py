from __future__ import annotations
from datetime import datetime
from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .helper import Base

class Feedback(Base):
    __tablename__ = "feedback"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    msg_id: Mapped[str | None] = mapped_column(ForeignKey("messages.msg_id", ondelete="CASCADE"))
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    rating: Mapped[int | None] = mapped_column(Integer)
    was_helpful: Mapped[bool | None] = mapped_column(Boolean)
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    message: Mapped["Message | None"] = relationship(back_populates="feedback")
    user: Mapped["User | None"] = relationship(back_populates="feedback")
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="rating_range"),)
