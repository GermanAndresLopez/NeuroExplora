import { useState, useEffect, useRef, useCallback } from 'react'
import { REGION_LIST } from '../../data/brainRegions.js'

const REGION_NAMES = REGION_LIST.map(r => r.name)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateCards() {
  const pairs = REGION_NAMES.flatMap(name => [
    { pairId: name, label: name },
    { pairId: name, label: name },
  ])
  return shuffle(pairs).map((card, i) => ({
    ...card,
    id: i,
    isFlipped: false,
    isMatched: false,
  }))
}

export default function MemoryGame({ onScore }) {
  const [phase, setPhase] = useState('idle') // 'idle' | 'playing' | 'checking' | 'won'
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [attempts, setAttempts] = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const checkingRef = useRef(false)

  const startGame = useCallback(() => {
    setCards(generateCards())
    setFlipped([])
    setAttempts(0)
    setMatchedCount(0)
    setElapsed(0)
    setPhase('playing')
    checkingRef.current = false
  }, [])

  // Timer
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  function handleCardClick(index) {
    if (phase !== 'playing') return
    if (checkingRef.current) return
    const card = cards[index]
    if (card.isFlipped || card.isMatched) return

    const newFlipped = [...flipped, index]
    setCards(prev => prev.map((c, i) => i === index ? { ...c, isFlipped: true } : c))
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      checkingRef.current = true
      setAttempts(a => a + 1)
      const [a, b] = newFlipped
      const cardA = cards[a]
      const cardB = cards[index]

      setTimeout(() => {
        if (cardA.pairId === cardB.pairId) {
          setCards(prev => prev.map((c, i) =>
            i === a || i === b ? { ...c, isMatched: true } : c
          ))
          const newMatched = matchedCount + 1
          setMatchedCount(newMatched)
          if (newMatched === REGION_NAMES.length) {
            setPhase('won')
            const finalScore = Math.max(0, 600 - (attempts + 1) * 10 - Math.floor(elapsed / 5))
            onScore?.('memory', finalScore)
          } else {
            setPhase('playing')
          }
        } else {
          setCards(prev => prev.map((c, i) =>
            i === a || i === b ? { ...c, isFlipped: false } : c
          ))
        }
        setFlipped([])
        checkingRef.current = false
        if (phase !== 'won') setPhase('playing')
      }, 900)
    }
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const score = Math.max(0, 600 - attempts * 10 - Math.floor(elapsed / 5))

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Memory Cerebral</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Encuentra los 6 pares de regiones cerebrales. Cuantos menos intentos,
            mayor tu puntaje.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {[
            { icon: '🎯', label: '12 fichas', sub: '6 pares' },
            { icon: '⏱', label: 'Contra reloj', sub: 'cronómetro' },
          ].map(item => (
            <div key={item.label} className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-white text-xs font-semibold">{item.label}</div>
              <div className="text-gray-500 text-xs">{item.sub}</div>
            </div>
          ))}
        </div>
        <button
          onClick={startGame}
          className="w-full max-w-xs py-3.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold rounded-xl transition-colors shadow-lg shadow-cyan-500/30"
        >
          Comenzar
        </button>
      </div>
    )
  }

  if (phase === 'won') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 gap-5">
        <div className="text-5xl">🏆</div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-1">¡Felicitaciones!</h2>
          <p className="text-gray-400 text-sm">Completaste el tablero</p>
        </div>
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          <StatCard label="Intentos" value={attempts} />
          <StatCard label="Tiempo" value={formatTime(elapsed)} />
          <StatCard label="Puntaje" value={score} accent />
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={startGame}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold rounded-xl transition-colors"
          >
            Jugar de nuevo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-800 shrink-0">
        <span className="text-gray-400 text-sm">
          Intentos: <span className="text-white font-semibold">{attempts}</span>
        </span>
        <span className="text-gray-400 text-sm">
          {matchedCount}/6 pares
        </span>
        <span className="text-cyan-400 font-mono text-sm">{formatTime(elapsed)}</span>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-auto p-3">
        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
          {cards.map((card, i) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(i)}
              disabled={card.isFlipped || card.isMatched}
              className={`aspect-[3/4] rounded-lg text-center flex items-center justify-center transition-all duration-300 text-xs font-semibold p-1 leading-tight
                ${card.isMatched
                  ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                  : card.isFlipped
                    ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-300'
                    : 'bg-gray-800 border border-gray-700 text-transparent hover:bg-gray-750 cursor-pointer'
                }`}
            >
              {(card.isFlipped || card.isMatched)
                ? <span className="break-words">{card.label}</span>
                : <span className="text-gray-600 text-lg">?</span>
              }
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
      <div className={`text-lg font-bold ${accent ? 'text-cyan-400' : 'text-white'}`}>{value}</div>
      <div className="text-gray-500 text-xs">{label}</div>
    </div>
  )
}
