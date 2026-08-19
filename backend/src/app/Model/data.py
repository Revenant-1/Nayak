from sqlalchemy import String, Text, DateTime, ForeignKey, JSON, Numeric, Boolean, Integer
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from datetime import datetime

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now
    )

class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now
    )

    title: Mapped[str] = mapped_column(String(200))


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)

    session_id: Mapped[int] = mapped_column(
        ForeignKey("sessions.id")
    )

    role: Mapped[str] = mapped_column(String(20))

    content: Mapped[str] = mapped_column(Text)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now
    )

    citations: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True
    )

class Scheme(Base):
    __tablename__ = "schemes"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(200))

    description: Mapped[str] = mapped_column(Text)

    category: Mapped[str] = mapped_column(String(100))

    eligibility: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True
    )

    required_docs: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    link: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    age: Mapped[int] = mapped_column(
        nullable=False
    )

    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    district: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    occupation: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    annual_income: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    # Optional
    gender: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    category: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True
    )

    disability_status: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True
    )

    student_status: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True
    )

    employment_status: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    marital_status: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True
    )

    family_members: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    # Relationship
    user: Mapped["User"] = relationship(
        back_populates="profile"
    )