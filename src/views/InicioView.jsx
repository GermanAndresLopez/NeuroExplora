import { useState, Suspense, lazy } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { playClick, playSelect, playBack } from '../hooks/useSound.js'

const ARScene   = lazy(() => import('../components/ARScene.jsx'))
const ARSceneXR = lazy(() => import('../components/ARSceneXR.jsx'))

const APP_URL  = import.meta.env.VITE_APP_URL || 'https://neuro-explora-2vt08th89-german-lopezs-projects.vercel.app'
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

// experience: null | 'selector' | '3d' | 'ar'
export default function InicioView({ onNavigate }) {
  const [experience, setExperience] = useState(null)

  function handleExplore()  { playSelect(); setExperience('selector') }
  function handleJuegos()   { playClick();  onNavigate('juegos') }
  function handleConfig()   { playClick();  onNavigate('config') }
  function handleCancel()   { playBack();   setExperience(null) }
  function handlePick3D()   { playSelect(); setExperience('3d') }
  function handlePickAR()   { playSelect(); setExperience('ar') }
  function handleExitAR()   { playBack();   setExperience(null) }

  // ── AR experience ─────────────────────────────────────────────────────────
  if (experience === 'ar') {
    return (
      <Suspense fallback={<LoadingFill />}>
        <ARSceneXR onExit={handleExitAR} />
      </Suspense>
    )
  }

  // ── 3D experience ─────────────────────────────────────────────────────────
  if (experience === '3d') {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <Suspense fallback={<LoadingFill />}>
          <ARScene />
        </Suspense>
        <button
          onClick={handleExitAR}
          style={{
            position: 'absolute', top: 12, left: 12, zIndex: 50,
            padding: '7px 12px',
            background: 'rgba(5,5,8,0.88)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent)',
            fontSize: '0.55rem',
            fontFamily: "'Press Start 2P', monospace",
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          ← MENÚ
        </button>
      </div>
    )
  }

  // ── Main menu (with brain loaded silently in bg) ──────────────────────────
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Brain in background */}
      <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: 'var(--bg)' }} />}>
        <ARScene />
      </Suspense>

      {/* Game menu overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '32px 20px 24px',
          background: 'rgba(5,5,8,0.86)',
        }}
      >
        {/* ── TITLE ──────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <p style={{ fontSize: '0.5rem', color: 'var(--accent)', letterSpacing: '0.2em', opacity: 0.75, marginBottom: 12 }}>
            //SCN_01 &nbsp;&gt;&nbsp; SISTEMA LISTO
          </p>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Corner pos="tl" /><Corner pos="br" />
            <h1
              className="glitch-text"
              style={{
                fontSize: 'clamp(1rem, 6vw, 1.4rem)',
                color: '#fff',
                letterSpacing: '0.12em',
                lineHeight: 1.5,
                padding: '4px 12px',
              }}
            >
              NEURO<br />EXPLORA
            </h1>
          </div>

          <p style={{ fontSize: '0.5rem', color: 'var(--text-dim)', letterSpacing: '0.25em', marginTop: 8 }}>
            CEREBRO HUMANO &mdash; v1.0.0
          </p>
        </div>

        {/* ── MENU BUTTONS ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 300 }}>
          <PixelBtn primary onClick={handleExplore}>  &gt; EXPLORAR  </PixelBtn>
          <PixelBtn         onClick={handleJuegos}>   &gt; JUEGOS    </PixelBtn>
          <PixelBtn         onClick={handleConfig}>   &gt; CONFIGURAR</PixelBtn>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center' }}>
          {!IS_MOBILE && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: '0.45rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: 6 }}>
                ESCANEAR PARA MÓVIL
              </p>
              <div style={{
                display: 'inline-block', padding: 6, background: '#fff',
                clipPath: 'polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)',
              }}>
                <QRCodeSVG value={APP_URL} size={80} bgColor="#ffffff" fgColor="#050508" level="M" />
              </div>
            </div>
          )}
          <p style={{ fontSize: '0.4rem', color: 'rgba(229,108,120,0.35)', letterSpacing: '0.12em', fontFamily: "'Courier New', monospace" }}>
            X_12.847 &nbsp; Y_-35.291 &nbsp; Z_0.000
          </p>
        </div>
      </div>

      {/* ── EXPERIENCE SELECTOR MODAL ─────────────────────────────────── */}
      {experience === 'selector' && (
        <ExperienceSelector
          onPick3D={handlePick3D}
          onPickAR={handlePickAR}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}

// ── Experience selector modal ──────────────────────────────────────────────
function ExperienceSelector({ onPick3D, onPickAR, onCancel }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
      background: 'rgba(5,5,8,0.7)',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--surface)',
        border: '1px solid var(--accent-border)',
        borderBottom: 'none',
        padding: '20px 20px 32px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '0.45rem', color: 'var(--accent)', letterSpacing: '0.15em' }}>//</span>
          <span style={{ fontSize: '0.6rem', color: '#fff', letterSpacing: '0.1em' }}>
            SELECCIONAR MODO
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--accent-border)' }} />
        </div>

        {/* AR option */}
        <ExperienceCard
          onClick={onPickAR}
          label="EXPERIENCIA AR"
          desc={
            IS_MOBILE
              ? 'Coloca el cerebro en el mundo real. Apunta a una superficie lisa, toca para colocarlo y rodéalo caminando.'
              : 'Disponible en móviles Android con ARCore. Coloca el cerebro en el mundo real.'
          }
          badge={IS_MOBILE ? 'RECOMENDADO' : 'SOLO MÓVIL'}
          icon="📷"
          primary
        />

        {/* 3D option */}
        <ExperienceCard
          onClick={onPick3D}
          label="EXPERIENCIA 3D"
          desc="Explora el modelo cerebral en pantalla completa. Rota, acerca y toca regiones para ver información."
          badge="TODOS LOS DISPOSITIVOS"
          icon="🧠"
        />

        {/* Cancel */}
        <button
          onClick={onCancel}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-dim)', fontSize: '0.55rem',
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
      <span style={{ fontSize: '1.5rem', flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: '0.6rem', color: '#fff', letterSpacing: '0.08em' }}>{label}</span>
          <span style={{
            fontSize: '0.35rem', padding: '2px 6px',
            background: primary ? 'var(--accent-dim)' : 'rgba(255,255,255,0.06)',
            color: primary ? 'var(--accent)' : 'var(--text-dim)',
            border: `1px solid ${primary ? 'var(--accent-border)' : 'rgba(255,255,255,0.1)'}`,
            letterSpacing: '0.1em',
          }}>
            {badge}
          </span>
        </div>
        <p style={{ fontSize: '0.5rem', color: 'var(--text-dim)', lineHeight: 1.9, fontFamily: "'Courier New', monospace" }}>
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
        width: '100%', padding: '15px 20px',
        fontSize: '0.7rem',
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
      <p style={{ fontSize: '0.6rem', color: 'var(--accent)', fontFamily: "'Courier New', monospace" }}>
        CARGANDO...
      </p>
    </div>
  )
}
