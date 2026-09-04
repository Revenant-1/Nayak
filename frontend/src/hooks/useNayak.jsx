import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'

/**
 * useNayak
 * --------
 * Owns the entire voice & command pipeline:
 *   1. Records audio while the microphone is active.
 *   2. Sends the recording to Whisper for transcription.
 *   3. POSTs the transcript to the FastAPI backend and speaks the reply back
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

  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const statusRef = useRef('sleeping')
  const commandBufferRef = useRef('')
  const micSupported = typeof window !== 'undefined' && Boolean(
    navigator.mediaDevices?.getUserMedia && window.MediaRecorder,
  )

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

  // ---- audio recording lifecycle ----------------------------------------
  const startListening = useCallback(() => {
    if (!micSupported || recorderRef.current) return
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data)
      recorder.onstop = async () => {
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType })
        stream.getTracks().forEach((track) => track.stop())
        recorderRef.current = null
        streamRef.current = null
        try {
          const data = await api.transcribe(audio)
          if (!data.text?.trim()) throw new Error('No speech was detected')
          await sendCommand(data.text)
        } catch (err) {
          console.error('[useNayak] transcription failed:', err)
          setError(`Could not transcribe the recording: ${err.message}`)
          setStatus('sleeping')
        }
      }
      recorderRef.current = recorder
      streamRef.current = stream
      recorder.start()
      setMicOn(true)
      setStatus('listening')
    }).catch((err) => {
      setError(`Microphone access failed: ${err.message}`)
      setStatus('sleeping')
    })
  }, [micSupported, sendCommand])

  const stopListening = useCallback(() => {
    const recorder = recorderRef.current
    setMicOn(false)
    setStatus('processing')
    setInterimText('')
    recorder?.stop()
  }, [])

  const toggleMic = useCallback(() => {
    if (micOn) stopListening()
    else startListening()
  }, [micOn, startListening, stopListening])

  // Manual text command from InputBar — shares the exact same pipeline.
  const sendTextCommand = useCallback((text) => sendCommand(text), [sendCommand])

  useEffect(() => {
    return () => {
      recorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
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
