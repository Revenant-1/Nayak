from __future__ import annotations
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    create_engine,
    Numeric,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    sessionmaker,
)

DATABASE_URL = "sqlite:///./nayak.db"

engine = create_engine(
    DATABASE_URL,
    connect_args=(
        {"check_same_thread": False}
        if DATABASE_URL.startswith("sqlite")
        else {}
    ),
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def gen_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
    )

    profile: Mapped["Profile | None"] = relationship(
        back_populates="user",
        uselist=False,
)

class Session(Base):
    __tablename__ = "sessions"

    session_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=gen_uuid,
    )

    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    ended_at: Mapped[datetime | None] = mapped_column(DateTime)

    lang_used: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    mode: Mapped[str] = mapped_column(
        String,
        default="text",
    )

    device_info: Mapped[str | None] = mapped_column(String)

    # Relationships
    user: Mapped["User | None"] = relationship(
        back_populates="sessions"
    )

    messages: Mapped[list["Message"]] = relationship(
        back_populates="session"
    )

    documents: Mapped[list["Document"]] = relationship(
        back_populates="session"
    )

    user_schemes: Mapped[list["UserScheme"]] = relationship(
        back_populates="session"
    )


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"),
        unique=True,
        nullable=False,
    )

    age: Mapped[int] = mapped_column(
        nullable=False,
    )

    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    district: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    occupation: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    annual_income: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    gender: Mapped[str | None] = mapped_column(
        String(20),
    )

    category: Mapped[str | None] = mapped_column(
        String(30),
    )

    disability_status: Mapped[bool | None] = mapped_column(
        Boolean,
    )

    student_status: Mapped[bool | None] = mapped_column(
        Boolean,
    )

    employment_status: Mapped[str | None] = mapped_column(
        String(50),
    )

    marital_status: Mapped[str | None] = mapped_column(
        String(30),
    )

    family_members: Mapped[int | None] = mapped_column(
        Integer,
    )

    user: Mapped["User"] = relationship(
        back_populates="profile",
    )

class Message(Base):
    __tablename__ = "messages"

    msg_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=gen_uuid,
    )

    session_id: Mapped[str] = mapped_column(
        ForeignKey("sessions.session_id"),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    content_lang: Mapped[str | None] = mapped_column(String)

    input_mode: Mapped[str] = mapped_column(
        String,
        default="text",
    )

    transcript_confidence: Mapped[float | None] = mapped_column(Float)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    # Relationships
    session: Mapped["Session"] = relationship(
        back_populates="messages"
    )

    sources: Mapped[list["MessageSource"]] = relationship(
        back_populates="message"
    )

    feedback: Mapped[list["Feedback"]] = relationship(
        back_populates="message"
    )

    stt_log: Mapped["STTLog | None"] = relationship(
        back_populates="message",
        uselist=False,
    )

    __table_args__ = (
        Index(
            "idx_messages_session",
            "session_id",
        ),
    )

class CorpusDocument(Base):
    __tablename__ = "corpus_documents"

    corpus_doc_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=gen_uuid,
    )

    title: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    act_type: Mapped[str | None] = mapped_column(String)

    jurisdiction: Mapped[str] = mapped_column(
        String,
        default="India",
    )

    lang: Mapped[str] = mapped_column(
        String,
        default="en",
    )

    source_url: Mapped[str | None] = mapped_column(String)

    added_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    chunks: Mapped[list["CorpusChunk"]] = relationship(
        back_populates="document"
    )

class CorpusChunk(Base):
    __tablename__ = "corpus_chunks"

    chunk_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    corpus_doc_id: Mapped[str] = mapped_column(
        ForeignKey("corpus_documents.corpus_doc_id"),
        nullable=False,
    )

    chunk_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    section_ref: Mapped[str | None] = mapped_column(String)

    chunk_index: Mapped[int | None] = mapped_column(Integer)

    document: Mapped["CorpusDocument"] = relationship(
        back_populates="chunks"
    )

    __table_args__ = (
        Index(
            "idx_corpus_chunks_doc",
            "corpus_doc_id",
        ),
    )


class MessageSource(Base):
    __tablename__ = "message_sources"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    msg_id: Mapped[str] = mapped_column(
        ForeignKey("messages.msg_id"),
        nullable=False,
    )

    corpus_doc_id: Mapped[str | None] = mapped_column(
        ForeignKey("corpus_documents.corpus_doc_id")
    )

    chunk_id: Mapped[str | None] = mapped_column(String)

    section_ref: Mapped[str | None] = mapped_column(String)

    relevance_score: Mapped[float | None] = mapped_column(Float)

    message: Mapped["Message"] = relationship(
        back_populates="sources"
    )

    __table_args__ = (
        Index(
            "idx_message_sources_msg",
            "msg_id",
        ),
    )


class Scheme(Base):
    __tablename__ = "schemes"

    scheme_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=gen_uuid,
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    ministry: Mapped[str | None] = mapped_column(String)

    level: Mapped[str] = mapped_column(
        String,
        default="state",
    )

    state: Mapped[str | None] = mapped_column(String)

    description: Mapped[str | None] = mapped_column(Text)

    eligibility_json: Mapped[str | None] = mapped_column(Text)

    docs_required: Mapped[str | None] = mapped_column(Text)

    apply_url: Mapped[str | None] = mapped_column(String)

    deadline: Mapped[date | None] = mapped_column(Date)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    user_schemes: Mapped[list["UserScheme"]] = relationship(
        back_populates="scheme"
    )

    category_map: Mapped[list["SchemeCategoryMap"]] = relationship(
        back_populates="scheme"
    )


# ============================================================================
# USER SCHEMES
# ============================================================================

