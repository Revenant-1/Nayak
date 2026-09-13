import { useCallback, useEffect, useState } from 'react'

import Scheme from './components/Scheme.jsx'
import Sidebar from './components/Sidebar.jsx'
import ChatView from './components/ChatView.jsx'
import InputBar from './components/InputBar.jsx'
import { useNayak } from './hooks/useNayak.jsx'
import VoiceInput from './components/voiceinput.jsx'
import Profile from './components/Profile.jsx'
import Grievance from './components/Grievance.jsx'
import Login from './components/Login.jsx'
import { api } from './lib/api.js'
import bgIllustration from './assets/bg.png'

import {
  Download,
  LogOut,
  Menu,
  Moon,
  ShieldAlert,
  Sun,
} from 'lucide-react'

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
  if (!token) return 'idle'

  try {
    const savedUser = JSON.parse(
      localStorage.getItem('nayak_user') || 'null',
    )

    const isGuestUser =
      savedUser?.user_type === 'guest' || savedUser?.isGuest

    return isGuestUser ? 'idle' : 'checking-token'
  } catch {
    return 'checking-token'
  }
})()

// Session state machine values:
// initializing | creating-session | loading-history |
// ready | empty-session | error

const initialSessionStatus = 'initializing'

const LANGUAGES = [
  { code: 'auto', label: 'Auto', speechCode: null },
  { code: 'en', label: 'English', speechCode: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'mr', label: 'मराठी', speechCode: 'mr-IN' },
  { code: 'ta', label: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'te', label: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'bn', label: 'বাংলা', speechCode: 'bn-IN' },
]

