# Connecting to the Nayak Python Backend

This frontend communicates with the FastAPI backend located in `nayak-backend/src/app/api_server.py`.

## 1. What the frontend expects

| Method | Path             | Body                | Response                                  |
|--------|------------------|----------------------|--------------------------------------------|
| GET    | `/api/history`   | —                    | `[{ "role": "user"\|"assistant", "content": "..." }, ...]` |
| POST   | `/api/command`   | `{ "text": "..." }`  | `{ "response": "..." }`                    |
| POST   | `/api/new-chat`  | —                    | `{ "ok": true }`                           |

## 2. Running the Backend

From `nayak-backend`:

```bash
uv run uvicorn app.api_server:app --reload
```

or:

```bash
python -m app.api_server
```

## 3. Running the Frontend

From `nayak-frontend`:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## 4. About Wake Word and Voice Input

The web interface listens for the wake word `"nayak"`, buffers the voice input until a pause, and sends the query to the `/api/command` endpoint.
