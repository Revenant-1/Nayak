import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  MessageSquare,
  Circle,
  Landmark,
  Scale,
  User,
  FileText,
  Mic,
} from 'lucide-react'

export default function Sidebar({
  sessions = [],
  activeSessionId,
  onNewChat,
  onSelectChat,
  onSchemes,
  schemeActive,
  backendOnline,
  onProfile,
  onVoiceAssistant,
  onDocuments,
}) {
  const { t } = useTranslation()

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-line bg-panel">
      <div className="px-5 pb-2 pt-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
            <div className="absolute inset-0 rounded-xl bg-gold/5 blur-md" />
            <Scale size={27} strokeWidth={1.5} className="relative text-gold" />
          </div>
          <div className="leading-none">
            <h1 className="font-display text-[19px] font-semibold tracking-[0.08em] text-ink">
              NAYAK
            </h1>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-line px-3 pt-3">
        <div className="space-y-1">
          <button onClick={onProfile} className="menu-item flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors">
            <User size={16} />
            <span>{t('profile')}</span>
          </button>
          <button onClick={onSchemes} className={`menu-item flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${schemeActive ? 'border-cyan/40 bg-cyan/10 text-cyan' : ''}`}>
            <Landmark size={16} />
            <span>{t('schemes')}</span>
          </button>
          <button onClick={onDocuments} className="menu-item flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors">
            <FileText size={16} />
            <span>{t('document')}</span>
          </button>
          <button onClick={onVoiceAssistant} className="menu-item flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors">
            <Mic size={16} />
            <span>{t('voiceAssistant')}</span>
          </button>
          <button onClick={onNewChat} className="menu-item flex w-full items-center gap-3 rounded-md bg-primary/10 px-3 py-2.5 text-left text-sm font-medium text-primary">
            <MessageSquare size={16} />
            <span>{t('chat')}</span>
          </button>
        </div>
      </div>

      <div className="px-4 pt-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-iris/40 bg-iris/10 px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-iris/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          <Plus size={16} />
          {t('newChat')}
        </button>
      </div>

      <div className="mt-5 flex-1 overflow-y-auto px-3 pb-3">
        <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-widest text-mist">
          {t('history')}
        </p>

        {sessions.length === 0 && (
          <p className="px-2 py-4 text-sm text-mist">{t('noConversations')}</p>
        )}

        <ul className="space-y-1">
          {sessions.map((session) => (
            <motion.li key={session.session_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button
                onClick={() => onSelectChat(session.session_id)}
                className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-panel-hi ${
                  activeSessionId === session.session_id
                    ? 'bg-panel-hi text-ink'
                    : 'text-mist'
                }`}
              >
                <MessageSquare size={14} className="mt-0.5 shrink-0 opacity-60" />
                <span className="min-w-0">
                  <span className="line-clamp-2">{session.title || 'New chat'}</span>
                  {session.updatedAt && (
                    <span className="mt-0.5 block text-[10px] text-mist/70">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-2 border-t border-line px-5 py-3">
        <Circle size={8} className={backendOnline ? 'fill-jade text-jade' : 'fill-mist text-mist'} />
        <span className="font-mono text-[11px] text-mist">
          {backendOnline ? t('backendConnected') : t('backendOffline')}
        </span>
      </div>
    </aside>
  )
}
