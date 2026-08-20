from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.ProcessCommands import processCommand
from app.microService.auth import (
    authenticate_user,
    create_guest_user,
    verify_token,
    get_user_info,
    generate_token,
)
from datetime import datetime
import json


# api_server.py lives in src/app; load keys from the backend root.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


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
# Chat history
# --------------------------------------------------

HISTORY_PATH = Path(__file__).parent / "chat_history.json"


def read_history():
    if not HISTORY_PATH.exists():
        return []

    with open(HISTORY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def write_history(history):
    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)


# --------------------------------------------------
# Request/Response models for authentication
# --------------------------------------------------

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


# --------------------------------------------------
# Routes
# --------------------------------------------------

@app.get("/api/history")
async def get_history():
    return read_history()


@app.post("/api/command")
async def post_command(payload: CommandRequest):

    text = payload.text.strip()

    if not text:
        return {"error": "empty command"}

    # Run your existing pipeline
    reply = processCommand(text) or "Done."

    # ask_ai already appends to chat_history.json
    # Normalize the user line so the frontend
    # shows the raw command.
    history = read_history()

    if (
        history
        and history[-1].get("role") == "assistant"
        and history[-1].get("content") == reply
        and len(history) >= 2
        and history[-2].get("role") == "user"
    ):
        history[-2]["content"] = text
    else:
        history.append({
            "role": "user",
            "content": text
        })

        history.append({
            "role": "assistant",
            "content": reply
        })

    write_history(history)

    return {"response": reply}


@app.post("/api/new-chat")
async def new_chat():

    write_history([])

    return {"ok": True}


# --------------------------------------------------
# Authentication Routes
# --------------------------------------------------

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    """
    Authenticate user with username and password.
    Returns JWT token and user info.
    """
    try:
        user_info = authenticate_user(payload.username, payload.password)
        token, expiry = generate_token(user_info["user_id"], guest=user_info["user_type"] == "guest")

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
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
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
        from app.microService.auth import config

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