from datetime import datetime
import os
from pathlib import Path
from dotenv import load_dotenv

from sqlalchemy import (
    DateTime,
    MetaData,
    create_engine,
    )

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    DeclarativeBase,
    sessionmaker,
)

load_dotenv(Path(__file__).resolve().parents[3] / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Naming convention so Alembic autogenerate produces stable, predictable
# constraint/index names instead of DB-generated ones that differ across
# SQLite/Postgres. This is the single biggest thing that saves pain later
# if you ever add migrations instead of create_all().

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


# This class will be used as parent class so we can let the multiple table inherit this property
class TimestampMixin:

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


def gen_uuid() -> str:
    import uuid
    return str(uuid.uuid4())


SUPPORTED_LANGS = (
    "en", "hi", "mr", "ta", "te", "bn", "gu", "kn", "ml", "pa", "or", "as", "ur",
)
MESSAGE_ROLES = ("user", "assistant", "system")
SESSION_MODES = ("text", "voice", "video")
USER_SCHEME_STATUSES = ("recommended", "saved", "applied", "rejected")
