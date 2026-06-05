import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { playClick, playSelect, playBack, playSuccess } from '../hooks/useSound.js'
import QuizGame from '../components/games/QuizGame.jsx'
import { saveScore } from '../hooks/useScores.js'
import { getLeaderboard } from '../lib/leaderboard.js'

const ARCamera = lazy(() => import('../components/ARCamera.jsx'))

const BRAIN_SRC    = '/models/brain_total.html?v=4'
const TOTAL_REGIONS = 6

const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

// experience: null | 'selector' | '3d' | '3d-quiz' | 'ar'
export default function InicioView({ onNavigate }) {
  const [experience,     setExperience]     = useState(() => {
    // Si viene de la pantalla AR con las 6 zonas completas, abrir quiz directo
    const params = new URLSearchParams(window.location.search)
    if (params.get('startQuiz') === '1') {
      window.history.replaceState({}, '', window.location.pathname)
      return '3d-quiz'
    }
    return null
  })
  const [viewedRegions,  setViewedRegions]  = useState(new Set())
  const [completeModal,  setCompleteModal]  = useState(false)
  const [tutorialModal,  setTutorialModal]  = useState(false)
  const [showRanking,    setShowRanking]    = useState(false)
  const [countdown,      setCountdown]      = useState(null)
  const countdownStarted                   = useRef(false)

  // Listen for region views — three channels for maximum compatibility
  useEffect(() => {
    function markRegion(idx) {
      if (typeof idx !== 'number') return
      setViewedRegions(prev => {
        if (prev.has(idx)) return prev
        const next = new Set(prev)
        next.add(idx)
        return next
      })
    }

    // 1. localStorage storage event — most reliable for same-origin iframe → parent
    function onStorage(e) {
      if (e.key !== 'ne_viewed') return
      try {
        const arr = JSON.parse(e.newValue || '[]')
        setViewedRegions(new Set(arr))
      } catch {}
    }
    window.addEventListener('storage', onStorage)

    // 2. BroadcastChannel
    let bc = null
    try {
      bc = new BroadcastChannel('ne_brain')
      bc.onmessage = (e) => markRegion(e.data?.index)
    } catch {}

    // 3. postMessage fallback
    function onMessage(e) {
      if (e.data?.type === 'regionViewed') markRegion(e.data.index)
    }
    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('storage', onStorage)
      bc?.close()
      window.removeEventListener('message', onMessage)
    }
  }, [])

  // Polling: read localStorage every 300ms while in 3D — doesn't depend on cross-frame events
  useEffect(() => {
    if (experience !== '3d') return
    const id = setInterval(() => {
      try {
        const raw = localStorage.getItem('ne_viewed')
        if (!raw) return
        const arr = JSON.parse(raw)
        if (!Array.isArray(arr) || arr.length === 0) return
        setViewedRegions(prev => {
          if (prev.size === arr.length) return prev
          return new Set(arr)
        })
      } catch {}
    }, 300)
    return () => clearInterval(id)
  }, [experience])

  // Start countdown when all regions seen
  useEffect(() => {
    if (experience !== '3d' || viewedRegions.size < TOTAL_REGIONS) return
    if (countdownStarted.current) return
    countdownStarted.current = true
    playSuccess()
    setCountdown(10)
  }, [viewedRegions, experience])

  // Countdown tick — each second; at 0 opens completion modal
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) { setCompleteModal(true); setCountdown(null); return }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  // Reset state when returning to main menu
  useEffect(() => {
    if (experience === null) {
      localStorage.removeItem('ne_viewed')
      setViewedRegions(new Set())
      setCompleteModal(false)
      setTutorialModal(false)
      setCountdown(null)
      countdownStarted.current = false
    }
  }, [experience])

  function handleExplore()   { playSelect(); setExperience('selector') }
  function handleJuegos()    { playClick();  onNavigate('juegos') }
  function handleConfig()    { playClick();  onNavigate('config') }
  function handleRanking()   { playSelect(); setShowRanking(true) }
  function handleCancel()    { playBack();   setExperience(null) }
  function handlePickAR()   { playSelect(); setExperience('ar') }
  function handleExitAR()   { playBack();   setExperience(null) }

  function handlePick3D() {
    playSelect()
    localStorage.removeItem('ne_viewed')   // reset for new session
    setExperience('3d')
    setTutorialModal(true)
  }

  function handleQuizScore(game, score) {
    const user = (() => {
      try { return JSON.parse(localStorage.getItem('ne_user') || 'null')?.name } catch { return null }
    })()
    saveScore({ game, score, user })
  }

  // ── AR experience ─────────────────────────────────────────────────────────
  if (experience === 'ar') {
    return (
      <Suspense fallback={<LoadingFill />}>
        <ARCamera onExit={handleExitAR} />
      </Suspense>
    )
  }

  // ── Quiz after tutorial ───────────────────────────────────────────────────
  if (experience === '3d-quiz') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--accent-border)',
          background: 'rgba(13,13,20,0.95)',
          flexShrink: 0,
        }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.2em', opacity: 0.7 }}>
            //SCN_01 &nbsp;&gt;&nbsp; EVALUACIÓN
          </p>
          <p style={{ fontSize: '0.75rem', color: '#fff', letterSpacing: '0.1em', marginTop: 4 }}>
            CUESTIONARIO
          </p>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <QuizGame
            onScore={handleQuizScore}
            onFinish={() => onNavigate('juegos')}
          />
        </div>
      </div>
    )
  }

  // ── 3D viewer ─────────────────────────────────────────────────────────────
  if (experience === '3d') {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <iframe
          src={BRAIN_SRC}
          title="Explorador 3D del Cerebro"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          allow="autoplay"
        />

        {/* Top bar: back button + progress */}
        <TopBar
          viewed={viewedRegions.size}
          total={TOTAL_REGIONS}
          onExit={handleExitAR}
        />

        {/* Countdown banner when all regions seen */}
        {countdown !== null && <CountdownBanner seconds={countdown} />}

        {/* Tutorial modal shown once on entry */}
        {tutorialModal && (
          <TutorialModal onDismiss={() => setTutorialModal(false)} total={TOTAL_REGIONS} />
        )}

        {/* Completion modal */}
        {completeModal && (
          <CompleteModal onStart={() => { setCompleteModal(false); setExperience('3d-quiz') }} />
        )}
      </div>
    )
  }

  // ── Main menu ─────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <iframe
        src={BRAIN_SRC}
        title=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          border: 'none', display: 'block',
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '32px 20px 24px',
          background: 'rgba(5,5,8,0.86)',
        }}
      >
        {/* ── TITLE ── */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--accent)', letterSpacing: '0.2em', opacity: 0.75, marginBottom: 12 }}>
            //SCN_01 &nbsp;&gt;&nbsp; SISTEMA LISTO
          </p>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Corner pos="tl" /><Corner pos="br" />
            <h1
              className="glitch-text"
              style={{
                fontSize: 'clamp(1.3rem, 8vw, 2rem)',
                color: '#fff',
                letterSpacing: '0.12em',
                lineHeight: 1.5,
                padding: '4px 12px',
              }}
            >
              NEURO<br />EXPLORA
            </h1>
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.25em', marginTop: 8 }}>
            CEREBRO HUMANO &mdash; v1.0.0
          </p>
        </div>

        {/* ── MENU BUTTONS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 320 }}>
          <PixelBtn primary onClick={handleExplore}>   &gt; EXPLORAR     </PixelBtn>
          <PixelBtn         onClick={handleJuegos}>    &gt; JUEGOS       </PixelBtn>
          <PixelBtn         onClick={handleRanking}>   &gt; CLASIFICACIÓN</PixelBtn>
          <PixelBtn         onClick={handleConfig}>    &gt; CONFIGURAR   </PixelBtn>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.5rem', color: 'rgba(229,108,120,0.35)', letterSpacing: '0.12em', fontFamily: "'Courier New', monospace" }}>
            X_12.847 &nbsp; Y_-35.291 &nbsp; Z_0.000
          </p>
        </div>
      </div>

      {experience === 'selector' && (
        <ExperienceSelector
          onPick3D={handlePick3D}
          onPickAR={handlePickAR}
          onCancel={handleCancel}
        />
      )}

      {showRanking && (
        <RankingModal onClose={() => { playBack(); setShowRanking(false) }} />
      )}
    </div>
  )
}

// ── Countdown banner ─────────────────────────────────────────────────────
function CountdownBanner({ seconds }) {
  return (
    <div style={{
      position: 'absolute', top: 44, left: 0, right: 0, zIndex: 35,
      background: 'rgba(229,108,120,0.18)',
      borderBottom: '1px solid var(--accent-border)',
      backdropFilter: 'blur(4px)',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <span style={{ fontSize: '0.55rem', color: 'var(--accent)', letterSpacing: '0.12em', fontFamily: "'Courier New', monospace" }}>
        ★ ZONAS COMPLETADAS — QUIZ EN
      </span>
      <span style={{
        fontSize: '1.1rem', color: '#fff',
        fontFamily: "'Press Start 2P', monospace",
        lineHeight: 1,
        textShadow: '0 0 10px var(--accent)',
        minWidth: 22, textAlign: 'center',
      }}>
        {seconds}
      </span>
      <span style={{ fontSize: '0.55rem', color: 'var(--accent)', letterSpacing: '0.12em', fontFamily: "'Courier New', monospace" }}>
        SEG...
      </span>
    </div>
  )
}

// ── Top bar: back + progress in one strip ──────────────────────────────────
function TopBar({ viewed, total, onExit }) {
  const pct = (viewed / total) * 100
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40,
      background: 'rgba(5,5,8,0.90)',
      borderBottom: '1px solid var(--accent-border)',
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 12px',
      height: 44,
    }}>
      <button
        onClick={onExit}
        style={{
          flexShrink: 0,
          padding: '6px 10px',
          background: 'transparent',
          border: '1px solid var(--accent-border)',
          color: 'var(--accent)',
          fontSize: '0.6rem',
          fontFamily: "'Press Start 2P', monospace",
          cursor: 'pointer',
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}
      >
        ← MENÚ
      </button>

      <div style={{ width: 1, height: 20, background: 'var(--accent-border)', flexShrink: 0 }} />

      <span style={{ fontSize: '0.5rem', color: 'var(--text-dim)', flexShrink: 0, letterSpacing: '0.05em' }}>
        ZONAS
      </span>
      <div style={{ flex: 1, height: 3, background: 'var(--surface2)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: 'var(--accent)',
          boxShadow: '0 0 6px var(--accent-glow)',
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ flexShrink: 0, fontSize: '0.65rem', color: 'var(--accent)', fontFamily: "'Courier New', monospace" }}>
        {viewed}<span style={{ color: 'var(--text-dim)', fontSize: '0.55rem' }}>/{total}</span>
      </span>
    </div>
  )
}

// ── Tutorial modal (shown once after entering 3D) ─────────────────────────
function TutorialModal({ onDismiss, total }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(5,5,8,0.88)',
    }}>
      <div style={{
        width: '88%', maxWidth: 340,
        background: 'var(--surface)',
        border: '1px solid var(--accent-border)',
        padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.15em' }}>//</span>
          <span style={{ fontSize: '0.8rem', color: '#fff', letterSpacing: '0.1em' }}>TUTORIAL</span>
          <div style={{ flex: 1, height: 1, background: 'var(--accent-border)' }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Step n="01" text={`Toca cada una de las ${total} regiones del cerebro para leer su descripción.`} />
          <Step n="02" text="Debes verlas todas para desbloquear el cuestionario." />
          <Step n="03" text="Cuando completes las 6, el cuestionario comenzará automáticamente." />
        </div>

        <button
          onClick={() => { playSelect(); onDismiss() }}
          className="pixel-btn"
          style={{
            padding: '15px', fontSize: '0.8rem',
            background: 'var(--accent)', color: '#050508',
            border: '2px solid var(--accent)',
            boxShadow: '3px 3px 0 var(--accent-border)',
            letterSpacing: '0.1em',
            marginTop: 4,
          }}
        >
          &gt; ENTENDIDO
        </button>
      </div>
    </div>
  )
}

function Step({ n, text }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{
        flexShrink: 0,
        fontSize: '0.55rem', color: 'var(--accent)',
        fontFamily: "'Courier New', monospace",
        opacity: 0.6, marginTop: 2,
      }}>{n}</span>
      <p style={{
        fontSize: '0.7rem', color: 'var(--text-dim)',
        fontFamily: "'Courier New', monospace",
        lineHeight: 1.9,
      }}>{text}</p>
    </div>
  )
}

// ── Ranking modal ─────────────────────────────────────────────────────────
function RankingModal({ onClose }) {
  const [board,   setBoard]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard().then(data => { setBoard(data); setLoading(false) })
  }, [])

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(5,5,8,0.88)',
    }}>
      <div style={{
        width: '92%', maxWidth: 380,
        maxHeight: '85vh',
        background: 'var(--surface)',
        border: '1px solid var(--accent-border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px 12px',
          borderBottom: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: '0.5rem', color: 'var(--accent)', letterSpacing: '0.2em', opacity: 0.75, marginBottom: 4 }}>
              // CLASIFICACIÓN GLOBAL
            </p>
            <h2 style={{ fontSize: '0.85rem', color: '#fff', letterSpacing: '0.1em' }}>RANKING</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid var(--accent-border)',
              color: 'var(--accent)', fontSize: '0.7rem', cursor: 'pointer',
              padding: '8px 12px', fontFamily: "'Press Start 2P', monospace",
            }}
          >
            ×
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textAlign: 'center', padding: '24px 0', fontFamily: "'Courier New', monospace" }}>
              CARGANDO...
            </p>
          ) : board.length === 0 ? (
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textAlign: 'center', padding: '24px 0', fontFamily: "'Courier New', monospace", lineHeight: 2 }}>
              Sin puntuaciones aún.<br />
              <span style={{ color: 'rgba(229,108,120,0.4)' }}>Completa el quiz para aparecer aquí.</span>
            </p>
          ) : board.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: i < 3 ? 'rgba(229,108,120,0.07)' : 'var(--bg)',
              border: `1px solid ${i < 3 ? 'var(--accent-border)' : 'rgba(229,108,120,0.1)'}`,
            }}>
              <span style={{ fontSize: i < 3 ? '1.1rem' : '0.6rem', width: 26, textAlign: 'center', flexShrink: 0, color: 'var(--text-dim)', fontFamily: "'Courier New', monospace" }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <span style={{ flex: 1, fontSize: '0.7rem', color: '#fff', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.name}
              </span>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontFamily: "'Courier New', monospace", fontWeight: 'bold' }}>
                  {entry.score}
                </span>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)', fontFamily: "'Courier New', monospace" }}>
                  /{entry.total}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--accent-border)', flexShrink: 0 }}>
          <button
            onClick={onClose}
            className="pixel-btn"
            style={{
              width: '100%', padding: '13px', fontSize: '0.75rem',
              background: 'transparent', color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
            }}
          >
            ← VOLVER AL MENÚ
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Completion modal ──────────────────────────────────────────────────────
function CompleteModal({ onStart }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(5,5,8,0.88)',
    }}>
      <div style={{
        width: '88%', maxWidth: 340,
        background: 'var(--surface)',
        border: '1px solid var(--accent-border)',
        padding: '28px 22px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        textAlign: 'center',
      }}>
        {/* Stars */}
        <div style={{ fontSize: '2rem', letterSpacing: '0.2em' }}>★ ★ ★</div>

        {/* Header */}
        <div>
          <p style={{ fontSize: '0.55rem', color: 'var(--accent)', letterSpacing: '0.2em', marginBottom: 8, opacity: 0.8 }}>
            // ZONAS COMPLETADAS
          </p>
          <h2 style={{ fontSize: '0.95rem', color: '#fff', letterSpacing: '0.1em', lineHeight: 1.5 }}>
            ¡HAS EXPLORADO<br />EL CEREBRO!
          </h2>
        </div>

        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: "'Courier New', monospace", lineHeight: 2 }}>
          Has visto las <span style={{ color: 'var(--accent)' }}>6 regiones</span> del cerebro.<br />
          Ahora pon a prueba lo que aprendiste.
        </p>

        <button
          onClick={() => { playSelect(); onStart() }}
          className="pixel-btn"
          style={{
            width: '100%',
            padding: '16px', fontSize: '0.8rem',
            background: 'var(--accent)', color: '#050508',
            border: '2px solid var(--accent)',
            boxShadow: '3px 3px 0 var(--accent-border)',
            letterSpacing: '0.1em',
          }}
        >
          &gt; IR AL QUIZ
        </button>
      </div>
    </div>
  )
}

