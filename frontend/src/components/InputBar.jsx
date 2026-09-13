import { useState } from 'react'
import { Send, Mic } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * InputBar
 * --------
 * Text fallback plus the cross-browser audio recorder toggle.
 */
export default function InputBar({ onSend, micActive, onToggleMic, micSupported, disabled, language, languages, onLanguageChange }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-t border-line bg-panel px-4 py-3">
      <button
        type="button"
        onClick={() => !micActive && onToggleMic()}
        disabled={disabled || !micSupported}
        title={
          micSupported
            ? micActive ? t('useOrb') : t('startVoiceInput')
            : t('unsupportedVoice')
        }
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
          micActive
            ? 'border-magenta bg-magenta/20 text-magenta'
            : 'border-line bg-panel-hi text-mist hover:text-ink'
        } ${!micSupported ? 'cursor-not-allowed opacity-40' : ''}`}
      >
        <Mic size={16} />
      </button>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={disabled ? t('processing') : t('askPlaceholder')}
        disabled={disabled}
        className="flex-1 rounded-full border border-line bg-panel-hi px-4 py-2.5 text-sm text-ink placeholder:text-mist focus-visible:outline-cyan disabled:opacity-50"
      />

      <label className="sr-only" htmlFor="input-language">{t('language')}</label>
      <select
        id="input-language"
        value={language}
        onChange={(event) => onLanguageChange(event.target.value)}
        aria-label={t('language')}
        title={t('chooseVoiceLanguage')}
        translate="no"
        className="notranslate max-w-28 rounded-lg border border-line bg-panel-hi px-2 py-2.5 text-xs text-ink outline-none focus:border-cyan"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.code === 'auto' ? t('auto') : item.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-iris text-white transition-opacity hover:opacity-90 disabled:opacity-30"
      >
        <Send size={16} />
      </button>
    </form>
  )
}
