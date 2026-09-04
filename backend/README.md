# Nayak Backend Setup Guide

This folder contains the Python FastAPI backend for **Nayak - AI-Powered Legal Assistant**.

## 1. Quick Start

Run the server with `uv`:

```bash
uv run uvicorn app.api_server:app --reload
```

or using python directly:

```bash
python -m app.api_server
```

---

## 2. Folder Structure

```text
nayak-backend/
├── pyproject.toml
├── requirements.txt
├── README.md
├── .env
├── src/
│   └── app/
│       ├── __init__.py
│       ├── Ai.py
│       ├── ProcessCommands.py
│       ├── api_server.py
│       └── chat_history.json
└── .venv/
```

The app entry point is the FastAPI app object named `app` inside `app.api_server`.

---

## 3. Environment Variables

Create a `.env` file in `nayak-backend/`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=your_database_url_here
AUTH_JWT_SECRET=use-a-long-random-secret
CORS_ORIGINS=http://localhost:5173
```

`AUTH_JWT_SECRET` is required at startup. Keep `.env` local and use a different
secret for each deployed environment.

---

## 4. API Endpoints

- `GET /api/history`: Fetch conversation history.
- `POST /api/command`: Submit user legal query/command (`{ "text": "..." }`).
- `POST /api/new-chat`: Clear conversation session history.
- `POST /api/auth/login`: Log in with a username and password.
- `POST /api/auth/register`: Create a user account.
- `POST /api/auth/guest-login`: Create a temporary guest account.
- `POST /api/grievances`: Submit a grievance as a registered user and receive a downloadable Markdown script.
- `GET /api/grievances`: List the signed-in user's grievances.

---

## 5. Database Schema Changes

Whenever a SQLAlchemy model or database schema changes, create and apply an Alembic migration from the backend directory:

```bash
uv run alembic revision --autogenerate -m "describe the schema change"
uv run alembic upgrade head
```

Always inspect the generated migration before applying it. Do not use `Base.metadata.create_all()` to update an existing schema.
