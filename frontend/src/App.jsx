import { useCallback, useEffect, useState } from 'react'
import {
  Menu,
  User,
  LogOut,
  Download,
  Sun,
  Moon,
  Pause,
  Play,
  Square,
  FileText,
} from 'lucide-react'

import Sidebar from './components/Sidebar.jsx'
import ChatView from './components/ChatView.jsx'
import InputBar from './components/InputBar.jsx'
import { useNayak } from './hooks/useNayak.jsx'
import VoiceInput from './components/voiceinput.jsx'
import Profile from './components/Profile.jsx'
import Grievance from './components/Grievance.jsx'
import Login from './components/Login.jsx'
import { api } from './lib/api.js'

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Auth state machine values:
// idle | checking-token | signing-in | registering |
// guest-login | authenticated | auth-error
const initialAuthStatus = (() => {
  const token = localStorage.getItem('auth_token')
  return token ? 'checking-token' : 'idle'
})()

// Session state machine values:
// initializing | creating-session | loading-history |
// ready | empty-session | error
const initialSessionStatus = 'initializing'

export default function App() {
  const [authStatus, setAuthStatus] =
    useState(initialAuthStatus)

  const [authError, setAuthError] = useState(null)

  const [sessionStatus, setSessionStatus] = useState(
    initialSessionStatus,
  )

  const isAuthenticated =
    authStatus === 'authenticated'

  const [messages, setMessages] = useState([])

  const [backendOnline, setBackendOnline] =
    useState(true)

  const [loading, setLoading] = useState(true)

  const [systemMessage, setSystemMessage] = useState(
    'Preparing your assistant…',
  )

  const [focusIndex, setFocusIndex] = useState(null)

  const [showProfile, setShowProfile] =
    useState(false)

  const [showGrievance, setShowGrievance] =
    useState(false)

  const currentUser = JSON.parse(localStorage.getItem('nayak_user') || 'null')
  const canRaiseGrievance = currentUser?.user_type !== 'guest' && !currentUser?.isGuest

  const [menuOpen, setMenuOpen] = useState(false)

  /* =========================
     THEME
  ========================= */

  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem('nayak_theme') === 'dark'
    )
  })

  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem('nayak_session_id'),
  )

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      darkMode,
    )

    localStorage.setItem(
      'nayak_theme',
      darkMode ? 'dark' : 'light',
    )
  }, [darkMode])

  const handleAuthStatusChange = useCallback(
    (status, errorMessage = null) => {
      setAuthStatus(status)

      setAuthError(
        status === 'auth-error'
          ? errorMessage
          : null,
      )
    },
    [],
  )

  const appendExchange = useCallback(
    ({ userText, assistantText }) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: userText,
          time: nowLabel(),
        },
        {
          role: 'assistant',
          content: assistantText,
          time: nowLabel(),
        },
      ])
    },
    [],
  )

  const createSession = useCallback(async () => {
    setSessionStatus('creating-session')
    setSystemMessage(
      'Creating a new chat session…',
    )

    const data = await api.createSession()

    setSessionId(data.session_id)

    localStorage.setItem(
      'nayak_session_id',
      data.session_id,
    )

    setSessionStatus('loading-history')
    setSystemMessage(
      'Session ready. Loading your chat…',
    )

    return data.session_id
  }, [])

  const handleLoginSuccess = useCallback(
    async () => {
      setAuthStatus('authenticated')
      setAuthError(null)
      setSessionStatus('creating-session')

      setSystemMessage(
        'Signed in. Creating your chat session…',
      )

      await createSession()
    },
    [createSession],
  )

  const addUserMessage = useCallback(
    (userText) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: userText,
          time: nowLabel(),
        },
      ])
    },
    [],
  )

  const {
    status,
    micOn,
    micSupported,
    micLevel,
    interimText,
    error,
    toggleMic,
    sendTextCommand,

    // Speech controls
    speechSpeaking,
    speechPaused,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
  } = useNayak({
    onExchange: appendExchange,
    sessionId,
  })

  // Track AI command errors separately
  const [commandError, setCommandError] =
    useState(null)

  // Verify saved token on first load
  useEffect(() => {
    const token =
      localStorage.getItem('auth_token')

    if (!token) {
      setAuthStatus('idle')
      setSessionStatus('initializing')
      return
    }

    let cancelled = false

    setSystemMessage(
      'Checking saved session…',
    )

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

        localStorage.removeItem('auth_token')
        localStorage.removeItem(
          'nayak_session_id',
        )

        setSessionId(null)
        setAuthStatus('auth-error')

        setAuthError(
          err?.message ||
            'Your session has expired. Please sign in again.',
        )

        setSessionStatus('initializing')
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Load/create chat session
  useEffect(() => {
    if (!isAuthenticated) return

    if (!sessionId) {
      setSessionStatus('creating-session')

      createSession().catch((err) => {
        console.warn(
          '[App] could not create chat session:',
          err.message,
        )

        setSystemMessage(
          'Session creation failed. Check the backend connection.',
        )

        setSessionStatus('error')
        setBackendOnline(false)
        setLoading(false)
      })

      return
    }

    let cancelled = false

    async function loadHistory() {
      setSessionStatus('loading-history')

      setSystemMessage(
        'Loading your saved chat history…',
      )

      try {
        const data =
          await api.history(sessionId)

        const list = Array.isArray(data)
          ? data
          : data.history ?? []

        if (!cancelled) {
          setMessages(list)
          setBackendOnline(true)

          setSessionStatus(
            list.length
              ? 'ready'
              : 'empty-session',
          )

          setSystemMessage(
            list.length
              ? 'Chat history loaded.'
              : 'No previous messages in this session.',
          )
        }
      } catch (err) {
        console.warn(
          '[App] could not load chat history:',
          err.message,
        )

        if (!cancelled) {
          setBackendOnline(false)
          setSessionStatus('error')

          setSystemMessage(
            'Backend unavailable — check the API server.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [
    createSession,
    isAuthenticated,
    sessionId,
  ])

  useEffect(() => {
    if (error) {
      setCommandError(error)
    }
  }, [error])

  const handleLogout = useCallback(() => {
    stopSpeech()

    localStorage.removeItem('auth_token')
    localStorage.removeItem(
      'nayak_session_id',
    )
    localStorage.removeItem('nayak_user')

    setSessionId(null)
    setMessages([])
    setAuthStatus('idle')
    setSessionStatus('initializing')
    setAuthError(null)

    setSystemMessage(
      'Preparing your assistant…',
    )

    setMenuOpen(false)
  }, [stopSpeech])

  const downloadMarkdown = useCallback(() => {
    const markdown = messages
      .map((message) => {
        const speaker =
          message.role === 'user'
            ? 'You'
            : 'Nayak'

        return `## ${speaker}\n\n${message.content}\n`
      })
      .join('\n')

    const blob = new Blob(
      [
        `# Nayak Legal Assistant Chat\n\n${markdown}`,
      ],
      {
        type: 'text/markdown',
      },
    )

    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement('a')

    link.href = url

    link.download = `nayak-chat-${new Date()
      .toISOString()
      .slice(0, 10)}.md`

    link.click()

    URL.revokeObjectURL(url)
  }, [messages])

  const handleNewChat = useCallback(
    async () => {
      stopSpeech()

      try {
        const data =
          await api.newChat()

        setSessionId(data.session_id)

        localStorage.setItem(
          'nayak_session_id',
          data.session_id,
        )
      } catch {
        // Keep existing behavior.
      }

      setMessages([])
      setFocusIndex(null)
    },
    [stopSpeech],
  )

  const handleSelectEntry = useCallback(
    (index) => setFocusIndex(index),
    [],
  )

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
        onAuthStatusChange={
          handleAuthStatusChange
        }
      />
    )
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-void font-body text-ink">
      <Sidebar
        history={messages}
        status={status}
        onNewChat={handleNewChat}
        activeIndex={focusIndex}
        onSelectEntry={handleSelectEntry}
        backendOnline={backendOnline}
      />

      {showProfile && (
        <Profile
          onClose={() =>
            setShowProfile(false)
          }
        />
      )}

      {showGrievance && (
        <Grievance onClose={() => setShowGrievance(false)} />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-6 py-3">
          <div className="flex items-center gap-2 px-5 pb-4 pt-6">
            <div className="h-2 w-2 rounded-full bg-iris shadow-[0_0_10px_2px_rgba(20,83,45,0.35)]" />

            <div>
              <span className="block font-display text-lg font-semibold leading-none tracking-wide text-ink">
                NAYAK
              </span>

              <span className="font-mono text-[10px] uppercase tracking-wider text-mist">
                Legal Assistant
              </span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() =>
                setMenuOpen(
                  (open) => !open,
                )
              }
              aria-expanded={menuOpen}
              aria-label="Open account menu"
              title="Open menu"
              className="account-menu-button flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel-hi text-mist transition hover:border-cyan/40 hover:bg-cyan/10 hover:text-cyan"
            >
              <Menu size={18} />
            </button>

            {menuOpen && (
              <div className="menu-dropdown absolute right-0 top-12 z-20 w-52 rounded-lg border border-line bg-panel p-2 shadow-xl">
                {/* Profile */}

                <button
                  onClick={() => {
                    setShowProfile(true)
                    setMenuOpen(false)
                  }}
                  className="menu-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
                >
                  <User size={18} />
                  <span>Profile</span>
                </button>

                {canRaiseGrievance && (
                  <button
                    onClick={() => {
                      setShowGrievance(true)
                      setMenuOpen(false)
                    }}
                    className="menu-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
                  >
                    <FileText size={18} />
                    <span>Raise grievance</span>
                  </button>
                )}

                {/* Download chat */}

                <button
                  onClick={() => {
                    downloadMarkdown()
                    setMenuOpen(false)
                  }}
                  disabled={
                    messages.length === 0
                  }
                  className="menu-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download size={18} />
                  <span>Download chat</span>
                </button>

                {/* Theme toggle */}

                <button
                  onClick={() => {
                    setDarkMode((prev) => !prev)
                    setMenuOpen(false)
                  }}
                  className="menu-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
                >
                  {darkMode ? (
                    <Sun
                      size={18}
                      className="text-yellow-500"
                    />
                  ) : (
                    <Moon
                      size={18}
                      className="text-indigo-500"
                    />
                  )}

                  <span>
                    {darkMode
                      ? 'Light Mode'
                      : 'Dark Mode'}
                  </span>
                </button>

                {/* Logout */}

                <button
                  onClick={handleLogout}
                  className="menu-item flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-red-500/10 hover:text-red-500"
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {!backendOnline && (
          <div className="border-b border-magenta/30 bg-magenta/10 px-6 py-2 text-center font-mono text-xs text-magenta">
            Backend unavailable — start the API server before
            continuing:{' '}
            uv run uvicorn app.api_server:app --reload
          </div>
        )}

        {commandError && (
          <div className="border-b border-red-500/30 bg-red-500/10 px-6 py-2 text-center font-mono text-xs text-red-400">
            Could not reach the backend. Check the API server. (
            {commandError})
          </div>
        )}

        {/* Voice output controls */}

        {speechSpeaking && (
          <div className="flex shrink-0 items-center justify-center gap-2 pb-2 pt-3">
            <button
              onClick={
                speechPaused
                  ? resumeSpeech
                  : pauseSpeech
              }
              title={
                speechPaused
                  ? 'Resume voice'
                  : 'Pause voice'
              }
              aria-label={
                speechPaused
                  ? 'Resume voice'
                  : 'Pause voice'
              }
              className="flex h-9 items-center gap-2 rounded-full border border-line bg-panel px-4 text-xs font-medium text-ink transition hover:border-cyan/40 hover:bg-cyan/10"
            >
              {speechPaused ? (
                <Play size={15} />
              ) : (
                <Pause size={15} />
              )}

              <span>
                {speechPaused
                  ? 'Resume'
                  : 'Pause'}
              </span>
            </button>

            <button
              onClick={stopSpeech}
              title="Stop voice"
              aria-label="Stop voice"
              className="flex h-9 items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-medium text-red-500 transition hover:bg-red-500/20"
            >
              <Square size={14} />
              <span>Stop</span>
            </button>
          </div>
        )}

        <div className="flex shrink-0 items-center justify-center pb-2 pt-6">
          {micOn && (
            <VoiceInput
              status={status}
              micLevel={micLevel}
              onStop={toggleMic}
            />
          )}
        </div>

        <ChatView
          messages={messages}
          focusIndex={focusIndex}
          interimText={interimText}
        />

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