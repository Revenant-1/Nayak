from __future__ import annotations
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .helper import Base, gen_uuid

class Document(Base):
    __tablename__ = "documents"
    doc_id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    session_id: Mapped[str | None] = mapped_column(ForeignKey("sessions.session_id", ondelete="SET NULL"))
    filename: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer)
    content_hash: Mapped[str | None] = mapped_column(String(64), index=True)
    file_type: Mapped[str | None] = mapped_column(String)
    doc_category: Mapped[str | None] = mapped_column(String)
    extracted_text: Mapped[str | None] = mapped_column(Text)
    lang_detected: Mapped[str | None] = mapped_column(String)
    summary: Mapped[str | None] = mapped_column(Text)
    key_clauses_json: Mapped[str | None] = mapped_column(Text)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    retain_until: Mapped[datetime | None] = mapped_column(DateTime)
    user: Mapped["User | None"] = relationship(back_populates="documents")
    session: Mapped["Session | None"] = relationship(back_populates="documents")
    qa_pairs: Mapped[list["DocumentQA"]] = relationship(back_populates="document", cascade="all, delete-orphan", passive_deletes=True)

class DocumentQA(Base):
    __tablename__ = "document_qa"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    doc_id: Mapped[str] = mapped_column(ForeignKey("documents.doc_id", ondelete="CASCADE"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    asked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    document: Mapped["Document"] = relationship(back_populates="qa_pairs")
