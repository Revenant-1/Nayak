import { DarkTheme, ThemeProvider } from 'expo-router'
import { Stack } from 'expo-router'

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