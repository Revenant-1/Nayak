# Jarvis Backend Setup Guide

This folder is the Python backend for the Jarvis project.

Important: the app is not at the project root as `api_server.py`. The real module is inside the package folder:

- `src/learnuv/api_server.py`

Because of that, the correct UV command for this repo is:

```bash
uv run uvicorn learnuv.api_server:app --reload
```

This is the command you should use from inside `jarvis-backend`.

---

## 1. Folder structure

```text
jarvis-backend/
├── pyproject.toml
├── uv.lock
├── README.md
├── .env
├── src/
│   └── learnuv/
│       ├── __init__.py
│       ├── Ai.py
│       ├── ProcessCommands.py
│       ├── api_server.py
│       └── chat_history.json
└── .venv/
```

The app entry is the FastAPI app object named `app` inside `learnuv.api_server`.

---

## 2. Install UV

Official docs:

- https://docs.astral.sh/uv/
- https://docs.astral.sh/uv/getting-started/installation/
- https://github.com/astral-sh/uv/releases

Linux:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

macOS:

```bash
brew install uv
```

Windows PowerShell:

```powershell
irm https://astral.sh/uv/install.ps1 | iex
```

Then verify:

```bash
uv --version
```

---

## 3. Setup the backend

From inside `jarvis-backend`:

```bash
uv sync
```

Create a `.env` file in the same folder as `pyproject.toml`:

```env
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

The app loads the file from the backend root. In this project, the code uses:

```python
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
```

So the `.env` file belongs in:

- `jarvis-backend/.env`

Not inside `src`.

---

## 4. Run the backend

From `jarvis-backend`:

```bash
uv run uvicorn learnuv.api_server:app --reload
```

This is the correct repo-specific command.

Do not use:

```bash
uv run python src/learnuv/api_server.py
```

That path is not the normal app import pattern for this package layout and can fail in this repo.

---

## 5. Expected URL

The app in the current code listens on:

```text
http://127.0.0.1:8000
```

The Uvicorn config in the app file uses port `8000`.

---

## 6. OS-specific commands

### Linux / macOS

```bash
cd /path/to/jarvis-backend
uv sync
uv run uvicorn learnuv.api_server:app --reload
```

### Windows PowerShell

```powershell
cd C:\path\to\jarvis-backend
uv sync
uv run uvicorn learnuv.api_server:app --reload
```

### Windows CMD

```cmd
cd C:\path\to\jarvis-backend
uv sync
uv run uvicorn learnuv.api_server:app --reload
```

---

## 7. Quick start

If you just want the shortest correct version:

```bash
cd jarvis-backend
uv sync
uv run uvicorn learnuv.api_server:app --reload
```

Then open:

```text
http://127.0.0.1:8000
```

---

## 8. Important note

This repo uses a package-style import path, not a direct file run path.

So the correct command is:

```bash
uv run uvicorn learnuv.api_server:app --reload
```

not:

```bash
uv run uvicorn api_server:app --reload
```

and not:

```bash
uv run python src/learnuv/api_server.py
```

Use the package module path and run it from the backend folder.

FastAPI automatically provides Swagger UI docs at the `/docs` endpoint.

You can also check the API manually with curl:

```bash
curl http://127.0.0.1:5000/api/history
```

This should return JSON, usually an empty list or existing history from `chat_history.json`.

---

## 12. Environment and AI behavior

This backend tries AI providers in the following order:

1. Local legal Llama model
2. Local general-purpose Llama model
3. Gemini
4. Groq

This logic is defined in `src/learnuv/Ai.py`.

If the local model fails to load, the code prints warnings but continues with the fallback models. This is expected and not a fatal error.

Example log:

```text
[AI WARN] Failed to load Indian Legal Llama model...
[AI INFO] Falling back to cloud-based AI services.
```

This means the app is still meant to work, as long as one of the configured cloud keys is valid.

---

## 13. Important file structure

Inside `jarvis-backend`, the important files are:

```text
jarvis-backend/
├── .venv/
├── .gitignore
├── .python-version
├── pyproject.toml
├── uv.lock
├── README.md
├── src/
│   └|── learnuv/
│       ├── __init__.py
│       ├── Ai.py
│       ├── ProcessCommands.py
│       ├── api_server.py
│       └── chat_history.json
└── .env
```

The project root is `jarvis-backend`, and the `.env` file belongs there.

---

## 14. Troubleshooting

### UV command not found

Install UV then restart the terminal.

```bash
uv --version
```

### Python version mismatch

This project requires Python 3.13 or newer. Check:

```bash
python --version
```

If the version is lower, install Python 3.13 or use a version manager such as `pyenv`.

### `ModuleNotFoundError` or package issues

Run:

```bash
uv sync
```

If the environment is stale, recreate it:

```bash
rm -rf .venv
uv sync
```

### Local model warnings

Warnings about `llama-cpp-python` or local model loading are not always fatal. The app intentionally falls back to cloud services if needed.

### App starts but cannot talk to the frontend

Check that the frontend is sending requests to:

```text
http://127.0.0.1:8000
```

and that the backend is still running.

---

## 15. Recommended development workflow

For daily use, this is the normal flow:

```bash
cd jarvis-backend
uv sync
source .venv/bin/activate   # Linux/macOS
# or .venv\Scripts\Activate.ps1   # PowerShell
uv run uvicorn api_server:app --reload
```

Then open:

```text
http://127.0.0.1:8000/docs
```

Use the frontend as the client, or call the API directly with curl or Postman.

---

## 16. Download UV

Use these links to get UV:

- Official docs: https://docs.astral.sh/uv/
- Install guide: https://docs.astral.sh/uv/getting-started/installation/
- GitHub releases: https://github.com/astral-sh/uv/releases

---

## 17. Final quick start command

If you just want the shortest working sequence:

```bash
cd jarvis-backend
uv sync
source .venv/bin/activate
uv run uvicorn api_server:app --reload
```

Then open:

```text
http://127.0.0.1:5000/docs
```

This is the recommended start path for Linux and macOS. On Windows, use the equivalent activation command and keep the same `uv run uvicorn api_server:app --reload` command.

---

## 18. Summary

This backend is a FastAPI app that uses UV, loads environment variables from `.env`, and runs locally on port 5000.

The most important commands are:

```bash
uv sync
uv run uvicorn api_server:app --reload
```

Once running, the app listens on `http://127.0.0.1:8000` and the frontend can interact with it through the API routes defined in `api_server.py`.

If you want to run this backend properly across Linux, macOS, and Windows, the only changing part is how you activate the environment. The actual server start command remains the same.

