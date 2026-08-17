<<<<<<< HEAD
# Nayak your legal Sahayak🎙️
=======
# nayak Voice Assistant 🎙️
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1

Unified React-Vite + FastAPI voice-first interface with Python AI back-end.

**GitHub:** [https://github.com/Revenant-1/Nayak](https://www.google.com/search?q=https://github.com/Revenant-1/Nayak)

---
### Quick-Start One-Liners

**Clone & navigate to backend directory:**
```bash
git clone https://github.com/Revenant-1/Nayak.git
<<<<<<< HEAD
cd Nayak/Nayak-backend
=======
cd Nayak/nayak-backend
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1

```

```bash
# Run Backend
<<<<<<< HEAD
cd Nayak/Nayak-backend && uv sync && uv run uvicorn learnuv.api_server:app --reload

# Run Frontend
cd Nayak/Nayak-frontend && npm install && npm run dev
=======
cd Nayak/nayak-backend && uv sync && uv run uvicorn learnuv.api_server:app --reload

# Run Frontend
cd Nayak/nayak-frontend && npm install && npm run dev
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1

```

### Table of Contents

* [Overview](https://www.google.com/search?q=%23overview)
* [Tech Stack](https://www.google.com/search?q=%23tech-stack)
* [Prerequisites](https://www.google.com/search?q=%23prerequisites)
* [Repository Layout](https://www.google.com/search?q=%23repository-layout)
* [Backend Setup](https://www.google.com/search?q=%23backend-setup)
* [Frontend Setup](https://www.google.com/search?q=%23frontend-setup)
* [Running the Stack](https://www.google.com/search?q=%23running-the-stack)
* [API Contract](https://www.google.com/search?q=%23api-contract)
* [Voice Pipeline](https://www.google.com/search?q=%23voice-pipeline)
* [Environment Variables](https://www.google.com/search?q=%23environment-variables)
* [Development Workflow](https://www.google.com/search?q=%23development-workflow)
* [Troubleshooting](https://www.google.com/search?q=%23troubleshooting)
* [Contributing](https://www.google.com/search?q=%23contributing)
* [License](https://www.google.com/search?q=%23license)
* [Quick-Start One-Liners](https://www.google.com/search?q=%23quick-start-one-liners)

---

### Overview

This repository contains a full voice assistant stack split into two workspaces:

| Part | Language / Framework | Primary Function |
| --- | --- | --- |
<<<<<<< HEAD
| **Backend** (`Nayak-backend/`) | Python 3.13+, FastAPI, UV, Llama-CPP | Serves REST API endpoints, runs AI models, and persists conversation history (`chat_history.json`). |
| **Frontend** (`Nayak-frontend/`) | React 18+, Vite, TailwindCSS, Web APIs | UI for wake-word detection, speech-to-text, visual orb, and transcript display. All voice processing happens in-browser. |
=======
| **Backend** (`nayak-backend/`) | Python 3.13+, FastAPI, UV, Llama-CPP | Serves REST API endpoints, runs AI models, and persists conversation history (`chat_history.json`). |
| **Frontend** (`nayak-frontend/`) | React 18+, Vite, TailwindCSS, Web APIs | UI for wake-word detection, speech-to-text, visual orb, and transcript display. All voice processing happens in-browser. |
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1

The two services communicate through a Vite development proxy (or configurable HTTP base URL in production) to eliminate CORS issues.

---

### Tech Stack

* **Backend:** Python 3.13+, FastAPI, `uv`, `fastapi[standard]`, `google-genai`, `groq`, `llama-cpp-python`
* **Frontend:** React 18+, Vite, TypeScript, TailwindCSS, Web Speech API, Web Audio API, SpeechSynthesis
* **AI Models:**
1. Local Indian-Legal Llama *(primary)*
2. Local General-Purpose Llama *(fallback)*
3. Google Gemini *(cloud)*
4. Groq *(cloud fallback)*


* **Containerisation / Dev:** `uv`, `npm`, `uvicorn`

---

### Prerequisites

| Tool | Minimum Version | Note |
| --- | --- | --- |
| **Python** | 3.13+ | Required for backend dependencies |
| **Node.js** | 18+ | Required for frontend build tools |
| **UV** | 0.2.x | Fast Python package installer |
| **Git** | 2.30+ | Version control |
| **Browser** | Chrome / Edge (≥ 115) | Required for Web Speech API support |

> **Tip:** On Windows, use PowerShell as the preferred terminal.

---

### Repository Layout

```text
Nayak/
<<<<<<< HEAD
├─ Nayak-backend/          # Python backend workspace
=======
├─ nayak-backend/          # Python backend workspace
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1
│   ├─ src/
│   │   └─ learnuv/
│   │       ├─ __init__.py
│   │       ├─ Ai.py
│   │       ├─ ProcessCommands.py
│   │       ├─ api_server.py
│   │       └─ chat_history.json
│   ├─ .env
│   ├─ .gitignore
│   ├─ .python-version
│   ├─ pyproject.toml
│   ├─ uv.lock
│   └─ README.md
<<<<<<< HEAD
└─ Nayak-frontend/         # React frontend workspace
=======
└─ nayak-frontend/         # React frontend workspace
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1
    ├─ src/
    │   ├─ components/
    │   │   ├─ Sidebar.jsx
    │   │   ├─ ChatView.jsx
    │   │   ├─ InputBar.jsx
    │   │   └─ SiriOrb.jsx
    │   ├─ hooks/
<<<<<<< HEAD
    │   │   └─ useNayak.jsx
=======
    │   │   └─ usenayak.jsx
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1
    │   ├─ App.jsx
    │   ├─ main.jsx
    │   └─ index.css
    ├─ index.html
    ├─ package.json
    ├─ vite.config.js
    └─ README.md

```

---

### Backend Setup

1. **Clone & navigate to backend directory:**
```bash
git clone https://github.com/Revenant-1/Nayak.git
<<<<<<< HEAD
cd Nayak/Nayak-backend
=======
cd Nayak/nayak-backend
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1

```


2. **Install UV** *(skip if already installed)*:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# or: brew install uv (macOS) / choco install uv (Windows)

```


3. **Create virtual environment & sync dependencies:**
```bash
uv sync

```


4. **(Optional) Activate the environment:**
```bash
source .venv/bin/activate        # Linux / macOS
# or: .venv\Scripts\Activate.ps1 # Windows PowerShell

```


5. **Configure environment variables:**
<<<<<<< HEAD
Create a `.env` file in `Nayak-backend/` (next to `pyproject.toml`):
=======
Create a `.env` file in `nayak-backend/` (next to `pyproject.toml`):
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1
```env
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here

```


6. **Run the API server:**
```bash
uv run uvicorn learnuv.api_server:app --reload

```


* Server runs at: `[http://127.0.0.1:8000](http://127.0.0.1:8000)`
* Swagger UI documentation: `[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)`



---

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
<<<<<<< HEAD
cd ../Nayak-frontend
=======
cd ../nayak-frontend
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1

```


2. **Install dependencies:**
```bash
npm install

```


3. **Start the development server:**
```bash
npm run dev

```


* Vite dev server runs at `http://localhost:5173`.
* Automatically proxies `/api/*` requests to backend at `[http://127.0.0.1:8000](http://127.0.0.1:8000)`.


4. **Production build (optional):**
```bash
npm run build

```


* Builds production assets to `./dist`.



---

### Running the Stack

Open separate terminal windows for the stack:

| Terminal | Command | Description |
| --- | --- | --- |
<<<<<<< HEAD
| **1️⃣ Backend** | `cd Nayak/Nayak-backend && uv run uvicorn learnuv.api_server:app --reload` | Starts FastAPI backend server |
| **2️⃣ Frontend** | `cd Nayak/Nayak-frontend && npm run dev` | Starts Vite frontend dev server |
=======
| **1️⃣ Backend** | `cd Nayak/nayak-backend && uv run uvicorn learnuv.api_server:app --reload` | Starts FastAPI backend server |
| **2️⃣ Frontend** | `cd Nayak/nayak-frontend && npm run dev` | Starts Vite frontend dev server |
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1
| **3️⃣ Environment** | *(Background)* | Keep `.env` keys updated and loaded |

**Runtime behavior:**

* Open `http://localhost:5173` in Chrome or Edge.
* Loads chat history from `/api/history`.
<<<<<<< HEAD
* Detects the wake-word **"Nayak"** via Web Speech API.
=======
* Detects the wake-word **"nayak"** via Web Speech API.
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1
* Buffers audio, translates speech to text, and posts to `/api/command`.
* Speaks response via SpeechSynthesis and visualizes audio on the orb.

---

### API Contract

| Method | Endpoint | Request Body | Response Body | Error Response |
| --- | --- | --- | --- | --- |
| `GET` | `/api/history` | *None* | `[{"role": "user" | "assistant", "content": "...", "timestamp": "HH:MM"}, ...]` | `4xx` / `5xx` JSON error |
| `POST` | `/api/command` | `{"text": "your command"}` | `{"response": "assistant reply"}` | `400` (empty text) / `4xx` / `5xx` |
| `POST` | `/api/new-chat` | *None* | `{"status": "cleared"}` | `4xx` / `5xx` JSON error |

> **Note:** The frontend expects these exact response signatures. Deviations will display an error banner in the UI.

---

### Voice Pipeline

<<<<<<< HEAD
1. **Wake-Word Detection:** `webkitSpeechRecognition` listens continuously for `"Nayak"`.
=======
1. **Wake-Word Detection:** `webkitSpeechRecognition` listens continuously for `"nayak"`.
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1
2. **Speech-to-Text (STT):** Captures spoken input following the wake-word until silence threshold (`SILENCE_TIMEOUT_MS = 1400ms`).
3. **Dispatch:** Formatted text payload is dispatched to `/api/command`.
4. **Backend Processing:**
* Handled by `processCommand(text)` in `src/learnuv/ProcessCommands.py`.
* Passes query to `ask_ai(prompt)`, which cascades through four tiers until one succeeds: **Indian Legal Llama (local, primary)** → **General Llama (local fallback)** → **Gemini (cloud)** → **Groq (cloud fallback)**.


5. **Assistant Reply:** Clean string returned to frontend JSON client.
6. **Text-to-Speech (TTS):** Native `SpeechSynthesis` voices response aloud.
7. **Visual Feedback:** `SiriOrb.jsx` reacts dynamically to mic input amplitude via Web Audio API.

> **Privacy Note:** All voice processing runs client-side in the browser; the backend only receives plain text.

---

### Environment Variables

| Variable | Scope | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Backend | Google Gemini API key (cloud inference). |
| `GROQ_API_KEY` | Backend | Groq Cloud API key (fast fallback inference). |
| `VITE_API_BASE_URL` | Frontend | *(Optional)* Override backend API target (`[http://127.0.0.1:8000](http://127.0.0.1:8000)`) in production. |

---

### Development Workflow

1. **Task Planning:** Create/assign an issue in the project tracker.
2. **Branching:** Create a feature branch matching `feat/<short-description>` or `fix/<issue-name>`.
3. **Lint & Test:** Run `npm run lint` (frontend) and `uv run pytest` (backend).
4. **Pull Request:** Open a PR against `main` for review.
5. **Deployment:**
* Build frontend (`npm run build`).
* Serve static build via FastAPI static mount or CDN.
* Run backend with production Uvicorn/Gunicorn workers.



---

### Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Red **"backend offline"** banner | Backend server not running or wrong port | Start backend (`uv run uvicorn learnuv.api_server:app --reload`) and verify it runs on `[http://127.0.0.1:8000](http://127.0.0.1:8000)`. |
<<<<<<< HEAD
| No transcription after "Nayak" | Browser incompatible or mic blocked | Use Chrome/Edge (≥ 115) and enable mic permissions in browser settings. |
=======
| No transcription after "nayak" | Browser incompatible or mic blocked | Use Chrome/Edge (≥ 115) and enable mic permissions in browser settings. |
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1
| CORS errors in dev | Proxy misconfigured | Check `vite.config.js` to ensure the proxy points to `[http://127.0.0.1:8000](http://127.0.0.1:8000)`. |
| Empty response from `/api/command` | Missing return field in backend | Ensure `ProcessCommands.py` returns a dictionary containing a valid `"response"` key. |
| AI model fails to load | Missing API keys or invalid Python version | Ensure Python 3.13+ is installed, run `uv sync`, and verify keys in `.env`. |
| Port conflict (`8000` or `5173`) | Port in use by another app | Change backend port via `uvicorn --port <port>` or frontend port in `vite.config.js`. |
<<<<<<< HEAD
| `.env` variables not read | File in wrong directory | Place `.env` inside `Nayak-backend/` alongside `pyproject.toml`. |
=======
| `.env` variables not read | File in wrong directory | Place `.env` inside `nayak-backend/` alongside `pyproject.toml`. |
>>>>>>> a0dd1453457d5756866f2defc7e930ac929213c1

---

### Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feat/your-feature`).
3. Install dependencies (`uv sync` and `npm install`).
4. Commit your changes following standard guidelines.
5. Verify locally and open a Pull Request.

**Style Guides:**

* **Backend:** PEP-8 guidelines with strict type hinting.
* **Frontend:** ESLint + Prettier rules defined in `package.json`.

---

### License

This project is licensed under the repository's main LICENSE file. Check individual sub-directories for third-party component licenses.

---
