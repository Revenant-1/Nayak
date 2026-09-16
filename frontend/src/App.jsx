import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Scheme from './components/Scheme.jsx'
import Sidebar from './components/Sidebar.jsx'
import ChatView from './components/ChatView.jsx'
import InputBar from './components/InputBar.jsx'
import { useNayak } from './hooks/useNayak.jsx'
import VoiceInput from './components/voiceinput.jsx'
import Profile from './components/Profile.jsx'
import Grievance from './components/Grievance.jsx'
import Login from './components/Login.jsx'
import GoogleTranslate from './components/GoogleTranslate.jsx'
import DocumentModal from './components/Document.jsx'
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
  { code: 'as', label: 'অসমীয়া', speechCode: 'as-IN' },
  { code: 'bn', label: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'brx', label: 'बड़ो', speechCode: 'brx-IN' },
  { code: 'doi', label: 'डोगरी', speechCode: 'doi-IN' },
  { code: 'gu', label: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'hi', label: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'kn', label: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'ks', label: 'कॉशुर / کٲشُر', speechCode: 'ks-IN' },
  { code: 'kok', label: 'कोंकणी', speechCode: 'kok-IN' },
  { code: 'mai', label: 'मैथिली', speechCode: 'mai-IN' },
  { code: 'ml', label: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'mni', label: 'মৈতৈলোন্', speechCode: 'mni-IN' },
  { code: 'mr', label: 'मराठी', speechCode: 'mr-IN' },
  { code: 'ne', label: 'नेपाली', speechCode: 'ne-NP' },
  { code: 'or', label: 'ଓଡ଼ିଆ', speechCode: 'or-IN' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
  { code: 'sa', label: 'संस्कृतम्', speechCode: 'sa-IN' },
  { code: 'sat', label: 'संताली', speechCode: 'sat-IN' },
  { code: 'sd', label: 'سنڌي', speechCode: 'sd-IN' },
  { code: 'ta', label: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'te', label: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'ur', label: 'اردو', speechCode: 'ur-IN' },
]

