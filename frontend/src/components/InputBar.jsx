import { useState } from 'react'
import { Send, Mic, MicOff } from 'lucide-react'

/**
 * InputBar
 * --------
 * Text fallback for when voice isn't preferred, plus a toggle for the
 * always-listening wake-word mic. Disabled gracefully when the browser
 * doesn't support the Web Speech API.
 */
export default function InputBar({ onSend, micActive, onToggleMic, micSupported, disabled }) {
  const [value, setValue] = useState('')
  const [listening, setListening] = useState(false)

  const startOneShotListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.")
      return
    }

    if (listening) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setValue(transcript)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setListening(false)
    }

    recognition.onend = () => setListening(false)

    recognition.start()
  }

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
        onClick={startOneShotListening}
        disabled={!micSupported}
        title={
          micSupported
            ? listening
              ? 'Listening… click again to stop'
              : 'Start voice input'
            : 'Voice input isn\u2019t supported in this browser — try Chrome or Edge'
        }
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
          listening
            ? 'border-magenta bg-magenta/20 text-magenta'
            : 'border-line bg-panel-hi text-mist hover:text-ink'
        } ${!micSupported ? 'cursor-not-allowed opacity-40' : ''}`}
      >
        {listening ? <Mic size={16} /> : <MicOff size={16} />}
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
