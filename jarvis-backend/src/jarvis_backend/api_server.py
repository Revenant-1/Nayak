# api_server.py
import json
from pathlib import Path

from dotenv import load_dotenv

# Load API keys from the repo-root .env (parent of jarvis-backend).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from flask import Flask, jsonify, request
from flask_cors import CORS

# Web UI speaks replies in the browser — skip pyttsx3 to avoid double audio.
import Speak

Speak.speak = lambda text: print(f"[jarvis] {text}")

from ProcessCommands import processCommand

app = Flask(__name__)
CORS(app)  # allow the Vite dev server to call this API

HISTORY_PATH = Path(__file__).parent / "chat_history.json"


def read_history():
    if not HISTORY_PATH.exists():
        return []
    with open(HISTORY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def write_history(history):
    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)


@app.get("/api/history")
def get_history():
    return jsonify(read_history())


@app.post("/api/command")
def post_command():
    payload = request.get_json(force=True) or {}
    text = (payload.get("text") or "").strip()
    if not text:
        return jsonify({"error": "empty command"}), 400

    # Run your existing pipeline. This should return a plain string reply
    # — if it already handles TTS itself (pyttsx3, etc.) that's fine too,
    # the browser will *also* speak the reply via SpeechSynthesis, so
    # consider disabling one of the two to avoid talking over itself.
    reply = processCommand(text) or "Done."

    history = read_history()
    # ask_ai already appends to chat_history.json — normalize the user line
    # so the frontend shows the raw command, not the internal prompt suffix.
    if (
        history
        and history[-1].get("role") == "assistant"
        and history[-1].get("content") == reply
        and len(history) >= 2
        and history[-2].get("role") == "user"
    ):
        history[-2]["content"] = text
    else:
        history.append({"role": "user", "content": text})
        history.append({"role": "assistant", "content": reply})
    write_history(history)

    return jsonify({"response": reply})


@app.post("/api/new-chat")
def new_chat():
    # Optional: archive the current log instead of just wiping it.
    write_history([])
    return jsonify({"ok": True})


if __name__ == "__main__":
    # Bind to 127.0.0.1 — on macOS, localhost:5000 often hits AirPlay instead.
    app.run(host="127.0.0.1", port=5000, debug=True)