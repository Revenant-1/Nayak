# Connecting to the Python backend

This frontend expects a small Flask API layered on top of your existing
`main.py`, `AI.py`, and `ProcessCommands.py`. It never calls Python
directly — it only ever talks HTTP to Flask — so your existing modules
stay untouched; you're adding a thin web entry point next to whatever
console/voice loop `main.py` already runs.

## 1. What the frontend expects

| Method | Path             | Body                | Response                                  |
|--------|------------------|----------------------|--------------------------------------------|
| GET    | `/api/history`   | —                    | `[{ "role": "user"\|"assistant", "content": "..." }, ...]` (or `{ "history": [...] }`) |
| POST   | `/api/command`   | `{ "text": "..." }`  | `{ "response": "..." }`                    |
| POST   | `/api/new-chat`  | —                    | anything 2xx (optional — see below)        |

This matches `chat_history.json`'s existing shape exactly, so `/api/history`
can be a near-literal file read.

## 2. Install the extra dependencies

```bash
pip install flask flask-cors
```

`flask-cors` is required because the Vite dev server (`localhost:5173`)
and Flask (`localhost:5000`) are different origins — without it the
browser will block every request with a CORS error.

## 3. Add `api_server.py` next to `main.py`

This is a starting point — rename `process_command` below to whatever
function `ProcessCommands.py` actually exposes (the frontend only cares
about the HTTP contract, not how you get there).

```python
# api_server.py
import json
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

# Import your existing command pipeline. Adjust the name to match
# whatever ProcessCommands.py / AI.py actually export.
from ProcessCommands import process_command

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
    reply = process_command(text)

    history = read_history()
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
    app.run(port=5000, debug=True)
```

Run it with:

```bash
python api_server.py
```

## 4. Run the frontend

```bash
cd jarvis-frontend
npm install
npm run dev
```

Open the printed `localhost:5173` URL. The sidebar should populate from
`chat_history.json` immediately; if it stays empty and you see a red
banner, Flask isn't reachable yet (check the port and that CORS is on).

## 5. About the wake word and voice loop

This UI does **all** wake-word detection and speech-to-text in the
browser via the Web Speech API (`webkitSpeechRecognition`) — it listens
continuously for the word "jarvis," then buffers whatever follows until
you pause, and sends only that final text to `/api/command`.

That means:

- Your Python backend no longer needs to run its own microphone loop
  when you're using this web UI — `process_command(text)` (or your
  equivalent) just needs to accept text and return text. If `main.py`
  currently blocks on `speech_recognition.listen()`, keep that path for
  console/CLI use, but the web UI bypasses it entirely.
- Browser support for `webkitSpeechRecognition` is effectively
  Chrome/Edge only. Firefox and Safari will show the mic button disabled;
  the text input at the bottom always works as a fallback regardless of
  browser.
- Voice recognition over the Web Speech API requires either `https://`
  or `localhost` — it will not work if you access the dev server from
  another device on your network by IP address.

## 6. Talking back

If the browser supports `speechSynthesis` (all evergreen browsers do),
the frontend speaks every assistant reply aloud automatically. If
`ProcessCommands.py` already does its own TTS (e.g. via `pyttsx3`), you
may want to make that conditional on a CLI flag so the web UI doesn't
get double audio.

## 7. Pointing at a different backend host/port

Copy `.env.example` to `.env` and change `VITE_API_BASE_URL` — the
frontend reads this instead of the hardcoded `localhost:5000` default.

## 8. Building for production

```bash
npm run build
```

Outputs static files to `dist/`. You can serve them with Flask itself
(`app = Flask(__name__, static_folder="jarvis-frontend/dist")`) or any
static host — just make sure `VITE_API_BASE_URL` is set correctly at
build time if Flask won't be on the same origin.

## Troubleshooting

- **"Can't reach the backend" banner** — Flask isn't running, is on a
  different port than 5000, or CORS isn't enabled.
- **Mic button greyed out** — your browser doesn't support
  `webkitSpeechRecognition`. Use Chrome or Edge, or type commands instead.
- **Mic permission prompt appears twice** — expected. One request is for
  `SpeechRecognition`, the other is for the optional Web Audio level
  meter that drives the orb's reactive glow. Denying the second is safe;
  the orb just falls back to a simulated pulse.
- **Nothing happens after saying "jarvis"** — check the browser console;
  recognition results are logged there, and `onerror` events will show up
  if the mic permission was denied.
