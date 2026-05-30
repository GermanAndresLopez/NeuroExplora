import { useState, Suspense, lazy } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const ARScene = lazy(() => import('../components/ARScene.jsx'))
const APP_URL = import.meta.env.VITE_APP_URL || 'https://neuro-explora-2vt08th89-german-lopezs-projects.vercel.app'
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function InicioView() {
  const [exploring, setExploring] = useState(false)

  return (
    <div className="absolute inset-0">
      {/* Brain viewer — always loaded in background */}
      <Suspense fallback={<div className="absolute inset-0 bg-gray-950" />}>
        <ARScene />
      </Suspense>

      {/* Welcome overlay */}
      {!exploring && (
        <div className="absolute inset-0 z-30 bg-gray-950/88 backdrop-blur-sm flex flex-col items-center justify-between px-6 py-10">

          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <BrainSvg />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">NeuroExplora</h1>
            <p className="text-gray-400 text-sm mt-1 leading-relaxed max-w-xs mx-auto">
              Explora el cerebro humano en 3D e interactúa con sus regiones
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => setExploring(true)}
              className="w-full py-3.5 rounded-2xl bg-cyan-500 text-gray-950 font-bold text-base active:scale-95 transition-transform shadow-lg shadow-cyan-500/25"
            >
              {IS_MOBILE ? '🔍  Explorar el cerebro' : '🔍  Comenzar exploración'}
            </button>
            {IS_MOBILE && (
              <p className="text-gray-500 text-xs text-center leading-relaxed">
                Una vez dentro, usa el botón <span className="text-cyan-500 font-semibold">AR</span> para proyectar el cerebro con la cámara
              </p>
            )}
          </div>

          {/* QR code */}
          <div className="text-center">
            <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Escanea para abrir en móvil</p>
            <div className="p-3 bg-white rounded-2xl inline-block shadow-lg">
              <QRCodeSVG value={APP_URL} size={120} bgColor="#ffffff" fgColor="#0a0e1a" level="M" />
            </div>
            <p className="text-gray-600 text-xs mt-2 font-mono break-all max-w-xs">{APP_URL}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function BrainSvg() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="1.6">
      <path d="M9.5 2C8 2 6.5 2.9 5.8 4.3C5.1 3.5 4.1 3 3 3C1.3 3 0 4.3 0 6C0 6.7 0.3 7.4 0.7 7.9C0.3 8.4 0 9.2 0 10C0 11.6 1.1 12.9 2.5 13.3C2.5 13.5 2.5 13.8 2.5 14C2.5 16.2 4.3 18 6.5 18H8"/>
      <path d="M14.5 2C16 2 17.5 2.9 18.2 4.3C18.9 3.5 19.9 3 21 3C22.7 3 24 4.3 24 6C24 6.7 23.7 7.4 23.3 7.9C23.7 8.4 24 9.2 24 10C24 11.6 22.9 12.9 21.5 13.3C21.5 13.5 21.5 13.8 21.5 14C21.5 16.2 19.7 18 17.5 18H16"/>
      <path d="M8 18V22M16 18V22M8 22H16M12 2V18"/>
    </svg>
  )
}
