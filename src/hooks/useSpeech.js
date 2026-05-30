import { useRef, useState, useCallback } from 'react'

export function useSpeech() {
  const utteranceRef = useRef(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const speak = useCallback((text) => {
    if (!supported) return

    // Cancel any current speech
    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 0.88
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // getVoices() called here (inside user gesture callback) is populated on all browsers
    const voices = window.speechSynthesis.getVoices()
    const spanishVoice =
      voices.find(v => v.lang === 'es-ES') ||
      voices.find(v => v.lang === 'es-MX') ||
      voices.find(v => v.lang.startsWith('es'))
    if (spanishVoice) utterance.voice = spanishVoice

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [supported])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [supported])

  return { speak, stop, isSpeaking, supported }
}
