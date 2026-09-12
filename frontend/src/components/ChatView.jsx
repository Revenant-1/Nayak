import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { FileText, MessageSquare, Pause, Play, Scale, ThumbsDown, ThumbsUp, Volume2, Mic,Landmark } from 'lucide-react'

function timestamp() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * ChatView
 * --------
 * Renders the full transcript (chat_history.json + anything appended this
 * session). Auto-scrolls to the newest message unless the parent has
 * asked us to focus a specific historical entry (via `focusIndex`, set
 * when the user clicks a sidebar item).
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
}) {
  const bottomRef = useRef(null)
  const itemRefs = useRef({})

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

  if (messages.length === 0 && !interimText) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-10">
        <div className="w-full max-w-3xl text-center">
          <p className="font-mono text-[10px] font-semibold tracking-[0.2em] text-primary">
            YOUR VOICE. YOUR RIGHTS. YOUR LANGUAGE.
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-ink">
            Ask a legal question
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mist">
            Get simple, reliable legal information in your language.
          </p>

          <div className="mt-9 grid grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Scale, 'Legal Q&A', 'Clear answers to everyday legal questions.', 'bg-primary/10 text-primary'],
              [Landmark, 'Government Schemes', 'Find support you may be eligible for.', 'bg-secondary/10 text-secondary'],
              [FileText, 'Document Explanation', 'Understand important documents simply.', 'bg-accent/10 text-accent'],
              [Mic, 'Voice Assistant', 'Ask naturally in your language.', 'bg-primary/10 text-primary'],
            ].map(([Icon, title, description, color]) => (
              <div key={title} className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
                <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                  <Icon size={18} />
                </div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-1 text-xs leading-5 text-mist">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* ─────────────────────────────────────────────
          Ambient background
      ───────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* ─────────────────────────────────────────────
          Messages
      ───────────────────────────────────────────── */}
      <div
        className={`scroll-thin relative z-10 flex h-full flex-1 flex-col space-y-4 overflow-y-auto px-6 py-6 ${
          micOn ? 'pt-[380px]' : ''
        }`}
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const isLatestAssistant =
              m.role === 'assistant' &&
              i === messages.map((message, index) =>
                message.role === 'assistant' ? index : -1,
              ).reduce((latest, index) => Math.max(latest, index), -1)

            return (
              <motion.div
                key={i}
                ref={(el) => (itemRefs.current[i] = el)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
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
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                        <button className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-mist hover:bg-panel-hi hover:text-ink">
                          <Volume2 size={13} /> Listen to answer
                        </button>
                        <button aria-label="Helpful answer" className="rounded-lg border border-line p-1.5 text-mist hover:bg-panel-hi hover:text-primary">
                          <ThumbsUp size={13} />
                        </button>
                        <button aria-label="Not helpful answer" className="rounded-lg border border-line p-1.5 text-mist hover:bg-panel-hi hover:text-error">
                          <ThumbsDown size={13} />
                        </button>
                        <span className="inline-flex items-center gap-1 text-[10px] text-mist">
                          <MessageSquare size={12} /> Sources available
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}

                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="font-mono text-[10px] text-mist">
                      {m.role === 'user' ? 'you' : 'nayak'} ·{' '}
                      {m.time || timestamp()}
                    </p>

                    {isLatestAssistant && speechSpeaking && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={speechPaused ? resumeSpeech : pauseSpeech}
                          title={speechPaused ? 'Resume voice' : 'Pause voice'}
                          aria-label={speechPaused ? 'Resume voice' : 'Pause voice'}
                          className="flex h-7 items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 text-[10px] font-medium text-ink transition hover:border-cyan/40 hover:bg-cyan/10"
                        >
                          {speechPaused ? <Play size={12} /> : <Pause size={12} />}
                          <span>{speechPaused ? 'Resume' : 'Pause'}</span>
                        </button>

                        <button
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

        {/* ─────────────────────────────────────────────
            Live interim speech-to-text preview
        ───────────────────────────────────────────── */}
        {interimText && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
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
