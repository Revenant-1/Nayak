import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * ChatView
 * --------
 * Renders the full transcript (chat_history.json + anything appended this
 * session). Auto-scrolls to the newest message unless the parent has
 * asked us to focus a specific historical entry (via `focusIndex`, set
 * when the user clicks a sidebar item).
 */
export default function ChatView({ messages, focusIndex, interimText }) {
  const bottomRef = useRef(null)
  const itemRefs = useRef({})

  useEffect(() => {
    if (focusIndex != null && itemRefs.current[focusIndex]) {
      itemRefs.current[focusIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, focusIndex, interimText])

  if (messages.length === 0 && !interimText) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="font-display text-lg text-ink">Ask a legal question</p>
          <p className="mt-1 text-sm text-mist">
            Type your query below or tap the microphone — the orb will pulse while Nayak listens and processes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="scroll-thin flex-1 space-y-4 overflow-y-auto px-6 py-6">
      <AnimatePresence initial={false}>
        {messages.map((m, i) => (
          <motion.div
            key={i}
            ref={(el) => (itemRefs.current[i] = el)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-iris/20 text-ink border border-iris/30 rounded-br-sm'
                  : 'bg-panel-hi text-ink border border-line rounded-bl-sm'
              }`}
            >
              {m.role === 'assistant' ? (
                <div className="markdown-content">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
              <p className="mt-1 font-mono text-[10px] text-mist">
                {m.role === 'user' ? 'you' : 'nayak'} · {m.time || timestamp()}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Live interim speech-to-text preview while the mic is capturing */}
      {interimText && (
        <div className="flex justify-end">
          <div className="max-w-[70%] rounded-2xl rounded-br-sm border border-dashed border-magenta/40 bg-magenta/10 px-4 py-2.5 text-sm italic text-mist">
            {interimText}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
