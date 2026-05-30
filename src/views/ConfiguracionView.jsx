import { useState, useEffect, useCallback } from 'react'
import { getScores } from '../hooks/useScores.js'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// ── Google Identity Services ──────────────────────────────────────────────
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

// ── Permission checker ────────────────────────────────────────────────────
async function queryPermission(name) {
  try {
    const r = await navigator.permissions.query({ name })
    return r.state
  } catch { return 'no disponible' }
}

export default function ConfiguracionView() {
  const [user, setUser]             = useState(() => getStoredUser())
  const [gisReady, setGisReady]     = useState(false)
  const [cameraPerm, setCameraPerm] = useState('…')
  const [orientPerm, setOrientPerm] = useState('…')
  const [scores, setScores]         = useState([])

  // Load GIS + check permissions
  useEffect(() => {
    loadGIS().then(() => {
      setGisReady(!!CLIENT_ID && !!window.google?.accounts?.id)
    })
    queryPermission('camera').then(setCameraPerm)
    // DeviceOrientation doesn't have a standard Permissions API entry on all browsers
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      setOrientPerm('requiere permiso')
    } else {
      setOrientPerm('automático')
    }
    setScores(getScores())
  }, [])

  // Render Google sign-in button
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
    <div className="h-full overflow-auto">
      <div className="px-4 pt-4 pb-24">
        <h1 className="text-xl font-bold text-white mb-5">Configuración</h1>

        {/* ── Cuenta Google ── */}
        <Section title="Cuenta">
          {user ? (
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              {user.picture && (
                <img src={user.picture} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                <p className="text-gray-400 text-xs truncate">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                className="text-xs text-red-400 border border-red-400/40 px-3 py-1.5 rounded-full hover:bg-red-400/10 transition-colors"
              >
                Salir
              </button>
            </div>
          ) : CLIENT_ID ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-gray-400 text-sm text-center">
                Inicia sesión para guardar tu progreso y aparecer en la clasificación
              </p>
              <div id="google-btn" />
            </div>
          ) : (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-yellow-400 text-xs leading-relaxed">
                Para activar el login con Google, agrega{' '}
                <code className="bg-yellow-500/20 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code>{' '}
                en las variables de entorno de Vercel.
              </p>
            </div>
          )}
        </Section>

        {/* ── Permisos ── */}
        <Section title="Permisos del dispositivo">
          <div className="flex flex-col gap-2">
            <PermRow
              label="Cámara"
              desc="Necesaria para el modo AR"
              state={cameraPerm}
              onRequest={async () => {
                try {
                  const s = await navigator.mediaDevices.getUserMedia({ video: true })
                  s.getTracks().forEach(t => t.stop())
                  setCameraPerm('granted')
                } catch {
                  setCameraPerm('denied')
                }
              }}
            />
            <PermRow
              label="Orientación"
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

        {/* ── Clasificación ── */}
        <Section title="Mis puntuaciones">
          {scores.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              Aún no tienes puntuaciones guardadas.<br />
              <span className="text-gray-600 text-xs">Juega una partida para ver tu historial.</span>
            </p>
          ) : (
            <>
              <ScoreTable title="Memoria" rows={memoryScores} unit="pts" />
              <ScoreTable title="Quiz" rows={quizScores} unit="/6" valueKey="score" />
              <button
                onClick={clearScores}
                className="mt-3 text-xs text-red-400/70 hover:text-red-400 transition-colors"
              >
                Borrar historial
              </button>
            </>
          )}
        </Section>

        {/* ── Acerca ── */}
        <Section title="Acerca de NeuroExplora">
          <p className="text-gray-500 text-xs leading-relaxed">
            Aplicación educativa de realidad aumentada sobre el cerebro humano.
            Desarrollada con React, Three.js y OrbitControls.
            Contenido basado en neurociencia clínica.
          </p>
          <p className="text-gray-600 text-xs mt-2">Versión 1.0.0</p>
        </Section>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}

function PermRow({ label, desc, state, onRequest }) {
  const granted = state === 'granted' || state === 'automático'
  const denied  = state === 'denied'
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-gray-700/60">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-gray-500 text-xs">{desc}</p>
      </div>
      {granted ? (
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">✓ Ok</span>
      ) : denied ? (
        <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-medium">✗ Denegado</span>
      ) : (
        <button
          onClick={onRequest}
          className="text-xs px-3 py-1.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
        >
          Solicitar
        </button>
      )}
    </div>
  )
}

function ScoreTable({ title, rows, unit }) {
  if (!rows.length) return null
  return (
    <div className="mb-3">
      <p className="text-gray-400 text-xs font-semibold mb-1.5">{title}</p>
      <div className="flex flex-col gap-1">
        {rows.slice(0, 5).map((s, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-800/40 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-4">{i + 1}.</span>
              <span className="text-gray-300 text-xs">{s.user}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 text-xs font-bold">{s.score}{unit}</span>
              <span className="text-gray-600 text-xs">{new Date(s.date).toLocaleDateString('es')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
