Voice input changes
===================

Summary of changes made to enable one-shot and continuous voice flows:

- `src/components/InputBar.jsx`
  - Replaced wake-word mic toggle with a one-shot recognizer.
  - Clicking the mic listens once and inserts the recognized transcript into the input box (does not auto-send).

- `src/components/voiceinput.jsx`
  - Reworked the orb to toggle continuous listening when clicked; it remains active until clicked again.
  - Finalized speech chunks are appended immediately to the chat via `addUserMessage` and then sent to the backend with `sendTextCommand`.
  - Pauses/resumes listening automatically during `processing` state to avoid picking up ambient audio while the backend is responding.

- `src/components/SiriOrb.jsx`
  - Orb is visually shrunk when `state === 'sleeping'` to give the chat area more room.

- `src/App.jsx`
  - Added `addUserMessage` callback and passed `status` and `addUserMessage` into `VoiceInput`.

Notes and next steps
--------------------
- The continuous listener in `voiceinput.jsx` restarts automatically unless explicitly stopped.
- `useJarvis` retains its previous continuous wake-word behaviour and is still used by the InputBar's `onSend` path; consider removing the wake-word logic there if you want a single voice pipeline.
- Consider making the orb's sleeping size configurable via props or CSS variables for finer layout control.

Testing
-------
1. Run the backend API server (Flask):

```bash
python api_server.py
```

2. Start the frontend (Vite):

```bash
npm install
npm run dev
```

3. Interactions:
- Click the input mic: it listens once and fills the input box.
- Click the orb: it starts continuous listening and appends recognized final messages to the chat immediately; click again to stop.
- While the assistant is responding (`processing`), the orb pauses listening and will resume afterward.

If you'd like, I can now remove the wake-word logic inside `useJarvis` so there is only one active voice pipeline.