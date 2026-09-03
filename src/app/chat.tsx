import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { api } from '@/lib/api'
import { storage } from '@/lib/storage'
import ChatView from '@/components/ChatView'
import InputBar from '@/components/InputBar'

type Message = {
  role: 'user' | 'assistant'
  content: string
  time?: string
}

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChatScreen() {
  const [username, setUsername] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [sending, setSending] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [focusIndex, setFocusIndex] = useState<number | null>(null)

  const loadHistory = useCallback(async (session: string) => {
    setLoadingHistory(true)
    setError(null)

    try {
      const data = await api.history(session)

      const history = Array.isArray(data)
        ? data
        : Array.isArray(data?.history)
          ? data.history
          : []

      const normalized: Message[] = history
        .filter(
          (item: any) =>
            item &&
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.content === 'string',
        )
        .map((item: any) => ({
          role: item.role,
          content: item.content,
          time: item.time ?? nowLabel(),
        }))

      setMessages(normalized)
    } catch (err) {
      console.warn('[ChatScreen] history error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Could not load your chat history.',
      )
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      try {
        const user = await storage.getJSON('nayak_user')
        const session = await storage.getItem('nayak_session_id')

        if (cancelled) return

        setUsername(user?.username ?? null)

        if (!session) {
          setError('No chat session was found.')
          setLoadingHistory(false)
          return
        }

        setSessionId(session)
        await loadHistory(session)
      } catch (err) {
        if (cancelled) return

        console.warn('[ChatScreen] initialization error:', err)

        setError(
          err instanceof Error
            ? err.message
            : 'Could not initialize the chat.',
        )

        setLoadingHistory(false)
      }
    }

    initialize()

    return () => {
      cancelled = true
    }
  }, [loadHistory])

  async function handleSend(text: string) {
    if (!text.trim() || sending || !sessionId) {
      return
    }

    setError(null)
    setFocusIndex(null)

    const userMessage: Message = {
      role: 'user',
      content: text.trim(),
      time: nowLabel(),
    }

    setMessages((previous) => [...previous, userMessage])
    setSending(true)

    try {
      const data = await api.command({
        text: text.trim(),
        session_id: sessionId,
      })

      if (!data || typeof data.response !== 'string') {
        throw new Error('The backend returned an invalid response.')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        time: nowLabel(),
      }

      setMessages((previous) => [...previous, assistantMessage])
    } catch (err) {
      console.warn('[ChatScreen] command error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Could not send your message.',
      )
    } finally {
      setSending(false)
    }
  }

  async function handleNewChat() {
    if (sending) {
      return
    }

    setError(null)
    setFocusIndex(null)

    try {
      await api.newChat()
      setMessages([])
    } catch (err) {
      console.warn('[ChatScreen] new chat error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Could not start a new chat.',
      )
    }
  }

  async function handleLogout() {
    await storage.removeItem('auth_token')
    await storage.removeItem('nayak_session_id')
    await storage.removeItem('nayak_user')
  }

  if (loadingHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#a78bfa"
          />

          <Text style={styles.loadingText}>
            Loading your chat…
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>
              Nayak
            </Text>

            <Text style={styles.subtitle}>
              {username
                ? `Legal Assistant · ${username}`
                : 'Legal Assistant'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={handleNewChat}
              disabled={sending}
              style={({ pressed }) => [
                styles.headerButton,
                sending && styles.headerButtonDisabled,
                pressed && !sending && styles.headerButtonPressed,
              ]}
            >
              <Text style={styles.headerButtonText}>
                New
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLogout}
              disabled={sending}
              style={({ pressed }) => [
                styles.headerButton,
                sending && styles.headerButtonDisabled,
                pressed && !sending && styles.headerButtonPressed,
              ]}
            >
              <Text style={styles.headerButtonText}>
                Logout
              </Text>
            </Pressable>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.chatContainer}>
          <ChatView
            messages={messages}
            focusIndex={focusIndex}
          />
        </View>

        <InputBar
          onSend={handleSend}
          disabled={!sessionId}
          loading={sending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080812',
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27263f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerInfo: {
    flex: 1,
    marginRight: 10,
  },

  title: {
    color: '#f4f4f5',
    fontSize: 18,
    fontWeight: '700',
  },

  subtitle: {
    color: '#77778a',
    fontSize: 11,
    marginTop: 3,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 7,
  },

  headerButton: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b3044',
  },

  headerButtonDisabled: {
    opacity: 0.45,
  },

  headerButtonPressed: {
    opacity: 0.7,
  },

  headerButtonText: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: '600',
  },

  chatContainer: {
    flex: 1,
  },

  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#24151c',
    borderBottomWidth: 1,
    borderBottomColor: '#4a2734',
  },

  errorText: {
    color: '#f0a6b7',
    fontSize: 12,
    lineHeight: 17,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#a1a1b2',
    fontSize: 14,
    marginTop: 14,
  },
})