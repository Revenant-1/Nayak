import { useState } from 'react'
import { Send, Mic } from 'lucide-react'

/**
 * InputBar
 * --------
 * Text fallback plus the cross-browser audio recorder toggle.
 */
export default function InputBar({ onSend, micActive, onToggleMic, micSupported, disabled }) {
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
            ? micActive ? 'Use the orb to send the recording' : 'Start voice input'
            : 'Voice input is not supported in this browser'
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
        placeholder={disabled ? 'Nayak is processing…' : 'Ask a legal question or type a query…'}
        disabled={disabled}
        className="flex-1 rounded-full border border-line bg-panel-hi px-4 py-2.5 text-sm text-ink placeholder:text-mist focus-visible:outline-cyan disabled:opacity-50"
      />

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