export default function App() {
  const { t, i18n } = useTranslation()
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

  const [showDocuments, setShowDocuments] = useState(false)
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState(null)

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

  /*
   * IMPORTANT:
   * Do NOT restore the previous chat session from localStorage.
   *
   * Every browser refresh starts with a fresh chat.
   */
  const [sessionId, setSessionId] = useState(null)

  /*
   * Chat sessions are intentionally kept only in React memory.
   *
   * Therefore:
   * - New Chat works during the current page session.
   * - Selecting an existing chat works during the current page session.
   * - Refreshing the browser clears the sidebar chat history.
   */
  const [chatSessions, setChatSessions] = useState([])

  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const [language, setLanguage] = useState(() =>
    localStorage.getItem('nayak_language') || 'en',
  )

  const selectedLanguage =
    LANGUAGES.find(
      (item) => item.code === language,
    ) || LANGUAGES[0]

  /*
   * =========================================================
   * CLEAR CHAT HISTORY ON PAGE REFRESH
   * =========================================================
   *
   * The old version restored:
   *   nayak_session_id
   *   nayak_chat_sessions
   *
   * from localStorage.
   *
   * That caused the previous conversation to return after
   * refreshing the browser.
   *
   * These values are now removed when App starts.
   */
  useEffect(() => {
    localStorage.removeItem('nayak_session_id')
    localStorage.removeItem('nayak_chat_sessions')

    setSessionId(null)
    setMessages([])
    setChatSessions([])
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'nayak_language',
      language,
    )

    i18n.changeLanguage(language === 'auto' ? 'en' : language)
  }, [i18n, language])

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

  const rememberChatSession = useCallback((id, chatMessages = []) => {
    if (!id) return

    const firstUserMessage = chatMessages.find(
      (message) => message.role === 'user' && message.content,
    )

    const title =
      firstUserMessage?.content?.trim().slice(0, 80) || 'New chat'

    setChatSessions((prev) => {
      const existing = prev.find((item) => item.session_id === id)

      const next = existing
        ? prev.map((item) =>
            item.session_id === id
              ? {
                  ...item,
                  title:
                    existing.title !== 'New chat'
                      ? existing.title
                      : title,
                  preview:
                    firstUserMessage?.content ||
                    item.preview ||
                    '',
                  updatedAt: new Date().toISOString(),
                }
              : item,
          )
        : [
            {
              session_id: id,
              title,
              preview: firstUserMessage?.content || '',
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ]

      return next
    })
  }, [])

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

  const loadChatSession = useCallback(async (id) => {
    if (!id || id === sessionId) return

    stopSpeech()
    setShowScheme(false)
    setShowDocuments(false)
    setFocusIndex(null)
    setLoading(true)
    setSessionStatus('loading-history')
    setSystemMessage('Loading saved chat…')

    try {
      const data = await api.history(id)
      const list = Array.isArray(data)
        ? data
        : data.history ?? []

      setSessionId(id)
      setMessages(list)
      rememberChatSession(id, list)
      setBackendOnline(true)
      setSessionStatus(
        list.length ? 'ready' : 'empty-session',
      )
    } catch (err) {
      setBackendOnline(false)
      setSessionStatus('error')
      setSystemMessage(
        err?.message ||
        'Could not load this saved chat.',
      )
    } finally {
      setLoading(false)
    }
  }, [rememberChatSession, sessionId, stopSpeech])

  const createSession = useCallback(async () => {
    setSessionStatus('creating-session')

    setSystemMessage(
      'Creating a new chat session…',
    )

    const data = await api.createSession()

    setSessionId(data.session_id)

    /*
     * Do NOT save the session ID to localStorage.
     * This ensures a browser refresh creates a new session.
     */
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
    },
    [],
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
        localStorage.removeItem('nayak_session_id')

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
          rememberChatSession(sessionId, list)
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
    rememberChatSession,
    sessionId,
  ])

  /*
   * Keep the current session in React memory only.
   *
   * IMPORTANT:
   * There is intentionally NO localStorage.setItem()
   * for nayak_chat_sessions here.
   */
  useEffect(() => {
    if (
      !isAuthenticated ||
      !sessionId ||
      !messages.length
    ) {
      return
    }

    rememberChatSession(
      sessionId,
      messages,
    )
  }, [
    isAuthenticated,
    messages,
    rememberChatSession,
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
    localStorage.removeItem('nayak_session_id')
    localStorage.removeItem('nayak_user')
    localStorage.removeItem('nayak_chat_sessions')

    setSessionId(null)
    setMessages([])
    setChatSessions([])
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
      setShowScheme(false)
      setShowDocuments(false)
      setFocusIndex(null)
      setUploadError(null)

      /*
       * Do not call /api/new-chat.
       *
       * Create a fresh server session while keeping the
       * previous session in the sidebar for this page session.
       */
      try {
        const data = await api.createSession()
        const newSessionId = data.session_id

        if (sessionId) {
          rememberChatSession(
            sessionId,
            messages,
          )
        }

        setSessionId(newSessionId)
        setMessages([])
        setSessionStatus('empty-session')
        setSystemMessage('New chat ready.')
        setBackendOnline(true)

        rememberChatSession(
          newSessionId,
          [],
        )
      } catch (error) {
        setBackendOnline(false)
        setSystemMessage(
          error?.message ||
          'Could not create a new chat.',
        )
      }
    },
    [
      messages,
      rememberChatSession,
      sessionId,
      stopSpeech,
    ],
  )

  const handleSelectEntry = useCallback(
    (index) => setFocusIndex(index),
    [],
  )

  const handleDocuments = useCallback(async () => {
    setShowScheme(false)
    setShowDocuments(true)
    setDocumentsLoading(true)
    setDocumentsError(null)

    try {
      const data = await api.documents()

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.documents)
          ? data.documents
          : Array.isArray(data?.items)
            ? data.items
            : []

      setDocuments(
        items.map((document) => ({
          ...document,
          name:
            document.name ??
            document.filename ??
            document.file_name ??
            'Untitled document',
        })),
      )
    } catch (error) {
      console.error(
        '[App] failed to load documents:',
        error,
      )

      setDocumentsError(error.message)
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }, [])

  const handleUploadDocument = useCallback(
    async (file) => {
      if (!file) return

      const allowedExtensions = [
        'pdf',
        'doc',
        'docx',
        'txt',
        'csv',
        'xls',
        'xlsx',
        'jpg',
        'jpeg',
        'png',
      ]

      const extension =
        file.name
          .split('.')
          .pop()
          ?.toLowerCase()

      if (!allowedExtensions.includes(extension)) {
        setUploadError(
          'Unsupported file type. Please upload PDF, DOCX, TXT, CSV, XLSX, JPG, or PNG.',
        )
        return
      }

      setUploadingDocument(true)
      setUploadError(null)

      try {
        await api.uploadDocument(file)

        const data =
          await api.documents()

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.documents)
            ? data.documents
            : Array.isArray(data?.items)
              ? data.items
              : []

        setDocuments(
          items.map((document) => ({
            ...document,
            name:
              document.name ??
              document.filename ??
              document.file_name ??
              'Untitled document',
          })),
        )
      } catch (error) {
        console.error(
          '[App] failed to upload document:',
          error,
        )

        setUploadError(
          error?.message ||
          'Could not upload the document.',
        )
      } finally {
        setUploadingDocument(false)
      }
    },
    [],
  )

  /*
   * =========================================================
   * HOME CARD ACTIONS
   * =========================================================
   */

  const handleLegalQA = useCallback(() => {
    setShowScheme(false)

    requestAnimationFrame(() => {
      const input =
        document.querySelector('.chat-input')

      input?.focus()
    })
  }, [])

  const handleSchemes = useCallback(() => {
    setShowScheme(true)
    setFocusIndex(null)
  }, [])

  const handleVoiceAssistant = useCallback(() => {
    setShowScheme(false)
    setShowDocuments(false)
    setFocusIndex(null)

    if (micSupported) {
      toggleMic()
    }
  }, [
    micSupported,
    toggleMic,
  ])

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
      <GoogleTranslate language={language} />

      <Sidebar
        sessions={chatSessions}
        activeSessionId={sessionId}
        onNewChat={handleNewChat}
        onSelectChat={loadChatSession}
        onSchemes={() =>
          setShowScheme(true)
        }
        schemeActive={showScheme}
        backendOnline={backendOnline}
        onProfile={() =>
          setShowProfile(true)
        }
        onVoiceAssistant={
          handleVoiceAssistant
        }
        onDocuments={handleDocuments}
      />

      {showProfile && (
        <Profile
          onClose={() =>
            setShowProfile(false)
          }
        />
      )}

      {showGrievance && (
        <Grievance
          onClose={() =>
            setShowGrievance(false)
          }
        />
      )}

      <DocumentModal
        open={showDocuments}
        onClose={() =>
          setShowDocuments(false)
        }
        documents={documents}
        loading={documentsLoading}
        error={documentsError}
        onRefresh={handleDocuments}
        onUploadDocument={
          handleUploadDocument
        }
        uploadingDocument={
          uploadingDocument
        }
      />

      <main className="main-canvas relative flex min-w-0 flex-1 flex-col overflow-hidden">

        <img
          src={illustration}
          alt=""
          aria-hidden="true"
          className="watermark-illustration pointer-events-none absolute inset-0 z-0 h-full w-full object-contain opacity-[0.16] sm:opacity-[0.2] dark:opacity-[0.08]"
        />

        <div className="absolute right-4 top-4 z-20 flex items-center justify-end gap-2">

          <div className="relative">

            <button
              aria-label={t('openMenu')}
              onClick={() =>
                setShowHeaderMenu(
                  (prev) => !prev,
                )
              }
              className="menu rounded-lg border border-line p-2 text-mist transition hover:bg-panel-hi hover:text-ink"
            >
              <Menu size={18} />
            </button>

            {showHeaderMenu && (
              <div className="header-menu absolute right-0 top-[calc(100%+0.65rem)] z-40 w-64 overflow-hidden rounded-2xl border border-line bg-panel p-1.5 shadow-xl">

                <div className="border-b border-line px-3 pb-2.5 pt-2">
                  <p className="text-sm font-semibold text-ink">
                    {t('menu')}
                  </p>

                  <p className="mt-0.5 text-xs text-mist">
                    {t('quickActions')}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setDarkMode(
                      (prev) => !prev,
                    )
                  }
                  className="header-menu-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition"
                >
                  <span className="menu-icon bg-primary/15 text-primary">
                    {darkMode ? (
                      <Sun size={16} />
                    ) : (
                      <Moon size={16} />
                    )}
                  </span>

                  <span>
                    <b className="font-medium">
                      {darkMode
                        ? t('lightMode')
                        : t('darkMode')}
                    </b>

                    <small className="block text-xs text-mist">
                      {t('changeAppearance')}
                    </small>
                  </span>
                </button>

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
                      {t('grievance')}
                    </b>

                    <small className="block text-xs text-mist">
                      {t('raiseIssue')}
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
                      {t('downloadChat')}
                    </b>

                    <small className="block text-xs text-mist">
                      {t('saveConversation')}
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
                      {t('logout')}
                    </b>

                    <small className="block text-xs text-mist">
                      {t('endSession')}
                    </small>
                  </span>
                </button>

                <label
                  className="notranslate flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-ink"
                  translate="no"
                >
                  <span>{t('language')}</span>

                  <select
                    value={language}
                    onChange={(event) =>
                      setLanguage(
                        event.target.value,
                      )
                    }
                    aria-label={t('language')}
                    className="rounded-lg border border-line bg-panel-hi px-2 py-1.5 text-xs text-ink outline-none"
                  >
                    {LANGUAGES.map((item) => (
                      <option
                        key={item.code}
                        value={item.code}
                      >
                        {item.code === 'auto'
                          ? t('auto')
                          : item.label}
                      </option>
                    ))}
                  </select>
                </label>

              </div>
            )}
          </div>
        </div>

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
            onUploadDocument={
              handleUploadDocument
            }
            uploadingDocument={
              uploadingDocument
            }
            uploadError={uploadError}
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
            disabled={
              status === 'processing'
            }
            language={language}
            languages={LANGUAGES}
            onLanguageChange={setLanguage}
            onUploadDocument={
              handleUploadDocument
            }
            uploadingDocument={
              uploadingDocument
            }
            uploadError={uploadError}
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

