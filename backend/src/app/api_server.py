from fastapi import (
    FastAPI, UploadFile, Depends,
    HTTPException, status
    )
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import (
    HTTPAuthorizationCredentials, 
    HTTPBearer
    )
from pydantic import BaseModel
from app.ProcessCommands import processCommand
from app.Ai import create_chat_session, load_history
from app.services.auth import (
    authenticate_user,
    register_user,
    create_guest_user,
    verify_token,
    get_user_info,
    generate_token,
)
from datetime import datetime
from app.models import Session, SessionLocal


bearer = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    )-> str:
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return payload["user_id"]
# --------------------------------------------------
# FastAPI app
# --------------------------------------------------

app = FastAPI(
    title="Nayak Legal Assistant API",
    description="Backend API for Nayak - AI-Powered Legal Assistant",
    version="0.1.0"
)

# --------------------------------------------------
# CORS
# --------------------------------------------------
# https://fastapi.tiangolo.com/tutorial/cors/  read this to understand the below code

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Request/Response models for authentication
# --------------------------------------------------

class NewLoginRequest(BaseModel):
    username: str
    password: str
    email: str

class LoginRequest(BaseModel):
    username: str
    password: str


class GuestLoginResponse(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user_id: str
    username: str
    user_type: str
    expires_in: int  # seconds


class CommandRequest(BaseModel):
    text: str
    session_id: str | None = None

# --------------------------------------------------
# Routes
# --------------------------------------------------

@app.get("/api/history")
async def get_history(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    db = SessionLocal()

    try:
        chat_session = (
            db.query(Session)
            .filter(
                Session.session_id == session_id,
                Session.user_id == user_id,
            )
            .first()
        )

        if not chat_session:
            raise HTTPException(status_code=404, detail="Session not found")

        return load_history(session_id)
    finally:
        db.close()


@app.post("/api/command")
async def post_command(
    payload: CommandRequest,
    user_id: str = Depends(get_current_user),
):
    text = payload.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Empty command")

    if not payload.session_id:
        session_id = create_chat_session(user_id=user_id)
    else:
        session_id = payload.session_id

        db = SessionLocal()
        try:
            chat_session = (
                db.query(Session)
                .filter(
                    Session.session_id == session_id,
                    Session.user_id == user_id,
                )
                .first()
            )

            if not chat_session:
                raise HTTPException(status_code=404, detail="Session not found")
        finally:
            db.close()

    reply = processCommand(text, session_id=session_id) or "Done."

    return {
        "response": reply,
        "session_id": session_id,
    }

@app.post("/api/new-chat")
async def new_chat(user_id: str = Depends(get_current_user)):
    return {"ok": True, "session_id": create_chat_session(user_id)}

@app.post("/api/session")
async def create_session(user_id: str = Depends(get_current_user)):
    session_id = create_chat_session(user_id)
    return {"session_id": session_id}
@app.post("/upload-document")
async def upload_document(file: UploadFile):
    ...
# --------------------------------------------------
# Authentication Routes
# --------------------------------------------------

@app.post("/api/auth/login", response_model=LoginResponse)
# Authenticate user with username and password.
async def login(payload: LoginRequest):
    user_info = authenticate_user(payload.username, payload.password)
    
    # Check if authentication failed
    if not user_info:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    try:
        token, expiry = generate_token(
            user_info["user_id"], 
            guest=user_info.get("user_type") == "guest"
        )
        expires_in = int((expiry - datetime.utcnow()).total_seconds())

        return LoginResponse(
            token=token,
            user_id=user_info["user_id"],
            username=user_info["username"],
            user_type=user_info["user_type"],
            expires_in=expires_in
        )
    except Exception as e:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.post("/api/auth/register", response_model=LoginResponse)
# Authenticate user to register.
async def register(data: NewLoginRequest):
    try:
        user = register_user(
            data.username,
            data.password,
            data.email
        )

        token, expiry = generate_token(
            str(user.id),
            guest=False
        )

        expires_in = int(
            (expiry - datetime.utcnow()).total_seconds()
        )

        return LoginResponse(
            token=token,
            user_id=str(user.id),
            username=user.username,
            user_type=user.user_type,
            expires_in=expires_in
        )
    except ValueError as e:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )



@app.post("/api/auth/guest-login", response_model=LoginResponse)
async def guest_login():
    """
    Create a guest user session.
    Returns temporary token for guest access.
    """
    try:
        from datetime import datetime
        from fastapi import HTTPException, status

        username, password = create_guest_user()
        import jwt as jwt_lib
        from app.services.auth import config

        token, expiry = generate_token(username, guest=True)
        expires_in = int((expiry - datetime.utcnow()).total_seconds())

        return LoginResponse(
            token=token,
            user_id=f"guest_{username}",
            username=username,
        )
    except Exception as e:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.get("/api/auth/verify")
async def verify(token: str):
    """
    Verify if a token is valid.
    Returns user info if valid.
    """
    try:
        from fastapi import HTTPException, status
        payload = verify_token(token)
        user_info = get_user_info(payload.get("user_id", "").replace("guest_", ""))
        return {"valid": True, "user_id": payload.get("user_id"), "guest": payload.get("guest", False)}
    except Exception as e:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


# --------------------------------------------------
# Run server
# --------------------------------------------------

def main():
    import uvicorn
    uvicorn.run(
        "app.api_server:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )


if __name__ == "__main__":
    main()