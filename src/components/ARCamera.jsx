import { playBack } from '../hooks/useSound.js'

const BRAIN_AR = '/models/brain_total.html?ar=1&v=5'

export default function ARCamera({ onExit }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050508' }}>
      {/* brain_total.html handles camera + gyro internally in AR mode */}
      <iframe
        src={BRAIN_AR}
        title="Cerebro AR"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="camera; gyroscope; accelerometer; autoplay"
      />

      {/* Exit button — lives in parent so always reachable */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', justifyContent: 'flex-end',
        padding: '14px 16px',
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => { playBack(); onExit() }}
          style={{
            pointerEvents: 'auto',
            padding: '9px 16px',
            background: 'rgba(5,5,8,0.88)',
            border: '1px solid rgba(229,108,120,0.45)',
            color: '#e56c78',
            fontSize: '0.6rem',
            fontFamily: "'Press Start 2P', monospace",
            letterSpacing: '0.05em',
            cursor: 'pointer',
          }}
        >
          × SALIR
        </button>
      </div>
    </div>
  )
}