// ── Experience selector modal ─────────────────────────────────────────────
function ExperienceSelector({ onPick3D, onPickAR, onCancel }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(5,5,8,0.7)',
    }}>
      <div style={{
        width: '90%', maxWidth: 400,
        background: 'var(--surface)',
        border: '1px solid var(--accent-border)',
        padding: '20px 20px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.15em' }}>//</span>
          <span style={{ fontSize: '0.75rem', color: '#fff', letterSpacing: '0.1em' }}>SELECCIONAR MODO</span>
          <div style={{ flex: 1, height: 1, background: 'var(--accent-border)' }} />
        </div>

        <ExperienceCard
          onClick={onPick3D}
          label="EXPERIENCIA 3D"
          desc="Explora el modelo cerebral, toca las 6 regiones para conocerlas y luego responde el cuestionario."
          badge="TODOS LOS DISPOSITIVOS"
          icon="🧠"
          primary
        />

        <ExperienceCard
          onClick={onPickAR}
          label="EXPERIENCIA AR"
          desc={
            IS_MOBILE
              ? 'Coloca el cerebro en el mundo real. Apunta a una superficie lisa, toca para colocarlo y rodéalo caminando.'
              : 'Disponible en móviles Android con ARCore. Coloca el cerebro en el mundo real.'
          }
          badge={IS_MOBILE ? 'MÓVIL' : 'SOLO MÓVIL'}
          icon="📷"
        />

        <button
          onClick={onCancel}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-dim)', fontSize: '0.7rem',
            fontFamily: "'Press Start 2P', monospace",
            padding: '8px', letterSpacing: '0.08em',
            alignSelf: 'center',
          }}
        >
          × CANCELAR
        </button>
      </div>
    </div>
  )
}

