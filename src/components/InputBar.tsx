import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

type InputBarProps = {
  onSend: (text: string) => void | Promise<void>
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}

export default function InputBar({
  onSend,
  disabled = false,
  loading = false,
  placeholder = 'Ask Nayak a legal question...',
}: InputBarProps) {
  const [text, setText] = useState('')

  const canSend = text.trim().length > 0 && !disabled && !loading

  async function handleSend() {
    const value = text.trim()

    if (!value || !canSend) {
      return
    }

    setText('')

    try {
      await onSend(value)
    } catch (error) {
      console.warn('[InputBar] send error:', error)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#66667a"
          multiline
          maxLength={4000}
          editable={!disabled && !loading}
          style={styles.input}
          textAlignVertical="top"
          returnKeyType="default"
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          style={({ pressed }) => [
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
            pressed && canSend && styles.sendButtonPressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#c4b5fd"
            />
          ) : (
            <Text
              style={[
                styles.sendIcon,
                !canSend && styles.sendIconDisabled,
              ]}
            >
              ↑
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#080812',
    borderTopWidth: 1,
    borderTopColor: '#1c1b2b',
  },

  inputWrapper: {
    minHeight: 48,
    maxHeight: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#11111d',
    borderWidth: 1,
    borderColor: '#2a2940',
    borderRadius: 18,
    paddingLeft: 15,
    paddingRight: 7,
    paddingVertical: 6,
  },

  input: {
    flex: 1,
    minHeight: 34,
    maxHeight: 126,
    paddingTop: 7,
    paddingBottom: 7,
    paddingRight: 8,
    color: '#f4f4f5',
    fontSize: 14,
    lineHeight: 20,
  },

  sendButton: {
    width: 36,
    height: 36,
    marginBottom: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2b2250',
    borderWidth: 1,
    borderColor: '#5946a6',
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },

  sendButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },

  sendIcon: {
    color: '#c4b5fd',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },

  sendIconDisabled: {
    color: '#77778a',
  },
})