import { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'

export default function IndexScreen() {
  useEffect(() => {
    let cancelled = false

    async function initialize() {
      if (cancelled) return

      await SplashScreen.hideAsync()

      router.replace('/chat')
    }

    initialize()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#a78bfa" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080812',
  },
})