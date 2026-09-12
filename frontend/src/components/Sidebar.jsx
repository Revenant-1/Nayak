import { motion } from 'framer-motion'

import {
  Plus,
  MessageSquare,
  Circle,
  Landmark,
  Scale,
  User,
  FileText,
  Download,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'

/**
 * Sidebar
 * -------
 * ChatGPT-style history panel.
 */
export default function Sidebar({
  history,
  onNewChat,
  activeIndex,
  onSelectEntry,
  onSchemes,
  schemeActive,
  backendOnline,
  onProfile,
  onGrievance,
  onDownload,
  onToggleTheme,
  darkMode,
  onLogout,
  canRaiseGrievance,
}) {
  const entries = history
    .map((msg, i) => ({ ...msg, index: i }))
    .filter((msg) => msg.role === 'user')

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-line bg-panel">

      {/* =====================================================
          NAYAK LOGO
          ===================================================== */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center gap-3">

          {/* Logo mark */}
          <div
            className="
              relative
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-gold/20
              bg-gold/5
            "
          >
            <div className="absolute inset-0 rounded-xl bg-gold/5 blur-md" />

            <Scale
              size={27}
              strokeWidth={1.5}
              className="relative text-gold"
            />
          </div>

          {/* Logo text */}
          <div className="leading-none">
            <h1
              className="
                font-display
                text-[19px]
                font-semibold
                tracking-[0.08em]
                text-ink
              "
            >
              NAYAK
            </h1>

            <p
              className="
                mt-1
                font-mono
                text-[8px]
                font-medium
                uppercase
                tracking-[0.18em]
                text-mist
              "
            >
              Legal Assistant
            </p>
          </div>

        </div>
      </div>

      {/* =====================================================
          ACCOUNT ACTIONS
          ===================================================== */}
      <div className="mt-4 border-t border-line px-3 pt-3">
        <div className="space-y-1">
          <button
            onClick={onProfile}
            className="menu-item flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors"
          >
            <User size={16} />
            <span>Profile</span>
          </button>

          {canRaiseGrievance && (
            <button
              onClick={onGrievance}
              className="menu-item flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors"
            >
              <FileText size={16} />
              <span>Raise grievance</span>
            </button>
          )}

          <button
            onClick={onDownload}
            disabled={history.length === 0}
            className="menu-item flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} />
            <span>Download chat</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="menu-item flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors"
          >
            {darkMode ? (
              <Sun size={16} />
            ) : (
              <Moon size={16} />
            )}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={onLogout}
            className="menu-item flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </div>


      {/* =====================================================
          SCHEMES
          ===================================================== */}
      <div className="px-4 pt-3">
        <button
          onClick={onSchemes}
          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ${
            schemeActive
              ? 'border-cyan/40 bg-cyan/10 text-cyan'
              : 'border-line bg-panel-hi text-mist hover:bg-cyan/10 hover:text-cyan'
          }`}
        >
          <Landmark size={16} />
          <span>Schemes</span>
        </button>
      </div>

      {/* =====================================================
          NEW CHAT
          ===================================================== */}
      <div className="px-4 pt-3">
        <button
          onClick={onNewChat}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-iris/40
            bg-iris/10
            px-3
            py-2.5
            text-sm
            font-medium
            text-ink
            transition-colors
            hover:bg-iris/20
            focus-visible:outline
            focus-visible:outline-2
            focus-visible:outline-cyan
          "
        >
          <Plus size={16} />
          New chat
        </button>
      </div>

      {/* =====================================================
          HISTORY
          ===================================================== */}
      <div className="mt-5 flex-1 overflow-y-auto px-3 pb-3">

        <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-widest text-mist">
          History
        </p>

        {entries.length === 0 && (
          <p className="px-2 py-4 text-sm text-mist">
            No conversations yet. Ask a legal query to begin.
          </p>
        )}

        <ul className="space-y-1">
          {entries.map((entry) => (
            <motion.li
              key={entry.index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <button
                onClick={() => onSelectEntry(entry.index)}
                className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-panel-hi ${
                  activeIndex === entry.index
                    ? 'bg-panel-hi text-ink'
                    : 'text-mist'
                }`}
              >
                <MessageSquare
                  size={14}
                  className="mt-0.5 shrink-0 opacity-60"
                />

                <span className="line-clamp-2">
                  {entry.content}
                </span>
              </button>
            </motion.li>
          ))}
        </ul>

      </div>

      {/* =====================================================
          BACKEND STATUS
          ===================================================== */}
      <div className="flex items-center gap-2 border-t border-line px-5 py-3">

        <Circle
          size={8}
          className={
            backendOnline
              ? 'fill-jade text-jade'
              : 'fill-mist text-mist'
          }
        />

        <span className="font-mono text-[11px] text-mist">
          {backendOnline
            ? 'backend connected'
            : 'backend offline'}
        </span>

      </div>

    </aside>
  )
}