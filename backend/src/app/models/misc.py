from __future__ import annotations
from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .helper import Base

class TranslationCache(Base):
    __tablename__ = "translation_cache"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    source_text_hash: Mapped[str] = mapped_column(String, nullable=False)
    source_lang: Mapped[str] = mapped_column(String, nullable=False)
    target_lang: Mapped[str] = mapped_column(String, nullable=False)
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    __table_args__ = (Index("uq_translation_cache_lookup", "source_text_hash", "source_lang", "target_lang", unique=True),)

class STTLog(Base):
    __tablename__ = "stt_logs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    msg_id: Mapped[str | None] = mapped_column(ForeignKey("messages.msg_id", ondelete="CASCADE"))
    audio_duration_sec: Mapped[float | None] = mapped_column(Float)
    whisper_model: Mapped[str | None] = mapped_column(String)
    detected_lang: Mapped[str | None] = mapped_column(String)
    raw_transcript: Mapped[str | None] = mapped_column(Text)
    edited_transcript: Mapped[str | None] = mapped_column(Text)
    processing_time_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    message: Mapped["Message | None"] = relationship(back_populates="stt_log")

class DemoTestSet(Base):
    __tablename__ = "demo_test_set"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    test_type: Mapped[str] = mapped_column(String, nullable=False)
    input_json: Mapped[str] = mapped_column(Text, nullable=False)
    expected_output: Mapped[str] = mapped_column(Text, nullable=False)
    lang: Mapped[str | None] = mapped_column(String)
    last_verified: Mapped[datetime | None] = mapped_column(DateTime)
