import { useCallback, useEffect, useState } from 'react'
import { User, LogOut } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import ChatView from './components/ChatView.jsx'
import InputBar from './components/InputBar.jsx'
import { useNayak } from './hooks/useNayak.jsx'
import VoiceInput from './components/voiceinput.jsx'
import Profile from './components/Profile.jsx'
import Login from './components/Login.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('auth_token'))
  })
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

  const { status, micOn, micSupported, interimText, error, toggleMic, sendTextCommand } =
    useNayak({ onExchange: appendExchange })

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    async function loadHistory() {
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch(`${API_BASE}/api/history`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
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
  }, [isAuthenticated])

  useEffect(() => {
    if (error) setBackendOnline(false)
  }, [error])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    setIsAuthenticated(false)
    setMessages([])
  }

  const handleNewChat = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`${API_BASE}/api/new-chat`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } catch {}
    setMessages([])
    setFocusIndex(null)
  }, [])

  const handleSelectEntry = useCallback((index) => setFocusIndex(index), [])
  const stateLabel = { sleeping: 'idle', listening: 'listening', processing: 'processing' }[status]

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />
  }

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

      {showProfile && <Profile onClose={() => setShowProfile(false)} />}

      <main className="flex min-w-0 flex-1 flex-col">
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
            <button
              onClick={handleLogout}
              title="Log out"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-[#17163A] text-mist transition hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300"
            >
              <LogOut size={16} />
            </button>
            <span className="rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-mist">
              state:{stateLabel}
            </span>
          </div>
        </header>

        {!backendOnline && (
          <div className="border-b border-magenta/30 bg-magenta/10 px-6 py-2 text-center font-mono text-xs text-magenta">
            Can’t reach the backend. Start the Nayak FastAPI server with `uv run uvicorn app.api_server:app --reload`.
          </div>
        )}

        <div className="flex shrink-0 items-center justify-center pb-2 pt-6">
          <VoiceInput status={status} sendTextCommand={sendTextCommand} addUserMessage={addUserMessage} />
        </div>

        <ChatView messages={messages} focusIndex={focusIndex} interimText={interimText} />

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