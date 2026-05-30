import { useSpeech } from '../hooks/useSpeech.js'

export default function AudioButton({ text, className = '' }) {
  const { speak, stop, isSpeaking, supported } = useSpeech()

  if (!supported) return null

  function handleClick() {
    if (isSpeaking) {
      stop()
    } else {
      speak(text)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isSpeaking
          ? 'bg-cyan-500 text-gray-950 shadow-lg shadow-cyan-500/40'
          : 'bg-gray-800 text-cyan-400 border border-gray-700 hover:border-cyan-500 hover:bg-gray-750'
        } ${className}`}
      aria-label={isSpeaking ? 'Detener audio' : 'Escuchar descripción'}
    >
      {isSpeaking ? (
        <>
          <SpeakerWaveIcon className="w-4 h-4 animate-pulse" />
          <span>Detener</span>
        </>
      ) : (
        <>
          <SpeakerIcon className="w-4 h-4" />
          <span>Escuchar</span>
        </>
      )}
    </button>
  )
}

function SpeakerIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function SpeakerWaveIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}
