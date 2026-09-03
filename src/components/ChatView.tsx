import { useEffect, useRef } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native'

type Message = {
  role: 'user' | 'assistant'
  content: string
  time?: string
}

type ChatViewProps = {
  messages: Message[]
  focusIndex?: number | null
  interimText?: string
}

function timestamp() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function renderAssistantText(content: string) {
  const lines = content.split('\n')

  return lines.map((line, index) => {
    const trimmed = line.trim()

    if (!trimmed) {
      return (
        <View
          key={index}
          style={styles.markdownSpacer}
        />
      )
    }

    if (trimmed.startsWith('### ')) {
      return (
        <Text
          key={index}
          style={styles.heading3}
        >
          {trimmed.slice(4)}
        </Text>
      )
    }

    if (trimmed.startsWith('## ')) {
      return (
        <Text
          key={index}
          style={styles.heading2}
        >
          {trimmed.slice(3)}
        </Text>
      )
    }

    if (trimmed.startsWith('# ')) {
      return (
        <Text
          key={index}
          style={styles.heading1}
        >
          {trimmed.slice(2)}
        </Text>
      )
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <Text
          key={index}
          style={styles.bodyText}
        >
          {'• '}
          {trimmed.slice(2)}
        </Text>
      )
    }

    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <Text
          key={index}
          style={styles.bodyText}
        >
          {trimmed}
        </Text>
      )
    }

    return (
      <Text
        key={index}
        style={styles.bodyText}
      >
        {trimmed}
      </Text>
    )
  })
}

export default function ChatView({
  messages,
  focusIndex = null,
  interimText = '',
}: ChatViewProps) {
  const listRef = useRef<FlatList<Message>>(null)

  useEffect(() => {
    if (
      focusIndex != null &&
      focusIndex >= 0 &&
      focusIndex < messages.length
    ) {
      listRef.current?.scrollToIndex({
        index: focusIndex,
        animated: true,
        viewPosition: 0.5,
      })

      return
    }

    if (messages.length > 0) {
      listRef.current?.scrollToEnd({
        animated: true,
      })
    }
  }, [messages, focusIndex, interimText])

  if (messages.length === 0 && !interimText) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>
            Ask a legal question
          </Text>

          <Text style={styles.emptyDescription}>
            Type your query below or tap the microphone — the orb will pulse
            while Nayak listens and processes.
          </Text>
        </View>
      </View>
    )
  }

  const data: Message[] = interimText
    ? [
        ...messages,
        {
          role: 'user',
          content: interimText,
          time: '',
        },
      ]
    : messages

  const renderMessage = ({
    item,
    index,
  }: {
    item: Message
    index: number
  }) => {
    const isUser = item.role === 'user'
    const isInterim =
      Boolean(interimText) &&
      index === data.length - 1 &&
      index >= messages.length

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.assistantRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? styles.userBubble
              : styles.assistantBubble,
            isInterim && styles.interimBubble,
          ]}
        >
          {isUser ? (
            <Text
              style={[
                styles.messageText,
                styles.userText,
                isInterim && styles.interimText,
              ]}
            >
              {item.content}
            </Text>
          ) : (
            <View>
              {renderAssistantText(item.content)}
            </View>
          )}

          {!isInterim && (
            <Text style={styles.timestamp}>
              {isUser ? 'you' : 'nayak'} · {item.time || timestamp()}
            </Text>
          )}
        </View>
      </View>
    )
  }

  return (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={(_, index) => `${index}`}
      renderItem={renderMessage}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onScrollToIndexFailed={({ index }) => {
        listRef.current?.scrollToOffset({
          offset: Math.max(0, index * 100),
          animated: true,
        })
      }}
    />
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  emptyContent: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#f4f4f5',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  emptyDescription: {
    color: '#77778a',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    textAlign: 'center',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },

  messageRow: {
    width: '100%',
    flexDirection: 'row',
  },

  userRow: {
    justifyContent: 'flex-end',
  },

  assistantRow: {
    justifyContent: 'flex-start',
  },

  messageBubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  userBubble: {
    backgroundColor: '#211b3d',
    borderWidth: 1,
    borderColor: '#5946a6',
    borderBottomRightRadius: 4,
  },

  assistantBubble: {
    backgroundColor: '#151522',
    borderWidth: 1,
    borderColor: '#27263f',
    borderBottomLeftRadius: 4,
  },

  interimBubble: {
    backgroundColor: '#25172a',
    borderWidth: 1,
    borderColor: '#8c3d72',
    borderStyle: 'dashed',
  },

  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },

  userText: {
    color: '#f4f4f5',
  },

  interimText: {
    color: '#a1a1b2',
    fontStyle: 'italic',
  },

  bodyText: {
    color: '#f4f4f5',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 6,
  },

  heading1: {
    color: '#f4f4f5',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    marginBottom: 8,
  },

  heading2: {
    color: '#f4f4f5',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    marginBottom: 7,
  },

  heading3: {
    color: '#f4f4f5',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 6,
  },

  markdownSpacer: {
    height: 4,
  },

  userBubbleText: {
    color: '#f4f4f5',
  },

  timestamp: {
    color: '#737387',
    fontSize: 10,
    marginTop: 6,
    fontFamily: 'monospace',
  },
})