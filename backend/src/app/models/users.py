from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    Integer
    )

from sqlalchemy.orm import(
    Mapped,
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
