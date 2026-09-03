import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'

import { api } from '@/lib/api'
import { storage } from '@/lib/storage'

type AuthStatus =
  | 'checking-token'
  | 'idle'
  | 'signing-in'
  | 'registering'
  | 'guest-login'
  | 'auth-error'

export default function IndexScreen() {
  const [authStatus, setAuthStatus] =
    useState<AuthStatus>('checking-token')

  const [authError, setAuthError] = useState<string | null>(null)

  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const loading =
    authStatus === 'signing-in' ||
    authStatus === 'registering' ||
    authStatus === 'guest-login'

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      try {
        const token = await storage.getItem('auth_token')

        if (!token) {
          if (!cancelled) {
            setAuthStatus('idle')
          }
          return
        }

        if (!cancelled) {
          setAuthStatus('checking-token')
        }

        await api.verifyToken(token)

        if (cancelled) return

        setAuthError(null)

        /*
         * A valid token means the user is authenticated.
         *
         * We create a fresh chat session here because the original
         * application creates a session after authentication.
         */
        const sessionData = await api.createSession()

        if (cancelled) return

        if (!sessionData?.session_id) {
          throw new Error('Backend did not return a session ID.')
        }

        await storage.setItem(
          'nayak_session_id',
          sessionData.session_id,
        )

        await SplashScreen.hideAsync()

        router.replace('/chat')
      } catch (error: any) {
        if (cancelled) return

        await storage.removeItem('auth_token')
        await storage.removeItem('nayak_session_id')
        await storage.removeItem('nayak_user')

        setAuthStatus('auth-error')
        setAuthError(
          error?.message ||
            'Your session has expired. Please sign in again.',
        )

        await SplashScreen.hideAsync()
      }
    }

    initialize()

    return () => {
      cancelled = true
    }
  }, [])

  async function completeAuthentication(
    action: () => Promise<any>,
    isGuest = false,
  ) {
    setAuthError(null)

    try {
      const data = await action()

      if (!data?.token) {
        throw new Error('Authentication response did not contain a token.')
      }

      const user = {
        user_id: data.user_id,
        username: data.username,
        user_type: data.user_type,
        ...(isGuest ? {} : isRegister ? { email } : {}),
        isGuest,
      }

      await storage.setItem('auth_token', data.token)
      await storage.setJSON('nayak_user', user)

      setAuthStatus(
        isGuest
          ? 'guest-login'
          : isRegister
            ? 'registering'
            : 'signing-in',
      )

      const sessionData = await api.createSession()

      if (!sessionData?.session_id) {
        throw new Error('Backend did not return a session ID.')
      }

      await storage.setItem(
        'nayak_session_id',
        sessionData.session_id,
      )

      await SplashScreen.hideAsync()

      router.replace('/chat')
    } catch (error: any) {
      await storage.removeItem('auth_token')
      await storage.removeItem('nayak_session_id')
      await storage.removeItem('nayak_user')

      const message =
        error?.message?.includes('backend') ||
        error?.message?.includes('reach') ||
        error?.message?.includes('Network')
          ? 'Could not reach the backend. Check the API server.'
          : `Authentication failed: ${
              error?.message || 'Unknown error'
            }`

      setAuthError(message)
      setAuthStatus('auth-error')
    }
  }

  async function handleSubmit() {
    if (loading) return

    if (!username.trim() || !password.trim()) {
      setAuthError('Username and password are required.')
      setAuthStatus('auth-error')
      return
    }

    if (isRegister && !email.trim()) {
      setAuthError('Email address is required.')
      setAuthStatus('auth-error')
      return
    }

    setAuthError(null)

    await completeAuthentication(
      () =>
        isRegister
          ? api.register({
              username: username.trim(),
              email: email.trim(),
              password,
            })
          : api.login({
              username: username.trim(),
              password,
            }),
    )
  }

  async function handleGuestLogin() {
    if (loading) return

    setAuthStatus('guest-login')
    setAuthError(null)

    await completeAuthentication(() => api.guestLogin(), true)
  }

  function switchMode(register: boolean) {
    if (loading) return

    setIsRegister(register)
    setAuthError(null)
  }

  if (authStatus === 'checking-token') {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#a78bfa" />

        <Text style={styles.loadingTitle}>
          Checking saved session…
        </Text>

        <Text style={styles.loadingText}>
          Preparing your assistant
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>N</Text>
            </View>

            <Text style={styles.title}>
              {isRegister
                ? 'Create an Account'
                : 'Welcome to Nayak'}
            </Text>

            <Text style={styles.subtitle}>
              {isRegister
                ? 'Register to start your legal assistant session'
                : 'Sign in to access your legal assistant session'}
            </Text>

            <View style={styles.modeSwitch}>
              <Pressable
                style={[
                  styles.modeButton,
                  !isRegister && styles.modeButtonActive,
                ]}
                onPress={() => switchMode(false)}
              >
                <Text
                  style={[
                    styles.modeText,
                    !isRegister && styles.modeTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modeButton,
                  isRegister && styles.modeButtonActive,
                ]}
                onPress={() => switchMode(true)}
              >
                <Text
                  style={[
                    styles.modeText,
                    isRegister && styles.modeTextActive,
                  ]}
                >
                  Register
                </Text>
              </Pressable>
            </View>

            {authError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {authError}
                </Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <Text style={styles.label}>Username</Text>

              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor="#77778a"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
              />

              {isRegister ? (
                <>
                  <Text style={styles.label}>Email Address</Text>

                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@example.com"
                    placeholderTextColor="#77778a"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    style={styles.input}
                  />
                </>
              ) : null}

              <Text style={styles.label}>Password</Text>

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="password"
                placeholderTextColor="#77778a"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
              />

              <Pressable
                disabled={loading}
                onPress={handleSubmit}
                style={[
                  styles.primaryButton,
                  loading && styles.disabledButton,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isRegister
                      ? 'Create Account'
                      : 'Sign In'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                disabled={loading}
                onPress={handleGuestLogin}
                style={[
                  styles.guestButton,
                  loading && styles.disabledButton,
                ]}
              >
                <Text style={styles.guestButtonText}>
                  Continue as Guest
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080812',
  },

  keyboard: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27263f',
    backgroundColor: '#0d0d1e',
  },

  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6d4aff',
    backgroundColor: '#17142d',
  },

  logoText: {
    color: '#a78bfa',
    fontSize: 24,
    fontWeight: '700',
  },

  title: {
    color: '#f4f4f5',
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtitle: {
    color: '#9a9aab',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },

  modeSwitch: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#17163a',
    marginTop: 24,
  },

  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 7,
  },

  modeButtonActive: {
    backgroundColor: '#6d4aff',
  },

  modeText: {
    color: '#9a9aab',
    fontSize: 13,
    fontWeight: '600',
  },

  modeTextActive: {
    color: '#ffffff',
  },

  errorBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#713f46',
    backgroundColor: '#28151b',
  },

  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 19,
  },

  form: {
    marginTop: 20,
  },

  label: {
    color: '#b1b1c1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 7,
    marginTop: 14,
  },

  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#302f49',
    backgroundColor: '#121226',
    color: '#f4f4f5',
    paddingHorizontal: 14,
    fontSize: 15,
  },

  primaryButton: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6d4aff',
    marginTop: 24,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  guestButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#302f49',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  guestButtonText: {
    color: '#b8b8c8',
    fontSize: 14,
    fontWeight: '600',
  },

  disabledButton: {
    opacity: 0.55,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080812',
    padding: 24,
  },

  loadingTitle: {
    color: '#f4f4f5',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 18,
  },

  loadingText: {
    color: '#858596',
    fontSize: 13,
    marginTop: 7,
  },
})