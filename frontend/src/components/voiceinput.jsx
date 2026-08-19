import { useState, useRef, useEffect } from "react";
import SiriOrb from "./SiriOrb";

function VoiceInput({ status, sendTextCommand, addUserMessage }) {
    const [text, setText] = useState("");
    const [listening, setListening] = useState(false);

    const recognitionRef = useRef(null);
    const listeningRef = useRef(false);

    useEffect(() => {
        return () => {
            const r = recognitionRef.current
            recognitionRef.current = null
            listeningRef.current = false
            try { r?.stop() } catch {}
        }
    }, [])

    const startContinuousListening = () => {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (listeningRef.current) return

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        let buffer = ''

        recognition.onstart = () => {
            listeningRef.current = true
            setListening(true)
        }

        recognition.onresult = (event) => {
            let finalChunk = ''
            let interimChunk = ''
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const res = event.results[i]
                const t = res[0].transcript
                if (res.isFinal) finalChunk += t
                else interimChunk += t
            }

            if (finalChunk) {
                buffer = `${buffer} ${finalChunk}`.trim()
                setText(buffer)
                // Immediately append the user's spoken text to the chat
                if (typeof addUserMessage === 'function') addUserMessage(buffer)
                // Send to backend
                if (typeof sendTextCommand === 'function') sendTextCommand(buffer)
                buffer = ''
                setText('')
            } else {
                setText(`${buffer} ${interimChunk}`.trim())
            }
        }

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
        }

        recognition.onend = () => {
            // If the user hasn't toggled listening off and we're not
            // processing a backend request, restart so the orb remains
            // active until explicitly clicked to stop.
            if (listeningRef.current && status !== 'processing') {
                try {
                    recognition.start()
                } catch (err) {
                    console.warn('Failed to restart recognition:', err)
                }
            } else {
                setListening(false)
            }
        }

        recognitionRef.current = recognition
        recognition.start()
    }

    const stopListening = () => {
        listeningRef.current = false
        setListening(false)
        const r = recognitionRef.current
        recognitionRef.current = null
        try { r?.stop() } catch {}
        setText('')
    }

    const toggleListening = () => {
        if (listeningRef.current) stopListening()
        else startContinuousListening()
    }

    // Pause/resume listening around backend processing so the orb doesn't
    // pick up ambient audio while the system is speaking/processing.
    const wasActiveBeforeProcessing = useRef(false)
    useEffect(() => {
        if (status === 'processing') {
            if (listeningRef.current) {
                wasActiveBeforeProcessing.current = true
                // stop recognition temporarily
                try { recognitionRef.current?.stop() } catch {}
                listeningRef.current = false
                setListening(false)
            } else {
                wasActiveBeforeProcessing.current = false
            }
        } else {
            // status is not processing — resume if we paused earlier
            if (wasActiveBeforeProcessing.current) {
                wasActiveBeforeProcessing.current = false
                // restart listening
                startContinuousListening()
            }
        }
    }, [status])

    return (
        <div>
            <button onClick={toggleListening} aria-pressed={listening}>
                {listening ? <SiriOrb state="listening" /> : <SiriOrb state="sleeping" />}
            </button>

        </div>
    );
}

export default VoiceInput;