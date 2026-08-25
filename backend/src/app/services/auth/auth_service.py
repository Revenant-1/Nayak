import os
import secrets
from datetime import datetime, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.models import User


JWT_ALGORITHM = "HS256"
JWT_SECRET = os.getenv("AUTH_JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("AUTH_JWT_SECRET is missing")
JWT_EXPIRY_HOURS = int(os.getenv("AUTH_JWT_EXPIRY_HOURS", "24"))
GUEST_EXPIRY_HOURS = int(os.getenv("AUTH_GUEST_EXPIRY_HOURS", "2"))
BCRYPT_ROUNDS = int(os.getenv("AUTH_BCRYPT_ROUNDS", "12"))


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    ).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def generate_token(user_id: str, guest: bool = False) -> tuple[str, datetime]:
    expires_at = datetime.utcnow() + timedelta(
        hours=GUEST_EXPIRY_HOURS if guest else JWT_EXPIRY_HOURS
    )
    payload = {
        "user_id": user_id,
        "guest": guest,
        "iat": datetime.utcnow(),
        "exp": expires_at,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM), expires_at


def verify_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active or not _verify_password(password, user.password_hash):
        return None

    user.last_login = datetime.utcnow()
    user.login_count = (user.login_count or 0) + 1
    db.commit()
    db.refresh(user)
    return user


def register_user(db: Session, username: str, password: str, email: str) -> User:
    if db.query(User).filter(User.username == username).first():
        raise ValueError("Username is already taken")
    if db.query(User).filter(User.email == email).first():
        raise ValueError("Email is already registered")

    user = User(
        id=f"usr_{secrets.token_hex(8)}",
        username=username,
        email=email,
        password_hash=_hash_password(password),
        user_type="regular",
        is_active=True,
        created_at=datetime.utcnow(),
        login_count=0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_guest_user(db: Session) -> User:
    guest_id = f"guest_{secrets.token_hex(8)}"
    user = User(
        id=guest_id,
        username=guest_id,
        password_hash=_hash_password(secrets.token_urlsafe(16)),
        user_type="guest",
        is_active=True,
        created_at=datetime.utcnow(),
        login_count=0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user(db: Session, user_id: str) -> User | None:
    return db.get(User, user_id)
