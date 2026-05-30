import { lazy, Suspense, useState } from 'react'
import BottomNav from './components/BottomNav.jsx'
import GamesView from './views/GamesView.jsx'
import AboutView from './views/AboutView.jsx'

// Lazy-load ARScene so Three.js only loads when the AR tab is opened
const ARScene = lazy(() => import('./components/ARScene.jsx'))

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Iniciando AR…</p>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('ar')
  const [gameTab, setGameTab] = useState('memory')

  return (
    <div className="fixed inset-0 bg-gray-950 overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Main content area — sits above the fixed BottomNav (h-16) */}
      <div className="absolute inset-0 bottom-16 overflow-hidden">
        {view === 'ar' && (
          <Suspense fallback={<LoadingFallback />}>
            <ARScene />
          </Suspense>
        )}
        {view === 'games' && (
          <GamesView tab={gameTab} onTabChange={setGameTab} />
        )}
        {view === 'about' && (
          <AboutView />
        )}
      </div>

      <BottomNav currentView={view} onChange={setView} />
    </div>
  )
}
