from __future__ import annotations
from datetime import datetime
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .helper import Base, SUPPORTED_LANGS, gen_uuid

class CorpusDocument(Base):
    __tablename__ = "corpus_documents"
    corpus_doc_id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    title: Mapped[str] = mapped_column(String, nullable=False)
    act_type: Mapped[str | None] = mapped_column(String)
    jurisdiction: Mapped[str] = mapped_column(String, default="India")
    lang: Mapped[str] = mapped_column(String, default="en")
    source_url: Mapped[str | None] = mapped_column(String)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    chunks: Mapped[list["CorpusChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan", passive_deletes=True)
    __table_args__ = (CheckConstraint(f"lang IN {SUPPORTED_LANGS}", name="lang_valid"),)

class CorpusChunk(Base):
    __tablename__ = "corpus_chunks"
    chunk_id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    corpus_doc_id: Mapped[str] = mapped_column(ForeignKey("corpus_documents.corpus_doc_id", ondelete="CASCADE"), nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    section_ref: Mapped[str | None] = mapped_column(String)
    chunk_index: Mapped[int | None] = mapped_column(Integer)
    embedding_id: Mapped[str | None] = mapped_column(String, index=True)
    document: Mapped["CorpusDocument"] = relationship(back_populates="chunks")
    __table_args__ = (Index("idx_corpus_chunks_doc", "corpus_doc_id"),)
