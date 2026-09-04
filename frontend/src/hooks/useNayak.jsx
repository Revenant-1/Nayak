import { useCallback, useEffect, useRef, useState } from 'react'

import { api } from '../lib/api.js'

/**
 * useNayak
 * --------
 * Owns the entire voice & command pipeline:
 *   1. Records audio while the microphone is active.
 *   2. Sends the recording to Whisper for transcription.
 *   3. POSTs the transcript to the FastAPI backend and speaks the reply
 *      with SpeechSynthesis.
 *   4. Also exposes sendTextCommand so the InputBar fallback shares the
 *      exact same pipeline.
 */

export function useNayak({ onExchange, sessionId } = {}) {
  const [status, setStatus] = useState('sleeping')
  const [micOn, setMicOn] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [micLevel, setMicLevel] = useState(0)
  const [error, setError] = useState(null)

  const [speechPaused, setSpeechPaused] = useState(false)
  const [speechSpeaking, setSpeechSpeaking] = useState(false)

  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const statusRef = useRef('sleeping')
  const commandBufferRef = useRef('')

  const micSupported =
    typeof window !== 'undefined' &&
    Boolean(
      navigator.mediaDevices?.getUserMedia &&
        window.MediaRecorder,
    )

  useEffect(() => {
    statusRef.current = status
  }, [status])

  // --------------------------------------------------
  // SPEECH CONTROLS
  // --------------------------------------------------

  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    setSpeechPaused(false)
    setSpeechSpeaking(false)
  }, [])

  const pauseSpeech = useCallback(() => {
    if (
      'speechSynthesis' in window &&
      window.speechSynthesis.speaking &&
      !window.speechSynthesis.paused
    ) {
      window.speechSynthesis.pause()
      setSpeechPaused(true)
    }
  }, [])

  const resumeSpeech = useCallback(() => {
    if (
      'speechSynthesis' in window &&
      window.speechSynthesis.paused
    ) {
      window.speechSynthesis.resume()
      setSpeechPaused(false)
    }
  }, [])

  // --------------------------------------------------
  // SEND COMMAND
  // --------------------------------------------------

  const sendCommand = useCallback(
    async (text) => {
      if (!text?.trim()) return

      // Stop any previous voice response
      stopSpeech()

      setStatus('processing')
      setInterimText('')

      try {
        const data = await api.command({
          text,
          session_id: sessionId,
        })

        const reply =
          data.response ??
          data.reply ??
          data.content ??
          '(backend reply had no recognizable text field)'

        onExchange?.({
          userText: text,
          assistantText: reply,
        })

        setError(null)

        // Speak the reply aloud
        if ('speechSynthesis' in window) {
          const utter =
            new SpeechSynthesisUtterance(reply)

          utter.onstart = () => {
            setSpeechSpeaking(true)
            setSpeechPaused(false)
            setStatus('responding')
          }

          utter.onpause = () => {
            setSpeechPaused(true)
          }

          utter.onresume = () => {
            setSpeechPaused(false)
          }

          utter.onend = () => {
            setSpeechSpeaking(false)
            setSpeechPaused(false)
            setStatus('sleeping')
          }

          utter.onerror = (event) => {
            // Ignore errors caused by cancel/interrupt
            if (event.error !== 'canceled') {
              console.warn(
                '[useNayak] speech error:',
                event.error,
              )
            }

            setSpeechSpeaking(false)
            setSpeechPaused(false)
            setStatus('sleeping')
          }

          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(utter)
        } else {
          setStatus('sleeping')
        }
      } catch (err) {
        console.error(
          '[useNayak] command failed:',
          err,
        )

        setError(
          `Could not reach the Nayak backend: ${err.message}`,
        )

        onExchange?.({
          userText: text,
          assistantText: `Could not reach the backend (${err.message}). Is the Nayak backend running?`,
          isError: true,
        })

        setStatus('sleeping')
      }
    },
    [onExchange, sessionId, stopSpeech],
  )

  // --------------------------------------------------
  // AUDIO RECORDING
  // --------------------------------------------------

  const startListening = useCallback(() => {
    if (!micSupported || recorderRef.current) return

    // Interrupt Nayak if it is speaking
    stopSpeech()

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream)

        chunksRef.current = []

        recorder.ondataavailable = (event) => {
          if (event.data.size) {
            chunksRef.current.push(event.data)
          }
        }

        recorder.onstop = async () => {
          const audio = new Blob(
            chunksRef.current,
            {
              type: recorder.mimeType,
            },
          )

          stream
            .getTracks()
            .forEach((track) => track.stop())

          recorderRef.current = null
          streamRef.current = null

          try {
            const data = await api.transcribe(audio)

            if (!data.text?.trim()) {
              throw new Error(
                'No speech was detected',
              )
            }

            await sendCommand(data.text)
          } catch (err) {
            console.error(
              '[useNayak] transcription failed:',
              err,
            )

            setError(
              `Could not transcribe the recording: ${err.message}`,
            )

            setStatus('sleeping')
          }
        }

        recorderRef.current = recorder
        streamRef.current = stream

        recorder.start()

        setMicOn(true)
        setStatus('listening')
      })
      .catch((err) => {
        setError(
          `Microphone access failed: ${err.message}`,
        )

        setStatus('sleeping')
      })
  }, [micSupported, sendCommand, stopSpeech])

  const stopListening = useCallback(() => {
    const recorder = recorderRef.current

    setMicOn(false)
    setStatus('processing')
    setInterimText('')

    recorder?.stop()
  }, [])

  const toggleMic = useCallback(() => {
    if (micOn) {
      stopListening()
    } else {
      startListening()
    }
  }, [micOn, startListening, stopListening])

  // --------------------------------------------------
  // TEXT COMMAND
  // --------------------------------------------------

  const sendTextCommand = useCallback(
    (text) => sendCommand(text),
    [sendCommand],
  )

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      recorderRef.current?.stop()

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop())

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
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

    // Voice output controls
    speechSpeaking,
    speechPaused,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
  }
}