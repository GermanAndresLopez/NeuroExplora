import { useEffect, useRef, useState } from 'react'
import { playBack } from '../hooks/useSound.js'

const BRAIN_AR = '/models/brain_total.html?ar=1&v=6'

export default function ARCamera({ onExit }) {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const [phase, setPhase] = useState('requesting') // requesting | live | denied

  useEffect(() => {
    let cancelled = false
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
        setPhase('live')
      } catch {
        if (!cancelled) setPhase('denied')
      }
    }
    startCamera()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050508', overflow: 'hidden' }}>

      {/* ── Camera feed (React handles it, no iframe permission needed) ── */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0,
          display: phase === 'live' ? 'block' : 'none',
        }}
      />

      {/* ── Transparent brain overlay (iframe only needs gyroscope) ── */}
      {phase === 'live' && (
        <iframe
          src={BRAIN_AR}
          title="Cerebro AR"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            border: 'none', background: 'transparent',
            zIndex: 1,
          }}
          allow="gyroscope; accelerometer; autoplay"
        />
      )}

      {/* ── HUD ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 20,
        pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '14px 16px',
          background: 'linear-gradient(to bottom, rgba(5,5,8,0.7) 0%, transparent 100%)',
        }}>
          <div>
            <p style={{ fontSize: '0.45rem', color: '#e56c78', letterSpacing: '0.2em', opacity: 0.85 }}>
              // MODO AR
            </p>
            <p style={{ fontSize: '0.65rem', color: '#fff', letterSpacing: '0.08em', marginTop: 3 }}>
              CEREBRO 3D
            </p>
          </div>
          <button
            onClick={() => { playBack(); onExit() }}
            style={{
              pointerEvents: 'auto',
              padding: '9px 15px',
              background: 'rgba(5,5,8,0.88)',
              border: '1px solid rgba(229,108,120,0.45)',
              color: '#e56c78',
              fontSize: '0.6rem',
              fontFamily: "'Press Start 2P', monospace",
              cursor: 'pointer',
            }}
          >
            × SALIR
          </button>
        </div>

        {/* Bottom hint */}
        {phase === 'live' && (
          <div style={{
            padding: '16px',
            background: 'linear-gradient(to top, rgba(5,5,8,0.65) 0%, transparent 100%)',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '0.5rem', color: 'rgba(255,255,255,0.45)',
              fontFamily: "'Courier New', monospace", letterSpacing: '0.08em',
            }}>
              INCLINA EL CELULAR · TOCA LAS ZONAS DEL CEREBRO
            </p>
          </div>
        )}
      </div>

      {/* ── States ── */}
      {phase === 'requesting' && (
        <Overlay>
          <Spinner />
          <p style={{ fontSize: '0.6rem', color: '#e56c78', fontFamily: "'Courier New', monospace", letterSpacing: '0.1em' }}>
            SOLICITANDO CÁMARA...
          </p>
        </Overlay>
      )}

      {phase === 'denied' && (
        <Overlay>
          <p style={{ fontSize: '0.75rem', color: '#fff', letterSpacing: '0.1em', marginBottom: 12 }}>
            CÁMARA NO DISPONIBLE
          </p>
          <p style={{
            fontSize: '0.55rem', color: 'rgba(255,255,255,0.45)',
            fontFamily: "'Courier New', monospace", lineHeight: 1.9,
            maxWidth: 260, textAlign: 'center', marginBottom: 20,
          }}>
            Concede permiso de cámara en los ajustes del navegador e intenta de nuevo.
          </p>
          <button
            onClick={() => { playBack(); onExit() }}
            style={{
              padding: '12px 24px',
              background: '#e56c78', color: '#050508',
              border: 'none', cursor: 'pointer',
              fontSize: '0.65rem', fontFamily: "'Press Start 2P', monospace",
            }}
          >
            ← VOLVER
          </button>
        </Overlay>
      )}
    </div>
  )
}

function Overlay({ children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 30,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16,
      background: '#050508',
    }}>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '3px solid #e56c78', borderTopColor: 'transparent',
        animation: 'arSpin 0.8s linear infinite',
      }} />
      <style>{`@keyframes arSpin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