class UserScheme(Base):
    __tablename__ = "user_schemes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=True,
    )

    session_id: Mapped[str | None] = mapped_column(
        ForeignKey("sessions.session_id")
    )

    scheme_id: Mapped[str] = mapped_column(
        ForeignKey("schemes.scheme_id"),
        nullable=False,
    )

    match_score: Mapped[float | None] = mapped_column(Float)

    recommended_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    status: Mapped[str] = mapped_column(
        String,
        default="recommended",
    )

    user: Mapped["User | None"] = relationship(
        back_populates="user_schemes"
    )

    session: Mapped["Session | None"] = relationship(
        back_populates="user_schemes"
    )

    scheme: Mapped["Scheme"] = relationship(
        back_populates="user_schemes"
    )

    __table_args__ = (
        Index("idx_user_schemes_user", "user_id"),
        Index("idx_user_schemes_scheme", "scheme_id"),
    )


# ============================================================================
# USER DOCUMENTS
# ============================================================================

class Document(Base):
    __tablename__ = "documents"

    doc_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=gen_uuid,
    )

    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=True,
    )

    session_id: Mapped[str | None] = mapped_column(
        ForeignKey("sessions.session_id")
    )

    filename: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    file_path: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    file_type: Mapped[str | None] = mapped_column(String)

    doc_category: Mapped[str | None] = mapped_column(String)

    extracted_text: Mapped[str | None] = mapped_column(Text)

    lang_detected: Mapped[str | None] = mapped_column(String)

    summary: Mapped[str | None] = mapped_column(Text)

    key_clauses_json: Mapped[str | None] = mapped_column(Text)

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    retain_until: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped["User | None"] = relationship(
        back_populates="documents"
    )

    session: Mapped["Session | None"] = relationship(
        back_populates="documents"
    )

    qa_pairs: Mapped[list["DocumentQA"]] = relationship(
        back_populates="document"
    )

    __table_args__ = (
        Index(
            "idx_documents_user",
            "user_id",
        ),
    )


# ============================================================================
# DOCUMENT Q&A
# ============================================================================

class DocumentQA(Base):
    __tablename__ = "document_qa"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    doc_id: Mapped[str] = mapped_column(
        ForeignKey("documents.doc_id"),
        nullable=False,
    )

    question: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    answer: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    asked_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    document: Mapped["Document"] = relationship(
        back_populates="qa_pairs"
    )


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    msg_id: Mapped[str | None] = mapped_column(
        ForeignKey("messages.msg_id")
    )

    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.user_id")
    )

    rating: Mapped[int | None] = mapped_column(Integer)

    was_helpful: Mapped[bool | None] = mapped_column(Boolean)

    comment: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    message: Mapped["Message | None"] = relationship(
        back_populates="feedback"
    )

    user: Mapped["User | None"] = relationship(
        back_populates="feedback"
    )

    __table_args__ = (
        CheckConstraint(
            "rating BETWEEN 1 AND 5",
            name="ck_feedback_rating_range",
        ),
    )


# ============================================================================
# SCHEME CATEGORIES
# ============================================================================

class SchemeCategory(Base):
    __tablename__ = "scheme_categories"

    category_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=gen_uuid,
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
        unique=True,
    )

    scheme_map: Mapped[list["SchemeCategoryMap"]] = relationship(
        back_populates="category"
    )


# ============================================================================
# SCHEME ↔ CATEGORY
# ============================================================================

class SchemeCategoryMap(Base):
    __tablename__ = "scheme_category_map"

    scheme_id: Mapped[str] = mapped_column(
        ForeignKey("schemes.scheme_id"),
        primary_key=True,
    )

    category_id: Mapped[str] = mapped_column(
        ForeignKey("scheme_categories.category_id"),
        primary_key=True,
    )

    scheme: Mapped["Scheme"] = relationship(
        back_populates="category_map"
    )

    category: Mapped["SchemeCategory"] = relationship(
        back_populates="scheme_map"
    )


# ============================================================================
# TRANSLATION CACHE
# ============================================================================

class TranslationCache(Base):
    __tablename__ = "translation_cache"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    source_text_hash: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    source_lang: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    target_lang: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    translated_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    __table_args__ = (
        Index(
            "uq_translation_cache_lookup",
            "source_text_hash",
            "source_lang",
            "target_lang",
            unique=True,
        ),
    )


# ============================================================================
# SPEECH-TO-TEXT LOG
# ============================================================================

class STTLog(Base):
    __tablename__ = "stt_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    msg_id: Mapped[str | None] = mapped_column(
        ForeignKey("messages.msg_id")
    )

    audio_duration_sec: Mapped[float | None] = mapped_column(Float)

    whisper_model: Mapped[str | None] = mapped_column(String)

    detected_lang: Mapped[str | None] = mapped_column(String)

    raw_transcript: Mapped[str | None] = mapped_column(Text)

    edited_transcript: Mapped[str | None] = mapped_column(Text)

    processing_time_ms: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    message: Mapped["Message | None"] = relationship(
        back_populates="stt_log"
    )


# ============================================================================
# DEMO TEST SET
# ============================================================================

class DemoTestSet(Base):
    """
    Known-good demo dataset.

    Used by automated tests for:
        - Q&A
        - scheme profile matching
        - document processing
    """

    __tablename__ = "demo_test_set"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    test_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    input_json: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    expected_output: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    lang: Mapped[str | None] = mapped_column(String)

    last_verified: Mapped[datetime | None] = mapped_column(DateTime)


# ============================================================================
# CREATE TABLES
# ============================================================================

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print(f"Created all tables at {DATABASE_URL}")