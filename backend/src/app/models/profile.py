from __future__ import annotations
from datetime import date
from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .helper import Base

class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    occupation: Mapped[str] = mapped_column(String(100), nullable=False)
    annual_income: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    gender: Mapped[str | None] = mapped_column(String(20))
    category: Mapped[str | None] = mapped_column(String(30))
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
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
