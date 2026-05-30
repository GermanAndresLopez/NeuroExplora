import { useState, useCallback } from 'react'
import BottomNav from './components/BottomNav.jsx'
import InicioView from './views/InicioView.jsx'
import GamesView from './views/GamesView.jsx'
import ConfiguracionView from './views/ConfiguracionView.jsx'
import { saveScore } from './hooks/useScores.js'

const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function App() {
  const [view, setView]       = useState('inicio')
  const [gameTab, setGameTab] = useState('memory')

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

      {/* Content area — full height on mobile (no nav), offset on desktop */}
      <div className={`absolute inset-0 ${IS_MOBILE ? '' : 'bottom-14'} overflow-hidden`}>
        {view === 'inicio'  && <InicioView onNavigate={setView} />}
        {view === 'juegos'  && <GamesView tab={gameTab} onTabChange={setGameTab} onScore={handleScore} onHome={() => setView('inicio')} />}
        {view === 'config'  && <ConfiguracionView onHome={() => setView('inicio')} />}
      </div>

      {!IS_MOBILE && <BottomNav currentView={view} onChange={setView} />}
    </div>
  )
}
