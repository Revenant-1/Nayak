import { motion } from 'framer-motion'
import { Plus, MessageSquare, Circle } from 'lucide-react'

const STATUS_COPY = {
  sleeping: { label: 'Sleeping', color: 'bg-mist', text: 'text-mist' },
  listening: { label: 'Listening', color: 'bg-magenta', text: 'text-magenta' },
  processing: { label: 'Processing', color: 'bg-cyan', text: 'text-cyan' },
}

/**
 * Sidebar
 * -------
 * ChatGPT-style history panel. `history` is the array read straight out
 * of chat_history.json: [{ role: 'user' | 'assistant', content }, ...].
 * We surface every user turn as a clickable entry — clicking one scrolls
 * the transcript to that turn (handled by the parent via onSelectEntry).
 */
export default function Sidebar({
  history,
  status,
  onNewChat,
  activeIndex,
  onSelectEntry,
  backendOnline,
}) {
  const entries = history
    .map((msg, i) => ({ ...msg, index: i }))
    .filter((msg) => msg.role === 'user')

  const pill = STATUS_COPY[status] || STATUS_COPY.sleeping

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-line bg-panel">
      {/* Wordmark */}
      <div className="flex items-center gap-2 px-5 pt-6 pb-4">
        <div className="h-2 w-2 rounded-full bg-iris shadow-[0_0_10px_2px_rgba(139,92,246,0.7)]" />
        <div>
          <span className="font-display text-lg font-semibold tracking-wide text-ink block leading-none">NAYAK</span>
          <span className="font-mono text-[10px] text-mist tracking-wider uppercase">Legal Assistant</span>
        </div>
      </div>

      {/* New chat */}
      <div className="px-4">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-iris/40 bg-iris/10 px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-iris/20 focus-visible:outline-cyan"
        >
          <Plus size={16} />
          New chat
        </button>
      </div>

      {/* Status pill */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 rounded-md border border-line bg-panel-hi px-3 py-2">
          <span className={`relative flex h-2 w-2`}>
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${pill.color} opacity-60`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${pill.color}`} />
          </span>
          <span className={`font-mono text-xs uppercase tracking-widest ${pill.text}`}>{pill.label}</span>
        </div>
      </div>

      {/* History */}
      <div className="mt-5 flex-1 overflow-y-auto scroll-thin px-3 pb-3">
        <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-widest text-mist">History</p>
        {entries.length === 0 && (
          <p className="px-2 py-4 text-sm text-mist">No conversations yet. Ask a legal query to begin.</p>
        )}
        <ul className="space-y-1">
          {entries.map((entry) => (
            <motion.li key={entry.index} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button
                onClick={() => onSelectEntry(entry.index)}
                className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-panel-hi ${
                  activeIndex === entry.index ? 'bg-panel-hi text-ink' : 'text-mist'
                }`}
              >
                <MessageSquare size={14} className="mt-0.5 shrink-0 opacity-60" />
                <span className="line-clamp-2">{entry.content}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Backend connection indicator */}
      <div className="flex items-center gap-2 border-t border-line px-5 py-3">
        <Circle
          size={8}
          className={backendOnline ? 'fill-jade text-jade' : 'fill-mist text-mist'}
        />
        <span className="font-mono text-[11px] text-mist">
          {backendOnline ? 'backend connected' : 'backend offline'}
        </span>
      </div>
    </aside>
  )
}
