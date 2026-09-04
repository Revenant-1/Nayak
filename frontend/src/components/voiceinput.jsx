import SiriOrb from "./SiriOrb";

function VoiceInput({ status, micLevel, onStop }) {
    return (
        <div>
            <button onClick={onStop} disabled={status === 'processing'} aria-label="Send voice recording">
                <SiriOrb state={status === 'processing' ? 'processing' : 'listening'} level={micLevel} />
            </button>
        </div>
    );
}

export default VoiceInput;