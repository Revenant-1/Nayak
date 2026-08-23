from __future__ import annotations
from sqlalchemy import Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .helper import Base

class MessageSource(Base):
    __tablename__ = "message_sources"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    msg_id: Mapped[str] = mapped_column(ForeignKey("messages.msg_id", ondelete="CASCADE"), nullable=False)
    corpus_doc_id: Mapped[str | None] = mapped_column(ForeignKey("corpus_documents.corpus_doc_id", ondelete="SET NULL"))
    chunk_id: Mapped[str | None] = mapped_column(ForeignKey("corpus_chunks.chunk_id", ondelete="SET NULL"))
    section_ref: Mapped[str | None] = mapped_column(String)
    relevance_score: Mapped[float | None] = mapped_column(Float)
    message: Mapped["Message"] = relationship(back_populates="sources")
    __table_args__ = (Index("idx_message_sources_msg", "msg_id"),)
