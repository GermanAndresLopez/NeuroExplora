import MemoryGame from '../components/games/MemoryGame.jsx'
import QuizGame from '../components/games/QuizGame.jsx'
import { playClick } from '../hooks/useSound.js'

export default function GamesView({ tab, onTabChange, onScore }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid var(--accent-border)',
        background: 'rgba(13,13,20,0.9)',
        flexShrink: 0,
      }}>
        <p style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.2em', marginBottom: '8px', opacity: 0.7 }}>
          //SCN_02 &nbsp;&gt;&nbsp; MÓDULO JUEGOS
        </p>
        <h1 style={{ fontSize: '1rem', color: '#fff', letterSpacing: '0.1em', marginBottom: '12px' }}>
          JUEGOS
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <TabButton active={tab === 'memory'} onClick={() => { playClick(); onTabChange('memory') }}>MEMORY</TabButton>
          <TabButton active={tab === 'quiz'}   onClick={() => { playClick(); onTabChange('quiz')   }}>QUIZ</TabButton>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {tab === 'memory' && <MemoryGame onScore={onScore} />}
        {tab === 'quiz'   && <QuizGame onScore={onScore} />}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="pixel-btn"
      style={{
        fontSize: '0.65rem',
        padding: '8px 16px',
        background: active ? 'var(--accent-dim)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-dim)',
        border: `1px solid ${active ? 'var(--accent)' : 'rgba(229,108,120,0.2)'}`,
        boxShadow: active ? '2px 2px 0 var(--accent-border)' : 'none',
        letterSpacing: '0.1em',
      }}
    >
      {children}
    </button>
  )
}
