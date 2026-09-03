import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { storage } from '@/lib/storage'

export default function ChatScreen() {
  const [username, setUsername] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    async function loadState() {
      const user = await storage.getJSON('nayak_user')
      const session = await storage.getItem('nayak_session_id')

      setUsername(user?.username ?? null)
      setSessionId(session)
    }

    loadState()
  }, [])

  async function handleLogout() {
    await storage.removeItem('auth_token')
    await storage.removeItem('nayak_session_id')
    await storage.removeItem('nayak_user')

    router.replace('/')
  }

  if (!sessionId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#a78bfa" />

          <Text style={styles.loadingText}>
            Preparing your chat session…
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Nayak
          </Text>

          <Text style={styles.subtitle}>
            Legal Assistant Session
          </Text>
        </View>

        <Pressable
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>
          Phase 2 Navigation Complete
        </Text>

        <Text style={styles.description}>
          {username
            ? `Authenticated as ${username}.`
            : 'Authenticated successfully.'}
        </Text>

        <Text style={styles.session}>
          Session ID stored securely.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080812',
  },

  header: {
    minHeight: 64,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#27263f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  logoutButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b3044',
  },

  logoutText: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '600',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  heading: {
    color: '#f4f4f5',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  description: {
    color: '#a1a1b2',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },

  session: {
    color: '#737387',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },

  center: {
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