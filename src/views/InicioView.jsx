import { useState, Suspense, lazy } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const ARScene = lazy(() => import('../components/ARScene.jsx'))
const APP_URL = import.meta.env.VITE_APP_URL || 'https://neuro-explora-2vt08th89-german-lopezs-projects.vercel.app'
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function InicioView({ onNavigate }) {
  const [exploring, setExploring] = useState(false)

  return (
    <div className="absolute inset-0">
      {/* Brain in background */}
      <Suspense fallback={<div className="absolute inset-0" style={{ background: 'var(--bg)' }} />}>
        <ARScene />
      </Suspense>

      {/* Game menu overlay */}
      {!exploring && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-between py-8 px-5"
          style={{ background: 'rgba(5,5,8,0.86)' }}
        >
          {/* ── HEADER ─────────────────────────────────────── */}
          <div className="w-full text-center">
            <p style={{ fontSize: '0.5rem', color: 'var(--accent)', letterSpacing: '0.2em', opacity: 0.8 }}>
              //SCN_01 &nbsp;&gt;&nbsp; SISTEMA LISTO
            </p>

            <div style={{ position: 'relative', display: 'inline-block', marginTop: '1rem' }}>
              {/* Corner brackets */}
              <span style={{
                position: 'absolute', top: -6, left: -10,
                width: 14, height: 14,
                borderTop: '2px solid var(--accent)',
                borderLeft: '2px solid var(--accent)',
                opacity: 0.8,
              }} />
              <span style={{
                position: 'absolute', bottom: -6, right: -10,
                width: 14, height: 14,
                borderBottom: '2px solid var(--accent)',
                borderRight: '2px solid var(--accent)',
                opacity: 0.8,
              }} />

              <h1
                className="glitch-text"
                style={{
                  fontSize: 'clamp(0.9rem, 5vw, 1.3rem)',
                  color: '#fff',
                  letterSpacing: '0.12em',
                  lineHeight: 1.4,
                  padding: '0 8px',
                }}
              >
                NEURO<br />EXPLORA
              </h1>
            </div>

            <p style={{ fontSize: '0.45rem', color: 'var(--text-dim)', letterSpacing: '0.25em', marginTop: '0.6rem' }}>
              CEREBRO HUMANO &mdash; v1.0.0
            </p>
          </div>

          {/* ── MENU BUTTONS ────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '280px' }}>
            <MenuButton
              primary
              onClick={() => setExploring(true)}
              label={IS_MOBILE ? '> EXPLORAR' : '> EXPLORAR'}
            />
            <MenuButton
              onClick={() => onNavigate('juegos')}
              label="> JUEGOS"
            />
            <MenuButton
              onClick={() => onNavigate('config')}
              label="> CONFIGURAR"
            />
          </div>

          {/* ── FOOTER ─────────────────────────────────────── */}
          <div className="text-center" style={{ width: '100%' }}>
            {!IS_MOBILE && (
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.4rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
                  ESCANEAR PARA MÓVIL
                </p>
                <div style={{
                  display: 'inline-block',
                  padding: '6px',
                  background: '#fff',
                  clipPath: 'polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)',
                }}>
                  <QRCodeSVG value={APP_URL} size={80} bgColor="#ffffff" fgColor="#050508" level="M" />
                </div>
              </div>
            )}
            <p style={{
              fontSize: '0.4rem',
              color: 'rgba(229,108,120,0.4)',
              letterSpacing: '0.15em',
              fontFamily: "'Courier New', monospace",
            }}>
              X_12.847 &nbsp; Y_-35.291 &nbsp; Z_0.000
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuButton({ onClick, label, primary }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="pixel-btn"
      style={{
        width: '100%',
        padding: '14px 20px',
        fontSize: '0.65rem',
        background: primary
          ? (hovered ? '#f07d88' : 'var(--accent)')
          : (hovered ? 'var(--accent-dim)' : 'transparent'),
        color: primary ? '#050508' : (hovered ? '#fff' : 'var(--accent)'),
        border: `2px solid ${hovered ? '#f07d88' : 'var(--accent)'}`,
        boxShadow: hovered
          ? '0 0 14px var(--accent-glow), 4px 4px 0 var(--accent-border)'
          : '4px 4px 0 var(--accent-border)',
      }}
    >
      {label}
    </button>
  )
}
