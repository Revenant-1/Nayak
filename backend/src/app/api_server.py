from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.ProcessCommands import processCommand
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
# Request model
# --------------------------------------------------

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