import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

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
}

type SidebarProps = {
  visible: boolean
  messages: Message[]
  username: string
  sessionId: string | null
  darkMode: boolean
  theme: Theme
  onClose: () => void
  onNewChat: () => void | Promise<void>
  onSelectEntry: (index: number) => void
  onOpenProfile: () => void
  onToggleTheme: (value: boolean) => void
  onLogout: () => void | Promise<void>
}

function getHistoryTitle(content: string) {
  const cleaned = content.replace(/\s+/g, ' ').trim()

  if (!cleaned) {
    return 'New conversation'
  }

  return cleaned.length > 48
    ? `${cleaned.slice(0, 48)}…`
    : cleaned
}

export default function Sidebar({
  visible,
  messages,
  username,
  sessionId,
  darkMode,
  theme,
  onClose,
  onNewChat,
  onSelectEntry,
  onOpenProfile,
  onToggleTheme,
  onLogout,
}: SidebarProps) {
  const entries = messages
    .map((message, index) => ({
      message,
      index,
    }))
    .filter((entry) => entry.message.role === 'user')

  function closeSidebar() {
    Keyboard.dismiss()
    onClose()
  }

  function handleNewChat() {
    Keyboard.dismiss()
    onNewChat()
  }

  function handleHistoryEntry(index: number) {
    Keyboard.dismiss()
    onSelectEntry(index)
  }

  function handleProfile() {
    Keyboard.dismiss()
    onOpenProfile()
  }

  function handleLogout() {
    Keyboard.dismiss()
    onLogout()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeSidebar}
    >
      <View style={styles.root}>
        {/* Background overlay */}
        <Pressable
          style={styles.backdrop}
          onPress={closeSidebar}
        />

        {/* Sidebar */}
        <View
          style={[
            styles.drawer,
            {
              backgroundColor: theme.surface,
              borderRightColor: theme.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <View
                style={[
                  styles.brandDot,
                  {
                    backgroundColor: theme.accent,
                  },
                ]}
              />

              <View>
                <Text
                  style={[
                    styles.brandTitle,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  NAYAK
                </Text>

                <Text
                  style={[
                    styles.brandSubtitle,
                    {
                      color: theme.muted,
                    },
                  ]}
                >
                  LEGAL ASSISTANT
                </Text>
              </View>
            </View>

            <Pressable
              onPress={closeSidebar}
              hitSlop={10}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.muted}
              />
            </Pressable>
          </View>

          {/* New chat */}
          <Pressable
            onPress={handleNewChat}
            style={({ pressed }) => [
              styles.newChatButton,
              {
                backgroundColor: theme.accentSoft,
                borderColor: theme.accent,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name="add"
              size={19}
              color={theme.accent}
            />

            <Text
              style={[
                styles.newChatText,
                {
                  color: theme.text,
                },
              ]}
            >
              New chat
            </Text>
          </Pressable>

          {/* Connection status */}
          <View
            style={[
              styles.statusContainer,
              {
                backgroundColor: theme.surfaceHigh,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: sessionId
                    ? '#34d399'
                    : '#f59e0b',
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: theme.muted,
                },
              ]}
            >
              {sessionId
                ? 'Backend session active'
                : 'Frontend test mode'}
            </Text>
          </View>

          {/* History */}
          <View style={styles.historySection}>
            <Text
              style={[
                styles.historyTitle,
                {
                  color: theme.muted,
                },
              ]}
            >
              HISTORY
            </Text>

            {entries.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={23}
                  color={theme.muted}
                />

                <Text
                  style={[
                    styles.emptyHistoryText,
                    {
                      color: theme.muted,
                    },
                  ]}
                >
                  No conversations yet.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.historyList}
                contentContainerStyle={styles.historyContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {entries.map((entry) => (
                  <Pressable
                    key={entry.index}
                    onPress={() =>
                      handleHistoryEntry(entry.index)
                    }
                    style={({ pressed }) => [
                      styles.historyItem,
                      {
                        backgroundColor: pressed
                          ? theme.accentSoft
                          : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color={theme.muted}
                    />

                    <Text
                      numberOfLines={2}
                      style={[
                        styles.historyText,
                        {
                          color: theme.text,
                        },
                      ]}
                    >
                      {getHistoryTitle(
                        entry.message.content,
                      )}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: theme.border,
              },
            ]}
          >
            {/* Profile */}
            <Pressable
              onPress={handleProfile}
              style={({ pressed }) => [
                styles.profileButton,
                {
                  backgroundColor: pressed
                    ? theme.accentSoft
                    : 'transparent',
                },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: theme.accentSoft,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={17}
                  color={theme.accent}
                />
              </View>

              <View style={styles.profileInfo}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.username,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {username || 'Guest'}
                </Text>

                <Text
                  style={[
                    styles.accountText,
                    {
                      color: theme.muted,
                    },
                  ]}
                >
                  Account
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={17}
                color={theme.muted}
              />
            </Pressable>

            {/* Theme */}
            <View style={styles.themeRow}>
              <View style={styles.themeLeft}>
                <Ionicons
                  name={
                    darkMode
                      ? 'moon-outline'
                      : 'sunny-outline'
                  }
                  size={18}
                  color={theme.muted}
                />

                <Text
                  style={[
                    styles.themeText,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  Dark mode
                </Text>
              </View>

              <Switch
                value={darkMode}
                onValueChange={onToggleTheme}
                trackColor={{
                  false: '#d1d0da',
                  true: '#4c3a87',
                }}
                thumbColor={
                  darkMode
                    ? theme.accent
                    : '#ffffff'
                }
              />
            </View>

            {/* Clear session */}
            <Pressable
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color={theme.muted}
              />

              <Text
                style={[
                  styles.logoutText,
                  {
                    color: theme.muted,
                  },
                ]}
              >
                Clear session
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },

  drawer: {
    width: '82%',
    maxWidth: 340,
    height: '100%',
    borderRightWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 15,
    elevation: 20,
  },

  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 9,
  },

  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },

  brandSubtitle: {
    fontSize: 9,
    letterSpacing: 1.2,
    marginTop: 3,
  },

  closeButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  newChatButton: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  newChatText: {
    fontSize: 14,
    fontWeight: '600',
  },

  statusContainer: {
    minHeight: 40,
    marginTop: 10,
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  historySection: {
    flex: 1,
    marginTop: 21,
  },

  historyTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  historyList: {
    flex: 1,
  },

  historyContent: {
    paddingBottom: 10,
  },

  historyItem: {
    minHeight: 48,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  historyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },

  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
  },

  emptyHistoryText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 9,
  },

  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 7,
  },

  profileButton: {
    minHeight: 50,
    borderRadius: 9,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 35,
    height: 35,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 9,
  },

  username: {
    fontSize: 13,
    fontWeight: '600',
  },

  accountText: {
    fontSize: 10,
    marginTop: 2,
  },

  themeRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  themeText: {
    fontSize: 12,
  },

  logoutButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  logoutText: {
    fontSize: 12,
  },
})