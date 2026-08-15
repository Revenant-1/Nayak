# Jarvis Frontend

A dark, voice-first control surface for a Python assistant backend:
wake-word listening, a reactive Siri-style orb, and a ChatGPT-style
transcript, all in React + Vite + Tailwind.

## Quick start

```bash
npm install
npm run dev
```

Then start your Flask backend (see **[INTEGRATION.md](./INTEGRATION.md)**
for the exact API contract and a copy-pasteable `api_server.py`) so the
sidebar can load `chat_history.json` and `/api/command` has something to
answer to.

## Structure

```
src/
├── components/
│   ├── Sidebar.jsx     # chat history, new chat, status pill
│   ├── SiriOrb.jsx      # canvas orb + HUD reticle, state-reactive
│   ├── ChatView.jsx     # scrollable transcript
│   └── InputBar.jsx     # text fallback + mic toggle
├── hooks/
│   └── useJarvis.jsx    # wake-word detection, STT, backend dispatch
├── App.jsx
├── main.jsx
└── index.css
```

Voice requires Chrome or Edge (Web Speech API support). Everything else
works in any modern browser via the text input.
