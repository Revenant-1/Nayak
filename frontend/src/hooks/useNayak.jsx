import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'

// Talks directly to the FastAPI backend described in INTEGRATION.md.
// Override with VITE_API_BASE_URL in a .env file for other environments.
const SILENCE_TIMEOUT_MS = 1400 // pause length that closes out a captured command

/**
 * useNayak
 * --------
 * Owns the entire voice & command pipeline:
 *   1. Continuous Web Speech API recognition while the microphone is active.
 *   2. Buffers speech until a pause, then treats that buffer as the command.
 *   3. POSTs the command to the FastAPI backend and speaks the reply back
 *      with SpeechSynthesis.
 *   4. Also exposes `sendTextCommand` so the InputBar fallback shares the
 *      exact same pipeline.
 *
 * `onExchange({ userText, assistantText })` is called after every
 * successful (or failed) round trip so the parent can append it to the
 * transcript.
 */
export function useNayak({ onExchange, sessionId } = {}) {
  const [status, setStatus] = useState('sleeping') // 'sleeping' | 'listening' | 'processing'
  const [micOn, setMicOn] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [micLevel, setMicLevel] = useState(0)
  const [error, setError] = useState(null)

  const recognitionRef = useRef(null)
  const statusRef = useRef('sleeping')
  const commandBufferRef = useRef('')
  const silenceTimerRef = useRef(null)
  const audioCtxRef = useRef(null)
  const levelRafRef = useRef(null)

  const SpeechRecognitionImpl =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const micSupported = Boolean(SpeechRecognitionImpl)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  // ---- send a finished command to the backend --------------------
  const sendCommand = useCallback(
    async (text) => {
      if (!text?.trim()) return
      setStatus('processing')
      setInterimText('')
      try {
        const data = await api.command({ text, session_id: sessionId })
        const reply = data.response ?? data.reply ?? data.content ?? '(backend reply had no recognizable text field)'

        onExchange?.({ userText: text, assistantText: reply })
        setError(null)

        // Speak the reply aloud to complete the voice-assistant loop.
        if ('speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(reply)
          utter.onend = () => setStatus('sleeping')
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(utter)
        } else {
          setStatus('sleeping')
        }
      } catch (err) {
        console.error('[useNayak] command failed:', err)
        setError(`Could not reach the Nayak backend: ${err.message}`)
        onExchange?.({
          userText: text,
          assistantText: `Could not reach the backend (${err.message}). Is the Nayak backend running?`,
          isError: true,
        })
        setStatus('sleeping')
      }
    },
    [onExchange, sessionId],
  )

  // ---- optional mic amplitude via Web Audio, purely cosmetic -----------
  const startLevelMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioCtxRef.current = ctx

      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setMicLevel(Math.min(avg / 128, 1))
        levelRafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch (err) {
      console.warn('[useNayak] mic level metering unavailable:', err.message)
    }
  }, [])

  const stopLevelMeter = useCallback(() => {
    cancelAnimationFrame(levelRafRef.current)
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    setMicLevel(0)
  }, [])

  // ---- speech recognition lifecycle -------------------------------------
  const startListening = useCallback(() => {
    if (!micSupported || recognitionRef.current) return
    const recognition = new SpeechRecognitionImpl()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let finalChunk = ''
      let interimChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) finalChunk += chunk
        else interimChunk += chunk
      }

      if (statusRef.current === 'sleeping') {
        setStatus('listening')
        statusRef.current = 'listening'
}
      if (statusRef.current === 'listening') {
        if (finalChunk) {
          commandBufferRef.current = `${commandBufferRef.current} ${finalChunk}`.trim()
        }
        setInterimText(`${commandBufferRef.current} ${interimChunk}`.trim())

        // Every new speech chunk resets the pause timer; once speech
        // stops for SILENCE_TIMEOUT_MS, the buffered text is the command.
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(() => {
          const finalText = commandBufferRef.current.trim()
          commandBufferRef.current = ''
          setInterimText('')
          if (finalText) sendCommand(finalText)
          else setStatus('sleeping')
        }, SILENCE_TIMEOUT_MS)
      }
    }

    recognition.onerror = (event) => {
      console.warn('[useNayak] recognition error:', event.error)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone access was blocked — check your browser permissions.')
        setMicOn(false)
        recognitionRef.current = null
      }
    }

    // Chrome silently ends `continuous` recognition after a while;
    // restart it automatically unless the user explicitly turned it off.
    recognition.onend = () => {
      if (recognitionRef.current) {
        try {
          recognition.start()
        } catch {
          /* already starting — safe to ignore */
        }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setMicOn(true)
    startLevelMeter()
  }, [SpeechRecognitionImpl, micSupported, sendCommand, startLevelMeter])

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current
    recognitionRef.current = null // tells onend not to auto-restart
    recognition?.stop()
    setMicOn(false)
    setStatus('sleeping')
    clearTimeout(silenceTimerRef.current)
    commandBufferRef.current = ''
    setInterimText('')
    stopLevelMeter()
  }, [stopLevelMeter])

  const toggleMic = useCallback(() => {
    if (micOn) stopListening()
    else startListening()
  }, [micOn, startListening, stopListening])

  // Manual text command from InputBar — shares the exact same pipeline.
  const sendTextCommand = useCallback((text) => sendCommand(text), [sendCommand])

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current
      recognitionRef.current = null
      recognition?.stop()
      clearTimeout(silenceTimerRef.current)
      stopLevelMeter()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    status,
    micOn,
    micSupported,
    micLevel,
    interimText,
    error,
    toggleMic,
    sendTextCommand,
  }
}
