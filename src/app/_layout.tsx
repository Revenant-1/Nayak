import { DarkTheme, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { Stack } from 'expo-router'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: '#080812',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="chat" />
      </Stack>
    </ThemeProvider>
  )
}