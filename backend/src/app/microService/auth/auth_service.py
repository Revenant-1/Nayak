#!/usr/bin/env python3
"""
Authentication microservice for Nayak AI Legal Assistant
Integrated with SQLite database via SQLAlchemy
"""

import os
import secrets
import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, List
from pathlib import Path

# SQLAlchemy imports - using your existing database setup
from passlib.hash import bcrypt
from jose import JWTError, jwt

# Import database session and models
from app.Model.models import User as SQLUser, SessionLocal, gen_uuid

# Configuration
CONFIG_DIR = Path("/mnt/shared/Nayak/backend/config")
CONFIG_DIR.mkdir(exist_ok=True)

# Load configuration
CONFIG_FILE = CONFIG_DIR / "auth_config.json"

DEFAULT_CONFIG = {
    "jwt_secret": secrets.token_hex(32),
    "jwt_expiry_hours": 24,
    "guest_expiry_hours": 2,
    "max_login_attempts": 3,
    "lockout_duration_minutes": 30,
    "bcrypt_rounds": 12
}

# Load config
CONFIG_FILE_EXISTS = CONFIG_FILE.exists()
if CONFIG_FILE_EXISTS:
    with open(CONFIG_FILE, 'r') as f:
        config = json.load(f)
else:
    config = DEFAULT_CONFIG.copy()
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)

# --- Database Helper Functions ---

def _get_db():
    """Get a new database session"""
    return SessionLocal()

def _close_db(db):
    """Close database session"""
    db.close()

def _hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hash(password, rounds=config["bcrypt_rounds"])

def _verify_password(password: str, hashed: str) -> bool:
    """Verify password against stored hash"""
    return bcrypt.verify(password, hashed)

def _generate_token(user_id: str, guest: bool = False) -> Tuple[str, datetime]:
    """Generate JWT token for user"""
    expiry_hours = config["guest_expiry_hours"] if guest else config["jwt_expiry_hours"]
    expiry_time = datetime.utcnow() + timedelta(hours=expiry_hours)

    payload = {
        "user_id": user_id,
        "exp": expiry_time.timestamp(),
        "iat": datetime.utcnow().timestamp(),
        "guest": guest
    }

    token = jwt.encode(payload, config["jwt_secret"], algorithm="HS256")
    return token, expiry_time

