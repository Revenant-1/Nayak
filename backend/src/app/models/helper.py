from datetime import datetime

from sqlalchemy import (
    DateTime,
    MetaData
    )

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    DeclarativeBase

    )


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
