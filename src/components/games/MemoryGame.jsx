import { useState, useEffect, useRef, useCallback } from 'react'
import { REGION_LIST } from '../../data/brainRegions.js'
import { playClick, playMatch, playMiss, playSuccess } from '../../hooks/useSound.js'

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

// SVG icons for each brain region — no emojis, clean stroke-based
function BrainIcon({ name, size = 38, color = 'currentColor' }) {
  const p = {
    width: size, height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { display: 'block' },
  }
  switch (name) {
    case 'Lóbulo Frontal': // Lightbulb — reasoning & planning
      return (
        <svg {...p}>
          <path d="M9 21h6M10.5 18h3"/>
          <path d="M12 3a6 6 0 0 1 4.24 10.24L15.5 15h-7l-.74-1.76A6 6 0 0 1 12 3z"/>
          <path d="M10 11.5l1.5-1 1.5 1 1.5-1"/>
        </svg>
      )
    case 'Lóbulo Parietal': // Hand — touch & sensation
      return (
        <svg {...p}>
          <path d="M18 11V7a2 2 0 0 0-4 0v1M14 7V4a2 2 0 0 0-4 0v4M10 5a2 2 0 0 0-4 0v8"/>
          <path d="M6 13a5 5 0 0 0 5 5h3a5 5 0 0 0 5-5v-2a2 2 0 0 0-4 0"/>
        </svg>
      )
    case 'Lóbulo Temporal': // Sound waves — hearing & memory
      return (
        <svg {...p}>
          <path d="M11 5 6 9H2v6h4l5 4V5z"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      )
    case 'Lóbulo Occipital': // Eye — vision
      return (
        <svg {...p}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )
    case 'Cerebelo': // Circular arrows — movement & coordination
      return (
        <svg {...p}>
          <path d="M1 4v6h6"/>
          <path d="M23 20v-6h-6"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
      )
    case 'Tronco Encefálico': // ECG pulse — vital functions
      return (
        <svg {...p}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      )
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      )
  }
}

export default function MemoryGame({ onScore, onHome }) {
  const [phase, setPhase]               = useState('idle')
  const [cards, setCards]               = useState([])
  const [flipped, setFlipped]           = useState([])
  const [attempts, setAttempts]         = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [elapsed, setElapsed]           = useState(0)
  const timerRef                        = useRef(null)
  const checkingRef                     = useRef(false)

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

    playClick()
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
          playMatch()
          setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, isMatched: true } : c))
          const newMatched = matchedCount + 1
          setMatchedCount(newMatched)
          if (newMatched === REGION_NAMES.length) {
            setPhase('won')
            const finalScore = Math.max(0, 600 - (attempts + 1) * 10 - Math.floor(elapsed / 5))
            playSuccess()
            onScore?.('memory', finalScore)
          } else {
            setPhase('playing')
          }
        } else {
          playMiss()
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
          <h2 style={{ fontSize: '0.85rem', color: '#fff', letterSpacing: '0.1em', marginBottom: '12px' }}>MEMORY</h2>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 2, fontFamily: "'Courier New', monospace" }}>
            Encuentra los 6 pares de regiones cerebrales.<br />Cuantos menos intentos, mayor tu puntaje.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '260px' }}>
          <InfoCard label="FICHAS" sub="6 PARES">
            <BrainIcon name="Lóbulo Occipital" size={24} color="var(--accent)" />
          </InfoCard>
          <InfoCard label="RELOJ" sub="CRONÓMETRO">
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.7} strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </InfoCard>
        </div>
        <button
          onClick={startGame}
          className="pixel-btn"
          style={{
            width: '100%', maxWidth: '260px', padding: '14px',
            fontSize: '0.85rem',
            background: 'var(--accent)', color: '#050508',
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
          <p style={{ fontSize: '0.5rem', color: 'var(--accent)', letterSpacing: '0.2em', marginBottom: '8px' }}>// COMPLETADO</p>
          <h2 style={{ fontSize: '0.8rem', color: '#fff', letterSpacing: '0.1em', marginBottom: '4px' }}>VICTORIA</h2>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: "'Courier New', monospace" }}>
            Todos los pares encontrados
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '100%', maxWidth: '280px' }}>
          <StatCard label="INTENTOS" value={attempts} />
          <StatCard label="TIEMPO"   value={formatTime(elapsed)} />
          <StatCard label="PUNTAJE"  value={score} accent />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '280px' }}>
          <button
            onClick={startGame}
            className="pixel-btn"
            style={{
              width: '100%', padding: '12px',
              fontSize: '0.6rem',
              background: 'var(--accent)', color: '#050508',
              border: '2px solid var(--accent)',
              boxShadow: '4px 4px 0 var(--accent-border)',
            }}
          >
            &gt; JUGAR DE NUEVO
          </button>
          {onHome && (
            <button
              onClick={onHome}
              className="pixel-btn"
              style={{
                width: '100%', padding: '12px',
                fontSize: '0.6rem',
                background: 'transparent', color: 'var(--accent)',
                border: '1px solid var(--accent-border)',
              }}
            >
              ← VOLVER AL INICIO
            </button>
          )}
        </div>
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
        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
          INTENTOS: <span style={{ color: '#fff' }}>{attempts}</span>
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
          {matchedCount}/6 PARES
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontFamily: 'monospace' }}>
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
                flexDirection: 'column', gap: 4,
                padding: '6px',
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
                transition: 'all 0.3s',
              }}
            >
              {(card.isFlipped || card.isMatched) ? (
                <BrainIcon
                  name={card.label}
                  size={34}
                  color={card.isMatched ? '#50e3b0' : 'var(--accent)'}
                />
              ) : (
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(229,108,120,0.25)" strokeWidth={1.5} strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, sub, children }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--accent-border)',
      padding: '12px 8px',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    }}>
      {children}
      <div style={{ fontSize: '0.6rem', color: '#fff', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', fontFamily: "'Courier New', monospace" }}>{sub}</div>
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${accent ? 'var(--accent-border)' : 'rgba(229,108,120,0.15)'}`,
      padding: '10px 6px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.7rem', color: accent ? 'var(--accent)' : '#fff', fontFamily: "'Courier New', monospace" }}>
        {value}
      </div>
      <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', marginTop: '4px', letterSpacing: '0.1em' }}>
        {label}
      </div>
    </div>
  )
}
