# Nayak Frontend

A dark, voice-first legal assistant control surface for the **Nayak AI Legal Assistant** backend:
voice input, a reactive orb indicator, and a chat transcript, built with React + Vite + Tailwind CSS.

## Quick start

```bash
npm install
npm run dev
```

Then start the FastAPI backend (see `nayak-backend/README.md`) so the frontend can communicate with `/api/command` and load session history from `/api/history`.

## Structure

```
src/
├── components/
│   ├── Sidebar.jsx      # chat history, new chat, backend connection status
│   ├── SiriOrb.jsx      # canvas orb + visual status reticle
│   ├── ChatView.jsx     # scrollable transcript view
│   ├── InputBar.jsx     # text query fallback + mic toggle
│   └── voiceinput.jsx   # voice input controller
├── hooks/
│   └── useNayak.jsx     # speech recognition, STT, backend API dispatch
├── App.jsx
├── main.jsx
└── index.css
```

Voice input requires Chrome or Edge (Web Speech API support). Text input works in any modern web browser.
