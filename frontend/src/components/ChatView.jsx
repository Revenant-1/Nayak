import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { motion, AnimatePresence } from 'framer-motion'

import ReactMarkdown from 'react-markdown'

import {
  FileText,
  MessageSquare,
  Pause,
  Play,
  Scale,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  Mic,
  Landmark,
} from 'lucide-react'

function timestamp() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * ChatView
 * --------
 * Renders the full transcript and empty-state cards.
 * Supports interactive Legal Q&A, Schemes, Document Upload,
 * Voice Assistant, answer actions, and sources.
 */
export default function ChatView({
  messages,
  focusIndex,
  interimText,
  speechSpeaking,
  speechPaused,
  pauseSpeech,
  resumeSpeech,
  stopSpeech,
  micOn,

  // Home card actions
  onLegalQA,
  onSchemes,
  onToggleMic,
}) {
  const { t } = useTranslation()
  const bottomRef = useRef(null)
  const itemRefs = useRef({})
  const documentInputRef = useRef(null)

  // Answer action state
  const [feedback, setFeedback] = useState({})
  const [openSources, setOpenSources] = useState({})

  useEffect(() => {
    if (focusIndex != null && itemRefs.current[focusIndex]) {
      itemRefs.current[focusIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    } else {
      bottomRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      })
    }
  }, [messages, focusIndex, interimText])

  // Stop browser speech when the component unmounts.
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const listenToAnswer = (content, index) => {
    if (!('speechSynthesis' in window)) {
      return
    }

    const synth = window.speechSynthesis

    // Clicking the active "Stop listening" button stops speech.
    if (synth.speaking) {
      synth.cancel()
      return
    }

    const cleanText = content
      .replace(/[#*_>`~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim()

    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)

    utterance.onstart = () => {
      setFeedback((prev) => ({
        ...prev,
        [`speaking-${index}`]: true,
      }))
    }

    utterance.onend = () => {
      setFeedback((prev) => ({
        ...prev,
        [`speaking-${index}`]: false,
      }))
    }

    utterance.onerror = () => {
      setFeedback((prev) => ({
        ...prev,
        [`speaking-${index}`]: false,
      }))
    }

    synth.cancel()
    synth.speak(utterance)
  }

  const handleFeedback = (index, value) => {
    setFeedback((prev) => ({
      ...prev,
      [index]: prev[index] === value ? null : value,
    }))
  }

  const getSources = (message) => {
    if (Array.isArray(message?.sources)) return message.sources
    if (Array.isArray(message?.source)) return message.source
    return []
  }

  const toggleSources = (index) => {
    setOpenSources((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  /*
   * =========================================================
   * EMPTY CHAT / HOME SCREEN
   * =========================================================
   */
  if (messages.length === 0 && !interimText) {
    const cards = [
      {
        Icon: Scale,
        title: t('legalQa'),
        description: t('legalQaDescription'),
        color: 'bg-primary/10 text-primary',
        action: onLegalQA,
      },
      {
        Icon: Landmark,
        title: t('schemes'),
        description: t('schemesDescription'),
        color: 'bg-secondary/10 text-secondary',
        action: onSchemes,
      },
      {
        Icon: FileText,
        title: t('documentExplanation'),
        description: t('documentDescription'),
        color: 'bg-accent/10 text-accent',
        action: () => documentInputRef.current?.click(),
      },
      {
        Icon: Mic,
        title: t('voiceAssistant'),
        description: t('voiceDescription'),
        color: 'bg-primary/10 text-primary',
        action: onToggleMic,
      },
    ]

    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-10">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* Welcome content.
            It moves away when the orb/voice mode is active so nothing
            underneath can visually collide with the orb. */}
        <motion.div
          animate={
            micOn
              ? {
                  opacity: 0,
                  y: 90,
                  scale: 0.97,
                }
              : {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }
          }
          transition={{
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative z-10 w-full max-w-3xl text-center"
          style={{
            pointerEvents: micOn ? 'none' : 'auto',
          }}
        >
          <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-primary">
            {t('voiceTagline')}
          </p>

          <h2 className="mt-3 font-display text-3xl font-semibold text-ink">
            {t('askLegalQuestion')}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mist">
            {t('legalInformation')}
          </p>

          {/* Hidden document picker */}
          <input
            ref={documentInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]

              if (file) {
                console.log('Selected document:', file.name)
              }

              // Allow selecting the same file again.
              e.target.value = ''
            }}
          />

          {/* Interactive cards */}
          <div className="mt-9 grid grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(
              ({
                Icon,
                title,
                description,
                color,
                action,
              }) => (
                <motion.button
                  key={title}
                  type="button"
                  onClick={action}
                  whileHover={{
                    y: -6,
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="
                    group
                    rounded-2xl
                    border
                    border-line
                    bg-panel
                    p-4
                    text-left
                    shadow-sm
                    transition-shadow
                    duration-300
                    hover:border-primary/30
                    hover:bg-panel-hi
                    hover:shadow-lg
                  "
                >
                  <motion.div
                    whileHover={{
                      scale: 1.1,
                      rotate: 2,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 15,
                    }}
                    className={`
                      mb-4
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      ${color}
                    `}
                  >
                    <Icon size={18} />
                  </motion.div>

                  <p className="text-sm font-semibold text-ink transition-colors duration-300 group-hover:text-primary">
                    {title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-mist">
                    {description}
                  </p>
                </motion.button>
              ),
            )}
          </div>
        </motion.div>

        {/* Dedicated voice-mode area.
            This reserves the upper area for your orb and keeps the
            welcome cards completely out of its way. */}
        <AnimatePresence>
          {micOn && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.82,
                y: -20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.82,
                y: -20,
              }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
            >
              <div className="mt-8 flex h-[330px] w-[330px] items-end justify-center rounded-full">
                <div className="mb-4 text-center">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    Voice mode
                  </p>
                  <p className="mt-2 text-sm font-medium text-mist">
                    Listening...
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  /*
   * =========================================================
   * CHAT MESSAGES
   * =========================================================
   */
  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Messages */}
      <div
        className={`scroll-thin relative z-10 flex h-full flex-1 flex-col space-y-4 overflow-y-auto px-6 py-6 ${
          micOn ? 'pt-[380px]' : ''
        }`}
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const isLatestAssistant =
              m.role === 'assistant' &&
              i ===
                messages
                  .map((message, index) =>
                    message.role === 'assistant' ? index : -1,
                  )
                  .reduce(
                    (latest, index) => Math.max(latest, index),
                    -1,
                  )

            const sources = getSources(m)
            const isSpeaking = feedback[`speaking-${i}`] === true
            const currentFeedback = feedback[i]

            return (
              <motion.div
                key={i}
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.25,
                }}
                className={`flex ${
                  m.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-sm border border-iris/30 bg-iris/20 text-ink backdrop-blur-sm'
                      : 'rounded-bl-sm border border-line bg-panel-hi/90 text-ink backdrop-blur-sm'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <div className="markdown-content">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        Relevant legal information
                      </p>

                      <ReactMarkdown>
                        {m.content}
                      </ReactMarkdown>

                      {/* Answer actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            listenToAnswer(m.content, i)
                          }
                          title={
                            isSpeaking
                              ? 'Stop listening'
                              : 'Listen to answer'
                          }
                          aria-label={
                            isSpeaking
                              ? 'Stop listening'
                              : 'Listen to answer'
                          }
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all duration-200 ${
                            isSpeaking
                              ? 'border-primary/30 bg-primary/10 text-primary'
                              : 'border-line text-mist hover:bg-panel-hi hover:text-ink'
                          }`}
                        >
                          <Volume2 size={13} />
                          {isSpeaking
                            ? 'Stop listening'
                            : 'Listen to answer'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleFeedback(i, 'up')
                          }
                          aria-label="Helpful answer"
                          aria-pressed={currentFeedback === 'up'}
                          title="Helpful"
                          className={`rounded-lg border p-1.5 transition-all duration-200 ${
                            currentFeedback === 'up'
                              ? 'border-primary/30 bg-primary/10 text-primary'
                              : 'border-line text-mist hover:bg-panel-hi hover:text-primary'
                          }`}
                        >
                          <ThumbsUp size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleFeedback(i, 'down')
                          }
                          aria-label="Not helpful answer"
                          aria-pressed={currentFeedback === 'down'}
                          title="Not helpful"
                          className={`rounded-lg border p-1.5 transition-all duration-200 ${
                            currentFeedback === 'down'
                              ? 'border-error/30 bg-error/10 text-error'
                              : 'border-line text-mist hover:bg-panel-hi hover:text-error'
                          }`}
                        >
                          <ThumbsDown size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSources(i)}
                          aria-expanded={openSources[i] || false}
                          className={`inline-flex items-center gap-1 text-[10px] transition-colors ${
                            openSources[i]
                              ? 'text-primary'
                              : 'text-mist hover:text-ink'
                          }`}
                        >
                          <MessageSquare size={12} />
                          {sources.length > 0
                            ? `${sources.length} ${
                                sources.length === 1
                                  ? 'source'
                                  : 'sources'
                              }`
                            : 'Sources available'}
                        </button>
                      </div>

                      {/* Sources panel */}
                      <AnimatePresence initial={false}>
                        {openSources[i] && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              height: 0,
                              y: -4,
                            }}
                            animate={{
                              opacity: 1,
                              height: 'auto',
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              height: 0,
                              y: -4,
                            }}
                            transition={{
                              duration: 0.2,
                            }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 rounded-xl border border-line bg-panel/70 p-3">
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
                                Sources
                              </p>

                              {sources.length > 0 ? (
                                <ul className="space-y-2">
                                  {sources.map(
                                    (source, sourceIndex) => (
                                      <li
                                        key={sourceIndex}
                                        className="text-xs leading-5 text-mist"
                                      >
                                        <span className="mr-1 font-mono text-[10px] text-primary">
                                          {sourceIndex + 1}.
                                        </span>
                                        {typeof source === 'string'
                                          ? source
                                          : source?.title ||
                                            source?.name ||
                                            source?.text ||
                                            JSON.stringify(source)}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              ) : (
                                <p className="text-xs leading-5 text-mist">
                                  No source details were attached to
                                  this answer.
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">
                      {m.content}
                    </p>
                  )}

                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="font-mono text-[10px] text-mist">
                      {m.role === 'user' ? 'you' : 'nayak'}{' '}
                      · {m.time || timestamp()}
                    </p>

                    {isLatestAssistant && speechSpeaking && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={
                            speechPaused
                              ? resumeSpeech
                              : pauseSpeech
                          }
                          title={
                            speechPaused
                              ? 'Resume voice'
                              : 'Pause voice'
                          }
                          aria-label={
                            speechPaused
                              ? 'Resume voice'
                              : 'Pause voice'
                          }
                          className="flex h-7 items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 text-[10px] font-medium text-ink transition hover:border-cyan/40 hover:bg-cyan/10"
                        >
                          {speechPaused ? (
                            <Play size={12} />
                          ) : (
                            <Pause size={12} />
                          )}

                          <span>
                            {speechPaused ? 'Resume' : 'Pause'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={stopSpeech}
                          title="Stop voice"
                          aria-label="Stop voice"
                          className="flex h-7 items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 text-[10px] font-medium text-red-500 transition hover:bg-red-500/20"
                        >
                          <Square size={11} />
                          <span>Stop</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Live interim speech-to-text preview */}
        {interimText && (
          <motion.div
            initial={{
              opacity: 0,
              y: 5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="flex justify-end"
          >
            <div className="max-w-[70%] rounded-2xl rounded-br-sm border border-dashed border-magenta/40 bg-magenta/10 px-4 py-2.5 text-sm italic text-mist backdrop-blur-sm">
              {interimText}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
