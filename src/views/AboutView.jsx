import { QRCodeSVG } from 'qrcode.react'
import { REGION_LIST } from '../data/brainRegions.js'

const APP_URL = import.meta.env.VITE_APP_URL || 'https://neuroexplora.vercel.app'

export default function AboutView() {
  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-4 pt-4 pb-20">
        <h1 className="text-xl font-bold text-white mb-4">Acerca de NeuroExplora</h1>

        {/* QR Card */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 mb-5 text-center">
          <p className="text-gray-400 text-xs mb-4 uppercase tracking-wider font-semibold">
            Escanea para abrir en móvil
          </p>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-xl inline-block">
              <QRCodeSVG
                value={APP_URL}
                size={140}
                bgColor="#ffffff"
                fgColor="#0a0e1a"
                level="M"
              />
            </div>
          </div>
          <p className="text-cyan-400 text-xs font-mono break-all">{APP_URL}</p>
        </div>

        {/* How to use */}
        <Section title="Cómo usar la Realidad Aumentada">
          <ol className="flex flex-col gap-3">
            {[
              { n: '1', text: 'Imprime o muestra la imagen marcador desde este sitio.' },
              { n: '2', text: 'Abre la app en tu navegador móvil (Chrome o Safari).' },
              { n: '3', text: 'Toca "Permitir" cuando se solicite acceso a la cámara.' },
              { n: '4', text: 'Apunta la cámara al marcador — el cerebro 3D aparecerá sobre él.' },
              { n: '5', text: 'Toca cualquier región del cerebro para ver su información.' },
              { n: '6', text: 'Pulsa el botón de audio para escuchar la descripción en español.' },
            ].map(step => (
              <li key={step.n} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.n}
                </span>
                <span className="text-gray-300 text-sm leading-relaxed">{step.text}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* Regions summary */}
        <Section title="Regiones cerebrales">
          <div className="flex flex-col gap-2">
            {REGION_LIST.map(region => (
              <div
                key={region.id}
                className="flex gap-3 p-3 bg-gray-800/40 rounded-xl border border-gray-700/60"
              >
                <div className="w-1.5 shrink-0 rounded-full bg-cyan-500 self-stretch opacity-70" />
                <div>
                  <div className="text-white text-sm font-semibold mb-0.5">{region.name}</div>
                  <div className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                    {region.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Browser support */}
        <Section title="Compatibilidad">
          <div className="flex flex-col gap-2 text-sm">
            {[
              { browser: 'Chrome para Android', ar: true, audio: true },
              { browser: 'Safari para iOS 15+', ar: true, audio: true },
              { browser: 'Firefox para Android', ar: true, audio: false },
              { browser: 'Samsung Internet', ar: true, audio: true },
            ].map(row => (
              <div key={row.browser} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-gray-300">{row.browser}</span>
                <div className="flex gap-3">
                  <Badge ok={row.ar} label="AR" />
                  <Badge ok={row.audio} label="Audio" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-3">
            La app requiere HTTPS y permisos de cámara. Funciona mejor en dispositivos móviles modernos.
          </p>
        </Section>

        {/* Credits */}
        <div className="mt-4 p-4 bg-gray-800/30 rounded-xl border border-gray-800 text-center">
          <p className="text-gray-500 text-xs leading-relaxed">
            Desarrollado con React, Three.js y Mind AR.<br />
            Contenido educativo basado en neurociencia clínica.
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Badge({ ok, label }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
      ${ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}
    >
      {label} {ok ? '✓' : '✗'}
    </span>
  )
}
