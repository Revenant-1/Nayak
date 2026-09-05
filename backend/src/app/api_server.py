import os
from datetime import datetime

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.Ai import create_chat_session, groq_client, load_history
from app.ProcessCommands import processCommand
from app.models import Grievance, Session as ChatSession
from app.models import User, get_db
from app.services.auth import (
    authenticate_user,
    create_guest_user,
    generate_token,
    get_user,
    register_user,
    verify_token,
)


app = FastAPI(
    title="Nayak Legal Assistant API",
    description="Backend API for Nayak - AI-Powered Legal Assistant",
    version="0.1.0",
)

origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=bool(origins),
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer = HTTPBearer()


class NewLoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    email: EmailStr


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user_id: str
    username: str
    user_type: str
    expires_in: int


class CommandRequest(BaseModel):
    text: str = Field(min_length=1)
    session_id: str | None = None


class GrievanceRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=10, max_length=10000)
    location: str | None = Field(default=None, max_length=255)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    payload = verify_token(credentials.credentials)
    user_id = payload.get("user_id") if payload else None
    user = get_user(db, user_id) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return user


def get_registered_user(user: User = Depends(get_current_user)) -> User:
    if user.user_type == "guest":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please sign in with a registered account to raise a grievance",
        )
    return user


def grievance_script(grievance: Grievance) -> str:
    return (
        "# Grievance Submission\n\n"
        f"**Reference:** {grievance.id}\n"
        f"**Submitted:** {grievance.created_at.isoformat()} UTC\n"
        f"**Status:** {grievance.status}\n\n"
        f"## Subject\n{grievance.title}\n\n"
        f"## Category\n{grievance.category}\n\n"
        f"## Location\n{grievance.location or 'Not provided'}\n\n"
        f"## Details\n{grievance.description}\n"
    )


@app.post("/api/grievances")
async def create_grievance(
    payload: GrievanceRequest,
    user: User = Depends(get_registered_user),
    db: Session = Depends(get_db),
):
    grievance = Grievance(
        user_id=user.id,
        title=payload.title.strip(),
        category=payload.category.strip(),
        description=payload.description.strip(),
        location=payload.location.strip() if payload.location else None,
    )
    db.add(grievance)
    db.commit()
    db.refresh(grievance)
    return {
        "id": grievance.id,
        "status": grievance.status,
        "created_at": grievance.created_at,
        "script": grievance_script(grievance),
    }


@app.get("/api/grievances")
async def list_grievances(user: User = Depends(get_registered_user), db: Session = Depends(get_db)):
    grievances = db.query(Grievance).filter(Grievance.user_id == user.id).order_by(Grievance.created_at.desc()).all()
    return [
        {"id": grievance.id, "title": grievance.title, "category": grievance.category, "status": grievance.status, "created_at": grievance.created_at}
        for grievance in grievances
    ]


@app.post("/api/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str | None = Form(default=None),
    user: User = Depends(get_current_user),
):
    if not groq_client:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is missing from .env")
    content_type = audio.content_type or ""
    filename = (audio.filename or "").lower()
    known_audio_extension = filename.endswith((".webm", ".ogg", ".mp4", ".wav", ".mp3", ".m4a"))
    if not (
        content_type.startswith("audio/")
        or content_type.startswith("video/webm")
        or content_type == "application/ogg"
        or (content_type == "application/octet-stream" and known_audio_extension)
    ):
        raise HTTPException(status_code=415, detail="An audio file is required")

    contents = await audio.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The audio recording is empty")
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="The audio recording is too large")

    try:
        transcription_options = {
            "file": (audio.filename or "recording.webm", contents),
            "model": "whisper-large-v3-turbo",
            "response_format": "verbose_json",
        }
        if language:
            transcription_options["language"] = language
        result = groq_client.audio.transcriptions.create(**transcription_options)
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {error}") from error

    return {"text": result.text, "language": getattr(result, "language", None)}


def make_login_response(user: User, guest: bool = False) -> LoginResponse:
    token, expires_at = generate_token(str(user.id), guest=guest)
    return LoginResponse(
        token=token,
        user_id=str(user.id),
        username=user.username,
        user_type=user.user_type,
        expires_in=max(0, int((expires_at - datetime.utcnow()).total_seconds())),
    )


@app.get("/api/history")
async def get_history(session_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chat_session = db.query(ChatSession).filter(
        ChatSession.session_id == session_id,
        ChatSession.user_id == user.id,
    ).first()
    if not chat_session:
        raise HTTPException(status_code=404, detail="Session not found")
    return load_history(session_id)


@app.post("/api/command")
async def post_command(payload: CommandRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty command")

    session_id = payload.session_id
    if session_id:
        chat_session = db.query(ChatSession).filter(
            ChatSession.session_id == session_id,
            ChatSession.user_id == user.id,
        ).first()
        if not chat_session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        session_id = create_chat_session(user_id=str(user.id))

    return {
        "response": processCommand(text, session_id=session_id) or "Done.",
        "session_id": session_id,
    }


@app.post("/api/new-chat")
async def new_chat(user: User = Depends(get_current_user)):
    return {"ok": True, "session_id": create_chat_session(str(user.id))}


@app.post("/api/session")
async def create_session(user: User = Depends(get_current_user)):
    return {"session_id": create_chat_session(str(user.id))}


@app.post("/upload-document")
async def upload_document(file: UploadFile, user: User = Depends(get_current_user)):
    raise HTTPException(status_code=501, detail="Document upload is not implemented")


@app.post("/api/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return make_login_response(user, guest=user.user_type == "guest")


@app.post("/api/auth/register", response_model=LoginResponse)
async def register(payload: NewLoginRequest, db: Session = Depends(get_db)):
    try:
        user = register_user(db, payload.username, payload.password, str(payload.email))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return make_login_response(user)


@app.post("/api/auth/guest-login", response_model=LoginResponse)
async def guest_login(db: Session = Depends(get_db)):
    return make_login_response(create_guest_user(db), guest=True)


@app.get("/api/auth/verify")
async def verify(token: str, db: Session = Depends(get_db)):
    payload = verify_token(token)
    user_id = payload.get("user_id") if payload else None
    user = get_user(db, user_id) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"valid": True, "user_id": str(user.id), "guest": user.user_type == "guest"}


def main():
    import uvicorn

    uvicorn.run("app.api_server:app", host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
