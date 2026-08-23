from __future__ import annotations
from datetime import datetime
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .helper import Base, SESSION_MODES, gen_uuid

class Session(Base):
    __tablename__ = "sessions"
    session_id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime)
    lang_used: Mapped[str] = mapped_column(String, nullable=False)
    mode: Mapped[str] = mapped_column(String, default="text")
    device_info: Mapped[str | None] = mapped_column(String)
    user: Mapped["User | None"] = relationship(back_populates="sessions")
    messages: Mapped[list["Message"]] = relationship(back_populates="session", cascade="all, delete-orphan", passive_deletes=True)
    documents: Mapped[list["Document"]] = relationship(back_populates="session", cascade="all, delete-orphan", passive_deletes=True)
    user_schemes: Mapped[list["UserScheme"]] = relationship(back_populates="session", cascade="all, delete-orphan", passive_deletes=True)
    __table_args__ = (CheckConstraint(f"mode IN {SESSION_MODES}", name="mode_valid"),)
