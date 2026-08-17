import { useCallback, useEffect, useState } from 'react'
import { User } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import SiriOrb from './components/SiriOrb.jsx'
import ChatView from './components/ChatView.jsx'
import InputBar from './components/InputBar.jsx'
import { useNayak } from './hooks/useNayak.jsx'
import VoiceInput from './components/voiceinput.jsx'
import Profile from './components/Profile.jsx'

// Empty default uses Vite's /api proxy in dev (see vite.config.js).
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  // `messages` mirrors chat_history.json's shape: [{ role, content }].
  // We keep a local `time` alongside each entry purely for display.
  const [messages, setMessages] = useState([])
  const [backendOnline, setBackendOnline] = useState(true)
  const [loading, setLoading] = useState(true)
  const [focusIndex, setFocusIndex] = useState(null)
  const [showProfile, setShowProfile] = useState(false)

  const appendExchange = useCallback(({ userText, assistantText }) => {
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userText, time: nowLabel() },
      { role: 'assistant', content: assistantText, time: nowLabel() },
    ])
  }, [])

  const addUserMessage = useCallback((userText) => {
    setMessages((prev) => [...prev, { role: 'user', content: userText, time: nowLabel() }])
  }, [])

  const { status, micOn, micSupported, micLevel, interimText, error, toggleMic, sendTextCommand } =
    useNayak({ onExchange: appendExchange })

  // ---- load chat_history.json from the backend on mount ------------------
  useEffect(() => {
    let cancelled = false
    async function loadHistory() {
      try {
        const res = await fetch(`${API_BASE}/api/history`)
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.history ?? []
        if (!cancelled) {
          setMessages(list)
          setBackendOnline(true)
        }
      } catch (err) {
        console.warn('[App] could not load chat history:', err.message)
        if (!cancelled) setBackendOnline(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadHistory()
    return () => {
      cancelled = true
    }
  }, [])

  // Reflect live backend errors surfaced by useNayak in the connection pill.
  useEffect(() => {
    if (error) setBackendOnline(false)
  }, [error])

  const handleNewChat = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/new-chat`, { method: 'POST' })
    } catch {
      /* optional endpoint — safe to ignore if it isn't implemented */
    }
    setMessages([])
    setFocusIndex(null)
  }, [])

  const handleSelectEntry = useCallback((index) => setFocusIndex(index), [])

  const stateLabel = { sleeping: 'idle', listening: 'listening', processing: 'processing' }[status]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-void font-body text-ink">
      <Sidebar
        history={messages}
        status={status}
        onNewChat={handleNewChat}
        activeIndex={focusIndex}
        onSelectEntry={handleSelectEntry}
        backendOnline={backendOnline}
      />

      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}


      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-line px-6 py-3">
          <div>
            <p className="font-display text-sm font-medium text-ink">Legal Assistant Session</p>
            <p className="font-mono text-[11px] text-mist">
              {loading ? 'syncing chat_history.json…' : `${messages.length} messages`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfile(true)}
              title="My Profile"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-500/30 bg-[#17163A] text-violet-300 transition hover:border-violet-400 hover:bg-violet-600 hover:text-white"
            >
              <User size={18} />
            </button>

            <span className="rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-mist">
              state:{stateLabel}
            </span>
          </div>
        </header>

        {!backendOnline && (
          <div className="border-b border-magenta/30 bg-magenta/10 px-6 py-2 text-center font-mono text-xs text-magenta">
            Can’t reach the backend. Start the Nayak FastAPI server with `uv run uvicorn learnuv.api_server:app --reload`.
          </div>
        )}

        {/* Orb hero */}
        <div className="flex shrink-0 items-center justify-center pb-2 pt-6">
          <VoiceInput status={status} sendTextCommand={sendTextCommand} addUserMessage={addUserMessage} />
        </div>

        {/* Transcript */}
        <ChatView messages={messages} focusIndex={focusIndex} interimText={interimText} />

        {/* Input */}
        <InputBar
          onSend={sendTextCommand}
          micActive={micOn}
          onToggleMic={toggleMic}
          micSupported={micSupported}
          disabled={status === 'processing'}
        />
      </main>
    </div>
  )
}
