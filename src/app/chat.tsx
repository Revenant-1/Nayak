import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native'

import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

import { api } from '@/lib/api'
import { storage } from '@/lib/storage'
import ChatView from '@/components/ChatView'
import InputBar from '@/components/InputBar'
import Sidebar from '@/components/Sidebar'

type Message = {
  role: 'user' | 'assistant'
  content: string
  time?: string
}

type Theme = {
  background: string
  surface: string
  surfaceHigh: string
  border: string
  text: string
  muted: string
  accent: string
  accentSoft: string
  userBubble: string
  assistantBubble: string
  errorBackground: string
  errorBorder: string
  errorText: string
}

const DARK_THEME: Theme = {
  background: '#080812',
  surface: '#0d0d1e',
  surfaceHigh: '#121226',
  border: '#27263f',
  text: '#f4f4f5',
  muted: '#8f8fa3',
  accent: '#a78bfa',
  accentSoft: '#241c45',
  userBubble: '#211942',
  assistantBubble: '#121226',
  errorBackground: '#24151c',
  errorBorder: '#4a2734',
  errorText: '#f0a6b7',
}

const LIGHT_THEME: Theme = {
  background: '#f5f5f7',
  surface: '#ffffff',
  surfaceHigh: '#f0eff5',
  border: '#dedce7',
  text: '#17151f',
  muted: '#6d6a78',
  accent: '#6547d9',
  accentSoft: '#eee9ff',
  userBubble: '#eee9ff',
  assistantBubble: '#ffffff',
  errorBackground: '#fff0f2',
  errorBorder: '#efc5cc',
  errorText: '#a6384a',
}

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChatScreen() {
  const systemScheme = useColorScheme()

  const [darkMode, setDarkMode] = useState(
    systemScheme !== 'light',
  )

  const theme = darkMode
    ? DARK_THEME
    : LIGHT_THEME

  const [username, setUsername] = useState('Guest')

  const [sessionId, setSessionId] =
    useState<string | null>(null)

  const [messages, setMessages] =
    useState<Message[]>([])

  const [loadingHistory, setLoadingHistory] =
    useState(true)

  const [sending, setSending] =
    useState(false)

  const [initializing, setInitializing] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [focusIndex, setFocusIndex] =
    useState<number | null>(null)

  const [drawerOpen, setDrawerOpen] =
    useState(false)

  const [profileOpen, setProfileOpen] =
    useState(false)

  /*
   * Load history for an existing session.
   */
  const loadHistory = useCallback(
    async (session: string) => {
      setLoadingHistory(true)

      try {
        console.log(
          '[ChatScreen] Loading history for session:',
          session,
        )

        const data = await api.history(session)

        const history = Array.isArray(data)
          ? data
          : Array.isArray(data?.history)
            ? data.history
            : []

        const normalized: Message[] =
          history
            .filter(
              (item: any) =>
                item &&
                (
                  item.role === 'user' ||
                  item.role === 'assistant'
                ) &&
                typeof item.content === 'string',
            )
            .map((item: any) => ({
              role: item.role,
              content: item.content,
              time: item.time ?? nowLabel(),
            }))

        setMessages(normalized)
        setError(null)

        console.log(
          `[ChatScreen] Loaded ${normalized.length} messages`,
        )
      } catch (err) {
        console.warn(
          '[ChatScreen] History load failed:',
          err,
        )

        setMessages([])

        const message =
          err instanceof Error
            ? err.message
            : 'Could not load chat history.'

        setError(message)
      } finally {
        setLoadingHistory(false)
      }
    },
    [],
  )

  /*
   * Make sure we have a valid authentication token.
   *
   * The current app is being tested without the login screen,
   * so if there is no token we use the backend's guest-login
   * endpoint. This is an actual backend authentication flow,
   * not a fake/local response.
   */
  const ensureAuthentication = useCallback(
    async () => {
      let token =
        await storage.getItem('auth_token')

      if (token) {
        try {
          await api.verifyToken(token)

          console.log(
            '[ChatScreen] Existing authentication token is valid.',
          )

          return token
        } catch (err) {
          console.warn(
            '[ChatScreen] Saved token is invalid. Creating guest login.',
            err,
          )

          await storage.removeItem('auth_token')
          await storage.removeItem('nayak_session_id')
          await storage.removeItem('nayak_user')
        }
      }

      console.log(
        '[ChatScreen] No valid token. Creating guest login...',
      )

      const data = await api.guestLogin()

      if (!data?.token) {
        throw new Error(
          'Guest login succeeded but no authentication token was returned.',
        )
      }

      await storage.setItem(
        'auth_token',
        data.token,
      )

      await storage.setJSON(
        'nayak_user',
        {
          user_id: data.user_id,
          username: data.username,
          user_type: data.user_type,
          isGuest: true,
        },
      )

      if (data.username) {
        setUsername(data.username)
      }

      console.log(
        '[ChatScreen] Guest authentication established.',
      )

      return data.token
    },
    [],
  )

  /*
   * Create a real backend chat session.
   */
  const createSession = useCallback(
    async () => {
      console.log(
        '[ChatScreen] Creating backend chat session...',
      )

      const data =
        await api.createSession()

      if (!data?.session_id) {
        throw new Error(
          'Backend did not return a session ID.',
        )
      }

      await storage.setItem(
        'nayak_session_id',
        data.session_id,
      )

      setSessionId(data.session_id)

      console.log(
        '[ChatScreen] Created session:',
        data.session_id,
      )

      return data.session_id
    },
    [],
  )

  /*
   * Application initialization.
   *
   * 1. Get/establish authentication.
   * 2. Get saved session.
   * 3. If there is no session, create one.
   * 4. Load its history.
   */
  useEffect(() => {
    let cancelled = false

    async function initialize() {
      setInitializing(true)
      setError(null)

      try {
        const user =
          await storage.getJSON('nayak_user')

        if (
          !cancelled &&
          user?.username
        ) {
          setUsername(user.username)
        }

        await ensureAuthentication()

        if (cancelled) return

        const savedSession =
          await storage.getItem(
            'nayak_session_id',
          )

        let activeSession =
          savedSession

        if (!activeSession) {
          activeSession =
            await createSession()
        } else {
          setSessionId(activeSession)
        }

        if (cancelled) return

        await loadHistory(activeSession)
      } catch (err) {
        console.error(
          '[ChatScreen] Initialization failed:',
          err,
        )

        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Could not initialize Nayak.'

          setError(message)
          setLoadingHistory(false)
        }
      } finally {
        if (!cancelled) {
          setInitializing(false)
        }
      }
    }

    initialize()

    return () => {
      cancelled = true
    }
  }, [
    createSession,
    ensureAuthentication,
    loadHistory,
  ])

  /*
   * Send a real message to POST /api/command.
   */
  async function handleSend(text: string) {
    const trimmed = text.trim()

    if (
      !trimmed ||
      sending ||
      initializing
    ) {
      return
    }

    setError(null)
    setFocusIndex(null)

    const userMessage: Message = {
      role: 'user',
      content: trimmed,
      time: nowLabel(),
    }

    setMessages((previous) => [
      ...previous,
      userMessage,
    ])

    setSending(true)

    try {
      /*
       * There must always be a real backend session.
       * If one somehow disappeared, create a new one.
       */
      let activeSession = sessionId

      if (!activeSession) {
        activeSession =
          await createSession()
      }

      console.log(
        '[ChatScreen] Sending command:',
        {
          session_id: activeSession,
          text: trimmed,
        },
      )

      const data = await api.command({
        text: trimmed,
        session_id: activeSession,
      })

      console.log(
        '[ChatScreen] Command response:',
        data,
      )

      if (
        !data ||
        typeof data.response !== 'string'
      ) {
        throw new Error(
          'The backend returned an invalid response.',
        )
      }

      /*
       * Backend can return the active session ID.
       * Persist it if it differs.
       */
      if (
        data.session_id &&
        data.session_id !== activeSession
      ) {
        activeSession = data.session_id

        setSessionId(data.session_id)

        await storage.setItem(
          'nayak_session_id',
          data.session_id,
        )
      }

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: data.response,
          time: nowLabel(),
        },
      ])
    } catch (err) {
      console.error(
        '[ChatScreen] Command failed:',
        err,
      )

      const message =
        err instanceof Error
          ? err.message
          : 'Could not send your message.'

      setError(message)

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            `I could not complete that request. ${message}`,
          time: nowLabel(),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  /*
   * Start a completely new backend session.
   *
   * IMPORTANT:
   * /api/new-chat returns the new session_id.
   * We must save and use that ID.
   */
  async function handleNewChat() {
    if (sending) {
      return
    }

    Keyboard.dismiss()

    setError(null)
    setFocusIndex(null)

    try {
      console.log(
        '[ChatScreen] Creating new chat...',
      )

      const data =
        await api.newChat()

      if (!data?.session_id) {
        throw new Error(
          'Backend did not return a new session ID.',
        )
      }

      await storage.setItem(
        'nayak_session_id',
        data.session_id,
      )

      setSessionId(data.session_id)
      setMessages([])

      console.log(
        '[ChatScreen] New chat session:',
        data.session_id,
      )
    } catch (err) {
      console.error(
        '[ChatScreen] New chat failed:',
        err,
      )

      const message =
        err instanceof Error
          ? err.message
          : 'Could not create a new chat.'

      setError(message)
    } finally {
      setDrawerOpen(false)
    }
  }

  function openDrawer() {
    Keyboard.dismiss()
    setDrawerOpen(true)
  }

  function closeDrawer() {
    Keyboard.dismiss()
    setDrawerOpen(false)
  }

  function handleHistorySelect(index: number) {
    Keyboard.dismiss()

    setFocusIndex(index)
    setDrawerOpen(false)
  }

  function openProfile() {
    Keyboard.dismiss()

    setDrawerOpen(false)
    setProfileOpen(true)
  }

  function closeProfile() {
    Keyboard.dismiss()
    setProfileOpen(false)
  }

  async function handleLogout() {
    Keyboard.dismiss()

    await storage.removeItem('auth_token')
    await storage.removeItem(
      'nayak_session_id',
    )
    await storage.removeItem('nayak_user')

    setSessionId(null)
    setUsername('Guest')
    setMessages([])
    setProfileOpen(false)
    setDrawerOpen(false)
  }

  if (loadingHistory && messages.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor:
              theme.background,
          },
        ]}
      >
        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
            color={theme.accent}
          />

          <Text
            style={[
              styles.loadingText,
              {
                color: theme.muted,
              },
            ]}
          >
            Connecting to Nayak…
          </Text>

          {error && (
            <Text
              style={[
                styles.loadingError,
                {
                  color: theme.errorText,
                },
              ]}
            >
              {error}
            </Text>
          )}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
        },
      ]}
      edges={[
        'top',
        'left',
        'right',
        'bottom',
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'padding'
        }
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor:
                theme.surface,
              borderBottomColor:
                theme.border,
            },
          ]}
        >
          <Pressable
            onPress={openDrawer}
            style={styles.headerIconButton}
            accessibilityRole="button"
            accessibilityLabel="Open sidebar"
          >
            <Ionicons
              name="menu-outline"
              size={27}
              color={theme.text}
            />
          </Pressable>

          <View
            style={styles.headerCenter}
          >
            <Text
              style={[
                styles.headerTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Legal Assistant
            </Text>

            <Text
              style={[
                styles.headerSubtitle,
                {
                  color: theme.muted,
                },
              ]}
              numberOfLines={1}
            >
              {sessionId
                ? `${messages.length} messages`
                : 'Connecting…'}
            </Text>
          </View>

          <Pressable
            onPress={() =>
              setDarkMode(
                (previous) =>
                  !previous,
              )
            }
            style={styles.headerIconButton}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
          >
            <Ionicons
              name={
                darkMode
                  ? 'sunny-outline'
                  : 'moon-outline'
              }
              size={21}
              color={theme.text}
            />
          </Pressable>
        </View>

        {/* Backend error */}
        {error && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor:
                  theme.errorBackground,
                borderBottomColor:
                  theme.errorBorder,
              },
            ]}
          >
            <Ionicons
              name="warning-outline"
              size={16}
              color={theme.errorText}
            />

            <Text
              style={[
                styles.errorText,
                {
                  color: theme.errorText,
                },
              ]}
              numberOfLines={3}
            >
              {error}
            </Text>

            <Pressable
              onPress={() =>
                setError(null)
              }
              style={styles.errorClose}
            >
              <Ionicons
                name="close"
                size={17}
                color={theme.errorText}
              />
            </Pressable>
          </View>
        )}

        <ChatView
          messages={messages}
          focusIndex={focusIndex}
        />

        <InputBar
          onSend={handleSend}
          disabled={
            sending ||
            initializing
          }
          loading={sending}
          placeholder={
            initializing
              ? 'Connecting to Nayak...'
              : sending
                ? 'Nayak is processing...'
                : 'Ask Nayak a legal question...'
          }
          theme={theme}
        />
      </KeyboardAvoidingView>

      {/* Sidebar */}
      <Sidebar
        visible={drawerOpen}
        messages={messages}
        username={username}
        theme={theme}
        darkMode={darkMode}
        onToggleTheme={() =>
          setDarkMode(
            (previous) =>
              !previous,
          )
        }
        onClose={closeDrawer}
        onNewChat={handleNewChat}
        onSelectEntry={handleHistorySelect}
        onProfile={openProfile}
        onLogout={handleLogout}
      />

      {/* Profile state is kept here for the existing native
          sidebar/profile implementation. */}
      {profileOpen && (
        <View
          style={[
            styles.profileOverlay,
            {
              backgroundColor:
                theme.background,
            },
          ]}
        >
          <View
            style={[
              styles.profileHeader,
              {
                borderBottomColor:
                  theme.border,
              },
            ]}
          >
            <Pressable
              onPress={closeProfile}
              style={styles.headerIconButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.text}
              />
            </Pressable>

            <Text
              style={[
                styles.profileTitle,
                {
                  color: theme.text,
                },
              ]}
            >
              Profile
            </Text>

            <View
              style={styles.headerIconButton}
            />
          </View>

          <View
            style={styles.profileContent}
          >
            <View
              style={[
                styles.profileAvatar,
                {
                  backgroundColor:
                    theme.accentSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.profileAvatarText,
                  {
                    color: theme.accent,
                  },
                ]}
              >
                {username
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <Text
              style={[
                styles.profileUsername,
                {
                  color: theme.text,
                },
              ]}
            >
              {username}
            </Text>

            <Text
              style={[
                styles.profileSession,
                {
                  color: theme.muted,
                },
              ]}
            >
              {sessionId
                ? 'Backend session active'
                : 'No active session'}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 14,
  },

  loadingError: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },

  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },

  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 10,
  },

  errorBanner: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },

  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 11,
    lineHeight: 16,
  },

  errorClose: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },

  profileHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },

  profileTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  profileContent: {
    alignItems: 'center',
    paddingTop: 45,
  },

  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileAvatarText: {
    fontSize: 30,
    fontWeight: '800',
  },

  profileUsername: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
  },

  profileSession: {
    marginTop: 7,
    fontSize: 12,
  },
})