export default function App() {
  const [illustration] = useState(bgIllustration)

  const [authStatus, setAuthStatus] =
    useState(initialAuthStatus)

  const [authError, setAuthError] = useState(null)

  const [showLogin, setShowLogin] = useState(true)

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

  const [showScheme, setShowScheme] =
    useState(false)

  const [showHeaderMenu, setShowHeaderMenu] =
    useState(false)

  const currentUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem('nayak_user') || 'null',
      )
    } catch {
      return null
    }
  })()

  const canRaiseGrievance =
    currentUser?.user_type !== 'guest' &&
    !currentUser?.isGuest

  /* =========================
     THEME
  ========================= */

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('nayak_theme') === 'dark'
  })

  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem('nayak_session_id'),
  )

  const [language, setLanguage] = useState(() =>
    localStorage.getItem('nayak_language') || 'en',
  )

  const selectedLanguage =
    LANGUAGES.find(
      (item) => item.code === language,
    ) || LANGUAGES[0]

  useEffect(() => {
    localStorage.setItem(
      'nayak_language',
      language,
    )
  }, [language])

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
      setShowLogin(false)

      setSessionStatus('creating-session')

      setSystemMessage(
        'Signed in. Creating your chat session…',
      )

      await createSession()
    },
    [createSession],
  )

  const handleCancelLogin = useCallback(() => {
    setShowLogin(false)
    setAuthStatus('idle')
    setAuthError(null)
    setSessionStatus('initializing')
    setSystemMessage(
      'Preparing your assistant…',
    )
  }, [])

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
    language: selectedLanguage.speechCode,
  })

  // Track AI command errors separately
  const [commandError, setCommandError] =
    useState(null)

  // Verify saved token on first load
  useEffect(() => {
    const token = localStorage.getItem('auth_token')

    if (!token) {
      setAuthStatus('idle')
      setSessionStatus('initializing')
      return
    }

    try {
      const savedUser = JSON.parse(
        localStorage.getItem('nayak_user') || 'null',
      )

      const isGuestUser =
        savedUser?.user_type === 'guest' ||
        savedUser?.isGuest

      if (isGuestUser) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('nayak_user')
        localStorage.removeItem('nayak_session_id')

        setSessionId(null)
        setAuthStatus('idle')
        setSessionStatus('initializing')

        return
      }
    } catch {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('nayak_user')
      localStorage.removeItem('nayak_session_id')

      setSessionId(null)
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
    setShowLogin(true)
    setSessionStatus('initializing')
    setAuthError(null)

    setSystemMessage(
      'Preparing your assistant…',
    )
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

  /*
   * =========================================================
   * HOME CARD ACTIONS
   * =========================================================
   */

  // Legal Q&A card
  const handleLegalQA = useCallback(() => {
    setShowScheme(false)

    requestAnimationFrame(() => {
      const input =
        document.querySelector('.chat-input')

      input?.focus()
    })
  }, [])

  // Government Schemes card
  const handleSchemes = useCallback(() => {
    setShowScheme(true)
    setFocusIndex(null)
  }, [])

  // Voice Assistant card
  const handleVoiceAssistant = useCallback(() => {
    if (micSupported) {
      toggleMic()
    }
  }, [micSupported, toggleMic])

  if (!isAuthenticated && showLogin) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onAuthStatusChange={
          handleAuthStatusChange
        }
        onCancel={handleCancelLogin}
      />
    )
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-void font-body text-ink">

      <Sidebar
        history={messages}
        onNewChat={() => {
          setShowScheme(false)
          handleNewChat()
        }}
        activeIndex={focusIndex}
        onSelectEntry={(index) => {
          setShowScheme(false)
          handleSelectEntry(index)
        }}
        onSchemes={() => setShowScheme(true)}
        schemeActive={showScheme}
        backendOnline={backendOnline}
        onProfile={() => setShowProfile(true)}
        onVoiceAssistant={toggleMic}
      />

      {showProfile && (
        <Profile
          onClose={() =>
            setShowProfile(false)
          }
        />
      )}

      <main className="main-canvas relative flex min-w-0 flex-1 flex-col overflow-hidden">

        <img
          src={illustration}
          alt=""
          aria-hidden="true"
          className="watermark-illustration pointer-events-none absolute inset-0 z-0 h-full w-full object-contain opacity-[0.16] sm:opacity-[0.2] dark:opacity-[0.08]"
        />

        <header className="relative z-20 flex h-14 shrink-0 items-center justify-end gap-2 border-b border-line bg-panel px-4">

          <button
            onClick={() =>
              setDarkMode((prev) => !prev)
            }
            aria-label={
              darkMode
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            className="rounded-lg border border-line p-2 text-mist transition hover:bg-panel-hi hover:text-ink"
          >
            {darkMode ? <Sun /> : <Moon />}
          </button>

          <div className="relative">

            <button
              aria-label="Open menu"
              onClick={() =>
                setShowHeaderMenu((prev) => !prev)
              }
              className="rounded-lg border border-line p-2 text-mist transition hover:bg-panel-hi hover:text-ink"
            >
              <Menu size={18} />
            </button>

            {showHeaderMenu && (
              <div className="header-menu absolute right-0 top-[calc(100%+0.65rem)] z-40 w-64 overflow-hidden rounded-2xl border border-line bg-panel p-1.5 shadow-xl">

                <div className="border-b border-line px-3 pb-2.5 pt-2">
                  <p className="text-sm font-semibold text-ink">
                    NAYAK menu
                  </p>

                  <p className="mt-0.5 text-xs text-mist">
                    Quick actions
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowHeaderMenu(false)
                    setShowGrievance(true)
                  }}
                  className="header-menu-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition"
                >
                  <span className="menu-icon bg-secondary/15 text-secondary">
                    <ShieldAlert size={16} />
                  </span>

                  <span>
                    <b className="font-medium">
                      Grievance
                    </b>

                    <small className="block text-xs text-mist">
                      Raise a citizen issue
                    </small>
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowHeaderMenu(false)
                    downloadMarkdown()
                  }}
                  className="header-menu-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition"
                >
                  <span className="menu-icon bg-accent/15 text-accent">
                    <Download size={16} />
                  </span>

                  <span>
                    <b className="font-medium">
                      Download chat
                    </b>

                    <small className="block text-xs text-mist">
                      Save this conversation
                    </small>
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowHeaderMenu(false)
                    handleLogout()
                  }}
                  className="header-menu-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition"
                >
                  <span className="menu-icon bg-primary/15 text-primary">
                    <LogOut size={16} />
                  </span>

                  <span>
                    <b className="font-medium">
                      Logout
                    </b>

                    <small className="block text-xs text-mist">
                      End this session
                    </small>
                  </span>
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

        <div
          className={
            showScheme
              ? 'hidden'
              : 'relative z-10 flex min-h-0 flex-1 flex-col'
          }
          aria-hidden={showScheme}
        >

          <ChatView
            messages={messages}
            focusIndex={focusIndex}
            interimText={interimText}
            speechSpeaking={speechSpeaking}
            speechPaused={speechPaused}
            pauseSpeech={pauseSpeech}
            resumeSpeech={resumeSpeech}
            stopSpeech={stopSpeech}
            micOn={micOn}
            onLegalQA={handleLegalQA}
            onSchemes={handleSchemes}
            onToggleMic={handleVoiceAssistant}
          />

          {micOn && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-[360px] items-center justify-center">

              <div className="pointer-events-auto">
                <VoiceInput
                  status={status}
                  micLevel={micLevel}
                  onStop={toggleMic}
                />
              </div>

            </div>
          )}

          <InputBar
            onSend={sendTextCommand}
            micActive={micOn}
            onToggleMic={toggleMic}
            micSupported={micSupported}
            disabled={status === 'processing'}
            language={language}
            languages={LANGUAGES}
            onLanguageChange={setLanguage}
          />
        </div>

        <div
          className={
            showScheme
              ? 'relative z-10 flex min-h-0 flex-1 flex-col'
              : 'hidden'
          }
          aria-hidden={!showScheme}
        >
          <Scheme />
        </div>

      </main>
    </div>
  )
}