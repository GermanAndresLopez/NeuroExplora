import { useState, useCallback } from 'react'
import BottomNav from './components/BottomNav.jsx'
import InicioView from './views/InicioView.jsx'
import GamesView from './views/GamesView.jsx'
import ConfiguracionView from './views/ConfiguracionView.jsx'
import { saveScore } from './hooks/useScores.js'

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
    <div className="fixed inset-0 bg-gray-950 overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="absolute inset-0 bottom-16 overflow-hidden">
        {view === 'inicio' && <InicioView />}
        {view === 'juegos' && <GamesView tab={gameTab} onTabChange={setGameTab} onScore={handleScore} />}
        {view === 'config' && <ConfiguracionView />}
      </div>
      <BottomNav currentView={view} onChange={setView} />
    </div>
  )
}
