from __future__ import annotations
from datetime import date, datetime
from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .helper import Base, gen_uuid

class Scheme(Base):
    __tablename__ = "schemes"
    scheme_id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    ministry: Mapped[str | None] = mapped_column(String)
    level: Mapped[str] = mapped_column(String, default="state")
    state: Mapped[str | None] = mapped_column(String, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    eligibility_json: Mapped[str | None] = mapped_column(Text)
    docs_required: Mapped[str | None] = mapped_column(Text)
    apply_url: Mapped[str | None] = mapped_column(String)
    deadline: Mapped[date | None] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user_schemes: Mapped[list["UserScheme"]] = relationship(back_populates="scheme", cascade="all, delete-orphan", passive_deletes=True)
    category_map: Mapped[list["SchemeCategoryMap"]] = relationship(back_populates="scheme", cascade="all, delete-orphan", passive_deletes=True)
    __table_args__ = (CheckConstraint("level IN ('central','state')", name="level_valid"), Index("idx_schemes_state_active", "state", "is_active"))

class SchemeCategory(Base):
    __tablename__ = "scheme_categories"
    category_id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    scheme_map: Mapped[list["SchemeCategoryMap"]] = relationship(back_populates="category", cascade="all, delete-orphan", passive_deletes=True)

class SchemeCategoryMap(Base):
    __tablename__ = "scheme_category_map"
    scheme_id: Mapped[str] = mapped_column(ForeignKey("schemes.scheme_id", ondelete="CASCADE"), primary_key=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("scheme_categories.category_id", ondelete="CASCADE"), primary_key=True)
    scheme: Mapped["Scheme"] = relationship(back_populates="category_map")
    category: Mapped["SchemeCategory"] = relationship(back_populates="scheme_map")
