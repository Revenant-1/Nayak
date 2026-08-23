from __future__ import annotations
from datetime import datetime
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .helper import Base, MESSAGE_ROLES, gen_uuid

class Message(Base):
    __tablename__ = "messages"
    msg_id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.session_id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_lang: Mapped[str | None] = mapped_column(String)
    input_mode: Mapped[str] = mapped_column(String, default="text")
    transcript_confidence: Mapped[float | None] = mapped_column(Float)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    session: Mapped["Session"] = relationship(back_populates="messages")
    sources: Mapped[list["MessageSource"]] = relationship(back_populates="message", cascade="all, delete-orphan", passive_deletes=True)
    feedback: Mapped[list["Feedback"]] = relationship(back_populates="message", cascade="all, delete-orphan", passive_deletes=True)
    stt_log: Mapped["STTLog | None"] = relationship(back_populates="message", uselist=False, cascade="all, delete-orphan", passive_deletes=True)
    __table_args__ = (Index("idx_messages_session_ts", "session_id", "timestamp"), CheckConstraint(f"role IN {MESSAGE_ROLES}", name="role_valid"))
