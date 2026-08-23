from __future__ import annotations
from datetime import datetime
from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .helper import Base, USER_SCHEME_STATUSES

class UserScheme(Base):
    __tablename__ = "user_schemes"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    session_id: Mapped[str | None] = mapped_column(ForeignKey("sessions.session_id", ondelete="SET NULL"))
    scheme_id: Mapped[str] = mapped_column(ForeignKey("schemes.scheme_id", ondelete="CASCADE"), nullable=False)
    match_score: Mapped[float | None] = mapped_column(Float)
    recommended_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String, default="recommended")
    user: Mapped["User | None"] = relationship(back_populates="user_schemes")
    session: Mapped["Session | None"] = relationship(back_populates="user_schemes")
    scheme: Mapped["Scheme"] = relationship(back_populates="user_schemes")
    __table_args__ = (Index("idx_user_schemes_user", "user_id"), Index("idx_user_schemes_scheme", "scheme_id"), Index("uq_user_scheme_pair", "user_id", "scheme_id", unique=True), CheckConstraint(f"status IN {USER_SCHEME_STATUSES}", name="status_valid"))
