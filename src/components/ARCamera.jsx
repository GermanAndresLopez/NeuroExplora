import { useEffect } from 'react'

export default function ARCamera({ onExit }) {
  // Listen for exit message from ar.html iframe
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type === 'arExit') onExit()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onExit])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <iframe
        src="/ar.html"
        title="NeuroExplora AR"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        allow="camera; gyroscope; accelerometer; autoplay"
      />
    </div>
  )
}
