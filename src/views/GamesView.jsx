import MemoryGame from '../components/games/MemoryGame.jsx'
import QuizGame from '../components/games/QuizGame.jsx'

export default function GamesView({ tab, onTabChange, onScore }) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-gray-800/80">
        <h1 className="text-xl font-bold text-white mb-3">Juegos</h1>
        <div className="flex gap-2">
          <TabButton active={tab === 'memory'} onClick={() => onTabChange('memory')}>
            Memory
          </TabButton>
          <TabButton active={tab === 'quiz'} onClick={() => onTabChange('quiz')}>
            Quiz
          </TabButton>
        </div>
      </div>

      {/* Game content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {tab === 'memory' && <MemoryGame onScore={onScore} />}
        {tab === 'quiz' && <QuizGame onScore={onScore} />}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200
        ${active
          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200'
        }`}
    >
      {children}
    </button>
  )
}
