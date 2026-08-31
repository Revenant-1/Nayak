import { useCallback, useEffect, useState } from 'react'
import { User, LogOut, Download, Loader2, AlertCircle } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import ChatView from './components/ChatView.jsx'
import InputBar from './components/InputBar.jsx'
import { useNayak } from './hooks/useNayak.jsx'
import VoiceInput from './components/voiceinput.jsx'
import Profile from './components/Profile.jsx'
import Login from './components/Login.jsx'
import { api } from './lib/api.js'

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Auth state machine values: idle | checking-token | signing-in | registering |
// guest-login | authenticated | auth-error
const initialAuthStatus = (() => {
  const token = localStorage.getItem('auth_token')
  return token ? 'checking-token' : 'idle'
})()

// Session state machine values: initializing | creating-session | loading-history |
// ready | empty-session | error
const initialSessionStatus = 'initializing'

export default function App() {
  const [authStatus, setAuthStatus] = useState(initialAuthStatus)
  const [authError, setAuthError] = useState(null)
  const [sessionStatus, setSessionStatus] = useState(initialSessionStatus)
  const isAuthenticated = authStatus === 'authenticated'
  const [messages, setMessages] = useState([])
  const [backendOnline, setBackendOnline] = useState(true)
  const [loading, setLoading] = useState(true)
  const [systemMessage, setSystemMessage] = useState('Preparing your assistant…')
  const [focusIndex, setFocusIndex] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem('nayak_session_id'),
  )

  const handleAuthStatusChange = useCallback((status, errorMessage = null) => {
    setAuthStatus(status)
    setAuthError(status === 'auth-error' ? errorMessage : null)
  }, [])

  const appendExchange = useCallback(({ userText, assistantText }) => {
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userText, time: nowLabel() },
      { role: 'assistant', content: assistantText, time: nowLabel() },
    ])
  }, [])

  const createSession = useCallback(async () => {
    setSessionStatus('creating-session')
    setSystemMessage('Creating a new chat session…')
    const data = await api.createSession()
    setSessionId(data.session_id)
    localStorage.setItem('nayak_session_id', data.session_id)
    setSessionStatus('loading-history')
    setSystemMessage('Session ready. Loading your chat…')
    return data.session_id
  }, [])

  const handleLoginSuccess = useCallback(async () => {
    setAuthStatus('authenticated')
    setAuthError(null)
    setSessionStatus('creating-session')
    setSystemMessage('Signed in. Creating your chat session…')
    await createSession()
  }, [createSession])

  const addUserMessage = useCallback((userText) => {
    setMessages((prev) => [...prev, { role: 'user', content: userText, time: nowLabel() }])
  }, [])

  const { status, micOn, micSupported, interimText, error, toggleMic, sendTextCommand } =
    useNayak({ onExchange: appendExchange, sessionId })

  // Track AI command errors separately
  const [commandError, setCommandError] = useState(null)

  // Verify saved token on first load. If valid, become authenticated. If not,
  // clear it and stay on the login screen with a visible message.
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setAuthStatus('idle')
      setSessionStatus('initializing')
      return
    }
    let cancelled = false
    setSystemMessage('Checking saved session…')
    api
      .verifyToken(token)
      .then(() => {
        if (!cancelled) {
          setAuthStatus('authenticated')
          setAuthError(null)
          setSessionStatus('initializing')
        }
      })
      .catch((err) => {
        if (cancelled) return
        // Token is invalid or expired — wipe it and surface the error
        localStorage.removeItem('auth_token')
        localStorage.removeItem('nayak_session_id')
        setSessionId(null)
        setAuthStatus('auth-error')
        setAuthError(err?.message || 'Your session has expired. Please sign in again.')
        setSessionStatus('initializing')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    if (!sessionId) {
      setSessionStatus('creating-session')
      createSession().catch((err) => {
        console.warn('[App] could not create chat session:', err.message)
        setSystemMessage('Session creation failed. Check the backend connection.')
        setSessionStatus('error')
        setBackendOnline(false)
        setLoading(false)
      })
      return
    }

    let cancelled = false
    async function loadHistory() {
      setSessionStatus('loading-history')
      setSystemMessage('Loading your saved chat history…')
      try {
        const data = await api.history(sessionId)
        const list = Array.isArray(data) ? data : data.history ?? []
        if (!cancelled) {
          setMessages(list)
          setBackendOnline(true)
          setSessionStatus(list.length ? 'ready' : 'empty-session')
          setSystemMessage(list.length ? 'Chat history loaded.' : 'No previous messages in this session.')
        }
      } catch (err) {
        console.warn('[App] could not load chat history:', err.message)
        if (!cancelled) {
          setBackendOnline(false)
          setSessionStatus('error')
          setSystemMessage('Backend unavailable — check the API server.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadHistory()
    return () => {
      cancelled = true
    }
  }, [createSession, isAuthenticated, sessionId])

  useEffect(() => {
    if (error) setCommandError(error)
  }, [error])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('nayak_session_id')
    localStorage.removeItem('nayak_user')
    setSessionId(null)
    setMessages([])
    setAuthStatus('idle')
    setSessionStatus('initializing')
    setAuthError(null)
    setSystemMessage('Preparing your assistant…')
  }, [])

  const downloadMarkdown = useCallback(() => {
    const markdown = messages
      .map((message) => {
        const speaker = message.role === 'user' ? 'You' : 'Nayak'
        return `## ${speaker}\n\n${message.content}\n`
      })
      .join('\n')

    const blob = new Blob([`# Nayak Legal Assistant Chat\n\n${markdown}`], {
      type: 'text/markdown',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nayak-chat-${new Date().toISOString().slice(0, 10)}.md`
    link.click()
    URL.revokeObjectURL(url)
  }, [messages])

  const handleNewChat = useCallback(async () => {
    try {
      const data = await api.newChat()
      setSessionId(data.session_id)
      localStorage.setItem('nayak_session_id', data.session_id)
    } catch {}
    setMessages([])
    setFocusIndex(null)
  }, [])

  const handleSelectEntry = useCallback((index) => setFocusIndex(index), [])
  const stateLabel = {
    sleeping: 'idle',
    listening: 'listening',
    processing: 'processing',
    thinking: 'thinking',
    responding: 'responding',
    error: 'error',
  }[status]

  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onAuthStatusChange={handleAuthStatusChange}
      />
    )
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
              {loading ? systemMessage : `${messages.length} messages · ${systemMessage}`}
            </p>
            <p className="font-mono text-[10px] text-mist/70">
              session:{sessionStatus} · ai:{stateLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadMarkdown}
              disabled={messages.length === 0}
              title="Download chat as Markdown"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-[#17163A] text-mist transition hover:border-cyan/40 hover:bg-cyan/10 hover:text-cyan disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={16} />
            </button>
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
          </div>
        </header>

        {!backendOnline && (
          <div className="border-b border-magenta/30 bg-magenta/10 px-6 py-2 text-center font-mono text-xs text-magenta">
            Backend unavailable — start the API server before continuing: uv run uvicorn app.api_server:app --reload
          </div>
        )}

        {commandError && (
          <div className="border-b border-red-500/30 bg-red-500/10 px-6 py-2 text-center font-mono text-xs text-red-400">
            Could not reach the backend. Check the API server. ({commandError})
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