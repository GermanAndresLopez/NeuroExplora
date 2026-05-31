import { useState, useEffect } from 'react'
import { playBack } from '../hooks/useSound.js'

async function queryPermission(name) {
  try {
    const r = await navigator.permissions.query({ name })
    return r.state
  } catch { return 'n/a' }
}

export default function ConfiguracionView({ onHome }) {
  const [cameraPerm, setCameraPerm] = useState('…')
  const [orientPerm, setOrientPerm] = useState('…')

  useEffect(() => {
    queryPermission('camera').then(setCameraPerm)
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      setOrientPerm('requiere permiso')
    } else {
      setOrientPerm('automático')
    }
  }, [])

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '16px 16px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.2em', opacity: 0.7 }}>
            //SCN_03 &nbsp;&gt;&nbsp; CONFIGURACIÓN
          </p>
          {onHome && (
            <button
              onClick={() => { playBack(); onHome() }}
              style={{
                fontSize: '0.5rem', color: 'var(--accent)',
                background: 'transparent', border: '1px solid var(--accent-border)',
                padding: '5px 10px', cursor: 'pointer',
                fontFamily: "'Press Start 2P', monospace",
                letterSpacing: '0.05em',
              }}
            >
              ← INICIO
            </button>
          )}
        </div>
        <h1 style={{ fontSize: '1rem', color: '#fff', letterSpacing: '0.1em', marginBottom: '20px' }}>
          SISTEMA
        </h1>

        {/* ── Permisos ── */}
        <Section label="PERMISOS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <PermRow
              label="CÁMARA"
              desc="Necesaria para el modo AR"
              state={cameraPerm}
              onRequest={async () => {
                try {
                  const s = await navigator.mediaDevices.getUserMedia({ video: true })
                  s.getTracks().forEach(t => t.stop())
                  setCameraPerm('granted')
                } catch { setCameraPerm('denied') }
              }}
            />
            <PermRow
              label="ORIENTACIÓN"
              desc="Giroscopio para AR en iOS"
              state={orientPerm}
              onRequest={async () => {
                if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
                  const r = await DeviceOrientationEvent.requestPermission()
                  setOrientPerm(r)
                }
              }}
            />
          </div>
        </Section>

        {/* ── Acerca ── */}
        <Section label="ACERCA DE">
          <p style={{ fontSize: '0.55rem', color: 'var(--text-dim)', lineHeight: 2.2, fontFamily: "'Courier New', monospace" }}>
            Aplicación educativa de realidad aumentada sobre el cerebro humano.
            Desarrollada con React, Three.js y OrbitControls.
            Contenido basado en neurociencia clínica.
          </p>
          <p style={{ fontSize: '0.55rem', color: 'rgba(229,108,120,0.35)', marginTop: '6px', fontFamily: "'Courier New', monospace" }}>
            BUILD_v1.0.0 — 2024
          </p>
        </Section>

      </div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--accent)', letterSpacing: '0.2em' }}>//</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--accent)', letterSpacing: '0.15em' }}>{label}</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--accent-border)' }} />
      </div>
      {children}
    </div>
  )
}

function PermRow({ label, desc, state, onRequest }) {
  const granted = state === 'granted' || state === 'automático'
  const denied  = state === 'denied'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 12px',
      background: 'var(--surface)',
      border: '1px solid rgba(229,108,120,0.15)',
    }}>
      <div>
        <p style={{ fontSize: '0.65rem', color: '#fff', letterSpacing: '0.08em' }}>{label}</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '3px', fontFamily: "'Courier New', monospace" }}>{desc}</p>
      </div>
      {granted ? (
        <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(80,227,176,0.1)', color: '#50e3b0', border: '1px solid rgba(80,227,176,0.3)', letterSpacing: '0.1em' }}>
          OK
        </span>
      ) : denied ? (
        <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'rgba(255,85,85,0.1)', color: '#ff5555', border: '1px solid rgba(255,85,85,0.3)', letterSpacing: '0.1em' }}>
          DENEGADO
        </span>
      ) : (
        <button
          onClick={onRequest}
          style={{
            fontSize: '0.7rem', padding: '5px 10px',
            background: 'var(--accent-dim)', color: 'var(--accent)',
            border: '1px solid var(--accent-border)', cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace",
            letterSpacing: '0.05em',
          }}
        >
          &gt; PEDIR
        </button>
      )}
    </div>
  )
}