function ExperienceCard({ onClick, label, desc, badge, icon, primary }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: 'left', padding: '14px 16px',
        background: hov ? (primary ? 'rgba(229,108,120,0.12)' : 'rgba(255,255,255,0.04)') : 'var(--bg)',
        border: `1px solid ${hov || primary ? 'var(--accent-border)' : 'rgba(229,108,120,0.12)'}`,
        cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start',
        transition: 'all 0.15s',
        boxShadow: hov ? '3px 3px 0 var(--accent-border)' : 'none',
      }}
    >
      <span style={{ fontSize: '1.6rem', flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#fff', letterSpacing: '0.08em' }}>{label}</span>
          <span style={{
            fontSize: '0.5rem', padding: '3px 7px',
            background: primary ? 'var(--accent-dim)' : 'rgba(255,255,255,0.06)',
            color: primary ? 'var(--accent)' : 'var(--text-dim)',
            border: `1px solid ${primary ? 'var(--accent-border)' : 'rgba(255,255,255,0.1)'}`,
            letterSpacing: '0.1em',
          }}>
            {badge}
          </span>
        </div>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.9, fontFamily: "'Courier New', monospace" }}>
          {desc}
        </p>
      </div>
    </button>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function PixelBtn({ onClick, children, primary }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="pixel-btn"
      style={{
        width: '100%', padding: '17px 20px',
        fontSize: '0.85rem',
        background: primary
          ? (hov ? '#f07d88' : 'var(--accent)')
          : (hov ? 'var(--accent-dim)' : 'transparent'),
        color: primary ? '#050508' : (hov ? '#fff' : 'var(--accent)'),
        border: `2px solid ${hov ? '#f07d88' : 'var(--accent)'}`,
        boxShadow: hov
          ? '0 0 14px var(--accent-glow), 4px 4px 0 var(--accent-border)'
          : '4px 4px 0 var(--accent-border)',
        letterSpacing: '0.1em',
      }}
    >
      {children}
    </button>
  )
}

function Corner({ pos }) {
  const styles = {
    tl: { top: -6,    left:  -10, borderTop: '2px solid var(--accent)', borderLeft:  '2px solid var(--accent)' },
    br: { bottom: -6, right: -10, borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' },
  }
  return <span style={{ position: 'absolute', width: 14, height: 14, opacity: 0.8, ...styles[pos] }} />
}

function LoadingFill() {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '3px solid var(--accent)', borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ fontSize: '0.7rem', color: 'var(--accent)', fontFamily: "'Courier New', monospace" }}>
        CARGANDO...
      </p>
    </div>
  )
}
