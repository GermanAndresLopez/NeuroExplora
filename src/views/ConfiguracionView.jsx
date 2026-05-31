import { useState, useEffect } from 'react'
import { getScores } from '../hooks/useScores.js'
import { playBack } from '../hooks/useSound.js'


const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function loadGIS() {
  return new Promise(resolve => {
    if (window.google?.accounts?.id) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = resolve
    s.onerror = resolve
    document.head.appendChild(s)
  })
}

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch { return null }
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('ne_user') || 'null') } catch { return null }
}

async function queryPermission(name) {
  try {
    const r = await navigator.permissions.query({ name })
    return r.state
  } catch { return 'n/a' }
}

export default function ConfiguracionView({ onHome }) {
  const [user, setUser]             = useState(() => getStoredUser())
  const [gisReady, setGisReady]     = useState(false)
  const [cameraPerm, setCameraPerm] = useState('…')
  const [orientPerm, setOrientPerm] = useState('…')
  const [scores, setScores]         = useState([])

  useEffect(() => {
    loadGIS().then(() => setGisReady(!!CLIENT_ID && !!window.google?.accounts?.id))
    queryPermission('camera').then(setCameraPerm)
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      setOrientPerm('requiere permiso')
    } else {
      setOrientPerm('automático')
    }
    setScores(getScores())
  }, [])

  useEffect(() => {
    if (!gisReady || user) return
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: ({ credential }) => {
        const info = decodeJWT(credential)
        if (!info) return
        const u = { name: info.name, email: info.email, picture: info.picture }
        localStorage.setItem('ne_user', JSON.stringify(u))
        setUser(u)
      },
    })
    window.google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'filled_black', size: 'large', text: 'signin_with', shape: 'pill', width: 260 }
    )
  }, [gisReady, user])

  function signOut() {
    localStorage.removeItem('ne_user')
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect()
    setUser(null)
  }

  function clearScores() {
    localStorage.removeItem('ne_scores')
    setScores([])
  }

  const memoryScores = scores.filter(s => s.game === 'memory')
  const quizScores   = scores.filter(s => s.game === 'quiz')

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

        {/* ── Cuenta ── */}
        <Section label="CUENTA">
          {user ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--accent-border)',
            }}>
              {user.picture && (
                <img src={user.picture} alt="" referrerPolicy="no-referrer"
                     style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--accent-border)' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.7rem', color: '#fff', letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: "'Courier New', monospace", marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </p>
              </div>
              <button
                onClick={signOut}
                style={{
                  fontSize: '0.6rem', color: '#ff5555',
                  border: '1px solid rgba(255,85,85,0.4)',
                  padding: '6px 10px',
                  background: 'transparent', cursor: 'pointer',
                  fontFamily: "'Press Start 2P', monospace",
                  letterSpacing: '0.05em',
                }}
              >
                SALIR
              </button>
            </div>
          ) : CLIENT_ID ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textAlign: 'center', fontFamily: "'Courier New', monospace", lineHeight: 2 }}>
                Inicia sesión para guardar tu progreso y aparecer en la clasificación
              </p>
              <div id="google-btn" />
            </div>
          ) : (
            <div style={{
              padding: '12px',
              background: 'rgba(229,108,120,0.06)',
              border: '1px solid var(--accent-border)',
            }}>
              <p style={{ fontSize: '0.55rem', color: 'var(--accent)', lineHeight: 2, fontFamily: "'Courier New', monospace" }}>
                Para activar login Google, agrega{' '}
                <code style={{ background: 'rgba(229,108,120,0.15)', padding: '1px 4px', fontFamily: "'Courier New', monospace" }}>
                  VITE_GOOGLE_CLIENT_ID
                </code>{' '}
                en las variables de entorno de Vercel.
              </p>
            </div>
          )}
        </Section>

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

        {/* ── Puntuaciones ── */}
        <Section label="MIS PUNTUACIONES">
          {scores.length === 0 ? (
            <p style={{ fontSize: '0.55rem', color: 'var(--text-dim)', textAlign: 'center', padding: '16px 0', fontFamily: "'Courier New', monospace", lineHeight: 2 }}>
              Sin puntuaciones guardadas.<br />
              <span style={{ color: 'rgba(229,108,120,0.4)' }}>Juega una partida para ver tu historial.</span>
            </p>
          ) : (
            <>
              <ScoreTable title="MEMORY" rows={memoryScores} unit=" pts" />
              <ScoreTable title="QUIZ"   rows={quizScores}   unit="/6"  />
              <button
                onClick={clearScores}
                style={{
                  marginTop: '10px',
                  fontSize: '0.55rem', color: 'rgba(255,85,85,0.6)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: "'Press Start 2P', monospace",
                  letterSpacing: '0.05em',
                }}
              >
                &gt; BORRAR HISTORIAL
              </button>
            </>
          )}
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

function ScoreTable({ title, rows }) {
  if (!rows.length) return null
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ fontSize: '0.55rem', color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: '6px' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {rows.slice(0, 5).map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 10px',
            background: 'var(--surface)',
            border: '1px solid rgba(229,108,120,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', width: '12px', fontFamily: "'Courier New', monospace" }}>{i + 1}.</span>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)', fontFamily: "'Courier New', monospace" }}>{s.user}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontFamily: "'Courier New', monospace", fontWeight: 'bold' }}>
                {s.score}
              </span>
              <span style={{ fontSize: '0.32rem', color: 'rgba(229,108,120,0.3)', fontFamily: "'Courier New', monospace" }}>
                {new Date(s.date).toLocaleDateString('es')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
