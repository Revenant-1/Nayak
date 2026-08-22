from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    Integer
    )

from sqlalchemy.orm import(
    Mapped,
    relationship,
    mapped_column,
    relationship
    )

from datetime import datetime

from .helper import Base , TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    user_type: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    login_count: Mapped[int] = mapped_column(Integer, default=0)
    
    profile: Mapped["Profile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    sessions: Mapped[list["Session"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    documents: Mapped[list["Document"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    feedback: Mapped[list["Feedback"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    user_schemes: Mapped[list["UserScheme"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # date_of_birth instead of a raw age — age computed on read so it never
    # goes stale and you don't need a cron job to bump it every birthday.
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    occupation: Mapped[str] = mapped_column(String(100), nullable=False)
    annual_income: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    gender: Mapped[str | None] = mapped_column(String(20))
    category: Mapped[str | None] = mapped_column(String(30))  # SC/ST/OBC/General/EWS...
    disability_status: Mapped[bool | None] = mapped_column(Boolean)
    student_status: Mapped[bool | None] = mapped_column(Boolean)
    employment_status: Mapped[str | None] = mapped_column(String(50))
    marital_status: Mapped[str | None] = mapped_column(String(30))
    family_members: Mapped[int | None] = mapped_column(Integer)

    user: Mapped["User"] = relationship(back_populates="profile")

    @property
    def age(self) -> int | None:
        if self.date_of_birth is None:
            return None
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


# ============================================================================
# SESSIONS
# ============================================================================
class Session(Base):
    __tablename__ = "sessions"

    session_id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime)
    lang_used: Mapped[str] = mapped_column(String, nullable=False)
    mode: Mapped[str] = mapped_column(String, default="text")
    device_info: Mapped[str | None] = mapped_column(String)

    user: Mapped["User | None"] = relationship(back_populates="sessions")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", passive_deletes=True
    )
    documents: Mapped[list["Document"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", passive_deletes=True
    )
    user_schemes: Mapped[list["UserScheme"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", passive_deletes=True
    )

    __table_args__ = (
        CheckConstraint(f"mode IN {SESSION_MODES}", name="mode_valid"),
    )


# ============================================================================
# MESSAGES
# ============================================================================
class Message(Base):
    __tablename__ = "messages"

    msg_id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("sessions.session_id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_lang: Mapped[str | None] = mapped_column(String)
    input_mode: Mapped[str] = mapped_column(String, default="text")
    transcript_confidence: Mapped[float | None] = mapped_column(Float)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["Session"] = relationship(back_populates="messages")
    sources: Mapped[list["MessageSource"]] = relationship(
        back_populates="message", cascade="all, delete-orphan", passive_deletes=True
    )
    feedback: Mapped[list["Feedback"]] = relationship(
        back_populates="message", cascade="all, delete-orphan", passive_deletes=True
    )
    stt_log: Mapped["STTLog | None"] = relationship(
        back_populates="message",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        # Composite index instead of a plain session_id index — this is the
        # exact shape of the query you'll run constantly: "give me this
        # session's messages in order".
        Index("idx_messages_session_ts", "session_id", "timestamp"),
        CheckConstraint(f"role IN {MESSAGE_ROLES}", name="role_valid"),
    )
