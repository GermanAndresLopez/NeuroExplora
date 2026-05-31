import { useState, useCallback, useEffect } from 'react'
import InicioView from './views/InicioView.jsx'
import GamesView from './views/GamesView.jsx'
import ConfiguracionView from './views/ConfiguracionView.jsx'
import { saveScore } from './hooks/useScores.js'
import { startAmbient } from './hooks/useSound.js'

export default function App() {
  const [view, setView]       = useState('inicio')
  const [gameTab, setGameTab] = useState('memory')

  // Request fullscreen on first user gesture (browsers require a gesture)
  useEffect(() => {
    function tryFS() {
      const el = document.documentElement
      const fn = el.requestFullscreen ?? el.webkitRequestFullscreen ?? el.mozRequestFullScreen
      if (fn) fn.call(el)?.catch?.(() => {})
      startAmbient()
      document.removeEventListener('touchstart', tryFS)
      document.removeEventListener('pointerdown', tryFS)
    }
    document.addEventListener('touchstart',  tryFS, { once: true, passive: true })
    document.addEventListener('pointerdown', tryFS, { once: true })
    return () => {
      document.removeEventListener('touchstart',  tryFS)
      document.removeEventListener('pointerdown', tryFS)
    }
  }, [])

  const handleScore = useCallback((game, score) => {
    const user = (() => {
      try { return JSON.parse(localStorage.getItem('ne_user') || 'null')?.name } catch { return null }
    })()
    saveScore({ game, score, user })
  }, [])

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: 'var(--bg)',
        backgroundImage: `
          linear-gradient(rgba(229,108,120,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(229,108,120,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9990] scanlines" />

      <div className="absolute inset-0 overflow-hidden">
        {view === 'inicio'  && <InicioView onNavigate={setView} />}
        {view === 'juegos'  && <GamesView tab={gameTab} onTabChange={setGameTab} onScore={handleScore} onHome={() => setView('inicio')} />}
        {view === 'config'  && <ConfiguracionView onHome={() => setView('inicio')} />}
      </div>
    </div>
  )
}
