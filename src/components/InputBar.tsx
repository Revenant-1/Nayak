import { useRef, useState } from 'react'
import {
    ActivityIndicator,
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'

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

type InputBarProps = {
    onSend: (text: string) => void | Promise<void>
    disabled?: boolean
    loading?: boolean
    placeholder?: string
    theme: Theme
}

export default function InputBar({
    onSend,
    disabled = false,
    loading = false,
    placeholder = 'Ask Nayak a legal question...',
    theme,
}: InputBarProps) {
    const [text, setText] = useState('')
    const inputRef = useRef<TextInput>(null)

    const canSend =
        text.trim().length > 0 &&
        !disabled &&
        !loading

    async function handleSend() {
        const value = text.trim()

        if (!value || !canSend) {
            return
        }

        setText('')
        Keyboard.dismiss()

        try {
            await onSend(value)
        } catch (error) {
            console.warn('[InputBar] send error:', error)
        }
    }

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.background,
                    borderTopColor: theme.border,
                },
            ]}
        >
            <View
                style={[
                    styles.inputWrapper,
                    {
                        backgroundColor: theme.surfaceHigh,
                        borderColor: theme.border,
                    },
                ]}
            >
                <TextInput
                    ref={inputRef}
                    value={text}
                    onChangeText={setText}
                    placeholder={placeholder}
                    placeholderTextColor={theme.muted}
                    multiline
                    maxLength={4000}
                    editable={!disabled && !loading}
                    autoCorrect
                    autoCapitalize="sentences"
                    blurOnSubmit={false}
                    returnKeyType="default"
                    keyboardType="default"
                    textAlignVertical="top"
                    selectionColor={theme.accent}
                    style={[
                        styles.input,
                        {
                            color: theme.text,
                        },
                    ]}
                    onFocus={() => {
                        // Keep the input available for keyboard interaction.
                    }}
                />

                <Pressable
                    onPress={handleSend}
                    disabled={!canSend}
                    accessibilityRole="button"
                    accessibilityLabel="Send message"
                    style={({ pressed }) => [
                        styles.sendButton,
                        {
                            backgroundColor: canSend
                                ? theme.accentSoft
                                : theme.surface,
                            borderColor: canSend
                                ? theme.accent
                                : theme.border,
                        },
                        !canSend && styles.sendButtonDisabled,
                        pressed &&
                        canSend &&
                        styles.sendButtonPressed,
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator
                            size="small"
                            color={theme.accent}
                        />
                    ) : (
                        <Text
                            style={[
                                styles.sendIcon,
                                {
                                    color: canSend
                                        ? theme.accent
                                        : theme.muted,
                                },
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
        paddingHorizontal: 11,
        paddingTop: 8,
        paddingBottom: 9,
        borderTopWidth: 1,
    },

    inputWrapper: {
        minHeight: 50,
        maxHeight: 145,
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderWidth: 1,
        borderRadius: 18,
        paddingLeft: 14,
        paddingRight: 7,
        paddingVertical: 6,
    },

    input: {
        flex: 1,
        minHeight: 36,
        maxHeight: 130,
        paddingTop: 7,
        paddingBottom: 7,
        paddingRight: 8,
        fontSize: 14,
        lineHeight: 20,
    },

    sendButton: {
        width: 37,
        height: 37,
        marginBottom: 1,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },

    sendButtonDisabled: {
        opacity: 0.55,
    },

    sendButtonPressed: {
        opacity: 0.7,
        transform: [
            {
                scale: 0.96,
            },
        ],
    },

    sendIcon: {
        fontSize: 22,
        fontWeight: '700',
        lineHeight: 24,
    },
})
