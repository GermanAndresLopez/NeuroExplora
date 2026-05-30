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
  return shuffle(pairs).map((card, i) => ({ ...card, id: i, isFlipped: false, isMatched: false }))
}

export default function MemoryGame({ onScore }) {
  const [phase, setPhase]             = useState('idle')
  const [cards, setCards]             = useState([])
  const [flipped, setFlipped]         = useState([])
  const [attempts, setAttempts]       = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [elapsed, setElapsed]         = useState(0)
  const timerRef                      = useRef(null)
  const checkingRef                   = useRef(false)

  const startGame = useCallback(() => {
    setCards(generateCards())
    setFlipped([])
    setAttempts(0)
    setMatchedCount(0)
    setElapsed(0)
    setPhase('playing')
    checkingRef.current = false
  }, [])

  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  function handleCardClick(index) {
    if (phase !== 'playing' || checkingRef.current) return
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
          setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, isMatched: true } : c))
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
          setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, isFlipped: false } : c))
        }
        setFlipped([])
        checkingRef.current = false
        if (phase !== 'won') setPhase('playing')
      }, 900)
    }
  }

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const score = Math.max(0, 600 - attempts * 10 - Math.floor(elapsed / 5))

  if (phase === 'idle') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '0.75rem', color: '#fff', letterSpacing: '0.1em', marginBottom: '12px' }}>MEMORY</h2>
          <p style={{ fontSize: '0.45rem', color: 'var(--text-dim)', lineHeight: 2, fontFamily: "'Courier New', monospace" }}>
            Encuentra los 6 pares de regiones cerebrales.<br />Cuantos menos intentos, mayor tu puntaje.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '260px' }}>
          <InfoCard icon="12" label="FICHAS" sub="6 PARES" />
          <InfoCard icon="⏱" label="RELOJ" sub="CRONÓMETRO" />
        </div>
        <button
          onClick={startGame}
          className="pixel-btn"
          style={{
            width: '100%', maxWidth: '260px',
            padding: '14px',
            fontSize: '0.65rem',
            background: 'var(--accent)',
            color: '#050508',
            border: '2px solid var(--accent)',
            boxShadow: '4px 4px 0 var(--accent-border)',
            letterSpacing: '0.1em',
          }}
        >
          &gt; COMENZAR
        </button>
      </div>
    )
  }

  if (phase === 'won') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.5rem', color: 'var(--accent)', letterSpacing: '0.2em', marginBottom: '8px' }}>
            // COMPLETADO
          </p>
          <h2 style={{ fontSize: '0.8rem', color: '#fff', letterSpacing: '0.1em', marginBottom: '4px' }}>VICTORIA</h2>
          <p style={{ fontSize: '0.4rem', color: 'var(--text-dim)', fontFamily: "'Courier New', monospace" }}>
            Todos los pares encontrados
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '100%', maxWidth: '280px' }}>
          <StatCard label="INTENTOS" value={attempts} />
          <StatCard label="TIEMPO"   value={formatTime(elapsed)} />
          <StatCard label="PUNTAJE"  value={score} accent />
        </div>
        <button
          onClick={startGame}
          className="pixel-btn"
          style={{
            width: '100%', maxWidth: '280px',
            padding: '12px',
            fontSize: '0.6rem',
            background: 'var(--accent)',
            color: '#050508',
            border: '2px solid var(--accent)',
            boxShadow: '4px 4px 0 var(--accent-border)',
          }}
        >
          &gt; DE NUEVO
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Stats */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid var(--accent-border)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.4rem', color: 'var(--text-dim)' }}>
          INTENTOS: <span style={{ color: '#fff' }}>{attempts}</span>
        </span>
        <span style={{ fontSize: '0.4rem', color: 'var(--text-dim)' }}>
          {matchedCount}/6 PARES
        </span>
        <span style={{ fontSize: '0.4rem', color: 'var(--accent)', fontFamily: 'monospace' }}>
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Cards grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px', maxWidth: '340px', margin: '0 auto',
        }}>
          {cards.map((card, i) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(i)}
              disabled={card.isFlipped || card.isMatched}
              style={{
                aspectRatio: '3/4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.35rem',
                fontFamily: "'Courier New', monospace",
                fontWeight: 'bold',
                padding: '4px',
                lineHeight: 1.4,
                textAlign: 'center',
                cursor: card.isFlipped || card.isMatched ? 'default' : 'pointer',
                border: card.isMatched
                  ? '1px solid #50e3b0'
                  : card.isFlipped
                    ? '1px solid var(--accent)'
                    : '1px solid rgba(229,108,120,0.2)',
                background: card.isMatched
                  ? 'rgba(80,227,176,0.1)'
                  : card.isFlipped
                    ? 'var(--accent-dim)'
                    : 'var(--surface)',
                color: card.isMatched
                  ? '#50e3b0'
                  : card.isFlipped
                    ? 'var(--accent)'
                    : 'transparent',
                transition: 'all 0.3s',
              }}
            >
              {(card.isFlipped || card.isMatched)
                ? <span style={{ wordBreak: 'break-word' }}>{card.label}</span>
                : <span style={{ color: 'rgba(229,108,120,0.3)', fontSize: '1rem' }}>?</span>
              }
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon, label, sub }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--accent-border)',
      padding: '12px 8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '0.4rem', color: '#fff', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: '0.35rem', color: 'var(--text-dim)', marginTop: '2px', fontFamily: "'Courier New', monospace" }}>{sub}</div>
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${accent ? 'var(--accent-border)' : 'rgba(229,108,120,0.15)'}`,
      padding: '10px 6px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.7rem', color: accent ? 'var(--accent)' : '#fff', fontFamily: "'Courier New', monospace" }}>
        {value}
      </div>
      <div style={{ fontSize: '0.35rem', color: 'var(--text-dim)', marginTop: '4px', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </div>
  )
}
