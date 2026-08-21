from typing import Optional, Dict, Tuple
from app.models.models import SessionLocal, User as SQLUser
from passlib.hash import bcrypt
from datetime import datetime, timedelta
from jose import jwt
from pathlib import Path
import secrets
import bcrypt
import json

Config_Dir = Path("/home/riyaz-khan/Desktop/Nayak/backend/config")
Config_Dir.mkdir(exist_ok=True)

Config_File = Config_Dir / "auth_config.json"

DEFAULT_CONFIG = {
    "jwt_secret": secrets.token_hex(32),
    "jwt_expiry_hours": 24,
    "guest_expiry_hours": 6,
    "max_login_attempts": 3,
    "lockout_duration_minutes": 30,
    "bcrypt_rounds": 12
}

if Config_File.exists():
    with open (Config_File, "r") as f:
        config = json.load(f)
else:
    config = DEFAULT_CONFIG.copy()
    with open(Config_File, "w") as f:
        json.dump(config, f, indent=2)

# Get a new database session
def _get_db():
    return SessionLocal()

# Close database session
def _close_db(db):
    db.close()

# Create a Hash password
import bcrypt

def _hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=config["bcrypt_rounds"])
    hashed = bcrypt.hashpw(
        password.encode("utf-8"),
        salt
    )
    return hashed.decode("utf-8")
# Verify password against stored hash
def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"),
        hashed.encode("utf-8")
    ) 
# Get user from SQLite database
def get_user(username: str) -> Optional[SQLUser]:
    db = _get_db()
    try:
        user = db.query(SQLUser).filter(SQLUser.username == username).first()
        return user
    finally:
        _close_db(db)

# Record a failed login attempt
def _record_failed_attempt(username: str, db):
    # We'll use a simple approach - store attempts in a separate table or use user table
    # For now, just track in memory pattern but using db session
    # You can extend this with a LoginAttempts table if needed
    pass


# Reset failed login attempts on successful auth
def _reset_failed_attempts(username: str, db):
    pass

# Generate JWT token for user
def generate_token(user_id: str, guest: bool = False) -> Tuple[str, datetime]:
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


# Authenticate user with username and password from SQLite database
def authenticate_user(username: str, password: str) -> Optional[Dict]:
    db = _get_db()

    try:
        user = get_user(username)

        # if user not exist doesnt mean anything
        if not user:
            return None

        # if password is wrong 
        if not _verify_password(password, user.password_hash):
            # Record failed attempt
            _record_failed_attempt(username, db)
            return None

        # Successful login - reset attempts
        _reset_failed_attempts(username, db)

        user.last_login = datetime.utcnow()
        user.login_count = (user.login_count or 0) + 1
        db.commit()

        return {
            "user_id": str(user.id),
            "username": user.username,
            "user_type": user.user_type,
            "is_active": user.is_active,
        }
    except Exception as e:
        db.rollback()
        raise e
    finally:
        _close_db(db)

# Register a new user.
def get_user_by_email(email: str) -> Optional[SQLUser]:
    db = _get_db()
    try:
        return db.query(SQLUser).filter(SQLUser.email == email).first()
    finally:
        _close_db(db)

def register_user(username: str, password: str, email: str) -> SQLUser:
    db = _get_db()

    try:
        # Check if username or email already exists
        if get_user(username):
            raise ValueError("Username is already taken")

        if get_user_by_email(email):
            raise ValueError("Email is already registered")

        new_user = SQLUser(
            id=f"usr_{secrets.token_hex(8)}",
            username=username,
            email=email,
            password_hash=_hash_password(password),
            user_type="regular",
            is_active=True,  # Set to True so user is active upon registration
            created_at=datetime.utcnow(),
            last_login=None,
            login_count=0,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    except Exception:
        db.rollback()
        raise

    finally:
        _close_db(db)