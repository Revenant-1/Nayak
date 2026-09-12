import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Pause, Play, Square } from 'lucide-react'

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
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="font-display text-lg text-ink">
            Ask a legal question
          </p>

          <p className="mt-1 text-sm text-mist">
            Type your query below or tap the microphone — the orb will pulse
            while Nayak listens and processes.
          </p>
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
        {/* Top-left iris glow */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-iris/10 blur-3xl" />

        {/* Bottom-right magenta glow */}
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-magenta/10 blur-3xl" />

        {/* Subtle central glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(124,92,255,0.08),transparent_45%)]" />

        {/* Very subtle technical grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.12)_100%)]" />
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
                      <ReactMarkdown>{m.content}</ReactMarkdown>
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