def _verify_token(token: str) -> Optional[Dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, config["jwt_secret"], algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token

def _user_to_dict(user: SQLUser) -> Dict:
    """Convert SQLAlchemy User model to dict"""
    return {
        "user_id": str(user.user_id),
        "username": user.username,
        "password_hash": user.password_hash,
        "user_type": user.user_type if hasattr(user, 'user_type') else "regular",
        "is_active": user.is_active if hasattr(user, 'is_active') else True,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "login_count": user.login_count if hasattr(user, 'login_count') else 0,
        "last_login": user.last_login.isoformat() if user.last_login else None
    }

def _dict_to_user_data(data: Dict) -> SQLUser:
    """Create SQLAlchemy User dict from data dict"""
    # This is used for creating/updating users
    return {
        "username": data.get("username", ""),
        "password_hash": data.get("password_hash", ""),
        "user_type": data.get("user_type", "regular"),
        "is_active": data.get("is_active", True),
        "login_count": data.get("login_count", 0),
        "last_login": data.get("last_login")
    }
# --- Public Token Generation Function ---

def generate_token(user_id: str, guest: bool = False) -> Tuple[str, datetime]:
    return _generate_token(user_id, guest)

def verify_token(token: str) -> Optional[Dict]:
    """
    Public wrapper function to verify JWT token
    
    Args:
        token: The token to verify
    
    Returns:
        Decoded payload if valid, None if invalid/expired
    """
    return _verify_token(token)
# --- User Database Operations ---

def save_user(username: str, password: str, user_type: str = "regular") -> SQLUser:
    """Create new user account in SQLite database"""
    db = _get_db()
    try:
        # Check if user already exists
        existing = db.query(SQLUser).filter(SQLUser.username == username).first()
        if existing:
            raise ValueError(f"Username '{username}' already exists")

        # Create new user
        user_id = f"usr_{secrets.token_hex(8)}"
        hashed_pw = _hash_password(password)

        new_user = SQLUser(
            user_id=user_id,
            username=username,
            password_hash=hashed_pw,
            user_type=user_type,
            is_active=True,
            created_at=datetime.utcnow(),
            login_count=0,
            last_login=None
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user
    except Exception as e:
        db.rollback()
        raise e
    finally:
        _close_db(db)

def get_user(username: str) -> Optional[SQLUser]:
    """Get user from SQLite database"""
    db = _get_db()
    try:
        user = db.query(SQLUser).filter(SQLUser.username == username).first()
        return user
    finally:
        _close_db(db)

def authenticate_user(username: str, password: str) -> Optional[Dict]:
    """Authenticate user with username and password from SQLite database"""
    db = _get_db()
    try:
        # Check if user exists
        user = db.query(SQLUser).filter(SQLUser.username == username).first()
        if not user:
            return None

        # Check if account is active
        if not user.is_active:
            return None

        # Verify password
        if not _verify_password(password, user.password_hash):
            # Record failed attempt
            _record_failed_attempt(username, db)
            return None

        # Successful login - reset attempts
        _reset_failed_attempts(username, db)

        # Update user stats
        user.last_login = datetime.utcnow()
        user.login_count = (user.login_count or 0) + 1
        db.commit()

        # Generate token
        token, expiry = _generate_token(str(user.user_id), guest=user.user_type == "guest")

        return {
            "user_id": str(user.user_id),
            "username": user.username,
            "user_type": user.user_type,
            "is_active": user.is_active,
            "token": token,
            "expires_in": int((expiry - datetime.utcnow()).total_seconds())
        }
    except Exception as e:
        db.rollback()
        raise e
    finally:
        _close_db(db)

def create_guest_user() -> Tuple[str, str]:
    """Create guest user account in SQLite database"""
    db = _get_db()
    try:
        guest_id = f"guest_{secrets.token_hex(8)}"
        username = f"guest_{guest_id}"
        password = secrets.token_urlsafe(16)

        # Check if guest user already exists (unlikely but handle)
        existing = db.query(SQLUser).filter(SQLUser.username == username).first()
        if existing:
            # Generate new guest ID
            guest_id = f"guest_{secrets.token_hex(8)}"
            username = f"guest_{guest_id}"
            password = secrets.token_urlsafe(16)

        new_user = SQLUser(
            user_id=guest_id,
            username=username,
            password_hash=_hash_password(password),
            user_type="guest",
            is_active=True,
            created_at=datetime.utcnow(),
            login_count=0,
            last_login=None
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return username, password
    except Exception as e:
        db.rollback()
        raise e
    finally:
        _close_db(db)

def get_user_info(username: str) -> Optional[Dict]:
    """Get user information from SQLite database"""
    db = _get_db()
    try:
        user = db.query(SQLUser).filter(SQLUser.username == username).first()
        if not user:
            return None

        return {
            "user_id": str(user.user_id),
            "username": user.username,
            "user_type": user.user_type,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "login_count": user.login_count or 0,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
    finally:
        _close_db(db)

def update_user_password(username: str, new_password: str) -> bool:
    """Update user password in SQLite database"""
    db = _get_db()
    try:
        user = db.query(SQLUser).filter(SQLUser.username == username).first()
        if not user:
            return False

        user.password_hash = _hash_password(new_password)
        user.last_login = datetime.utcnow()
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e
    finally:
        _close_db(db)

def deactivate_user(username: str) -> bool:
    """Deactivate user account in SQLite database"""
    db = _get_db()
    try:
        user = db.query(SQLUser).filter(SQLUser.username == username).first()
        if not user:
            return False

        user.is_active = False
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e
    finally:
        _close_db(db)

# --- Login Attempt Tracking ---

def _record_failed_attempt(username: str, db):
    """Record a failed login attempt"""
    # We'll use a simple approach - store attempts in a separate table or use user table
    # For now, just track in memory pattern but using db session
    # You can extend this with a LoginAttempts table if needed
    pass

def _reset_failed_attempts(username: str, db):
    """Reset failed login attempts on successful auth"""
    pass

# --- Initialize with test users if database is empty ---
