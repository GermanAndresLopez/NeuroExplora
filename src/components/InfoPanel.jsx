import { useEffect, useRef } from 'react'
import AudioButton from './AudioButton.jsx'

export default function InfoPanel({ region, onClose }) {
  const panelRef = useRef(null)

  // Animate in on mount
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    // Start below screen, animate to position
    el.style.transform = 'translateY(100%)'
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
      el.style.transform = 'translateY(0)'
    })
  }, [region?.id])

  if (!region) return null

  return (
    <div
      ref={panelRef}
      className="absolute bottom-16 left-0 right-0 z-30 mx-3 mb-2"
      style={{ transform: 'translateY(100%)' }}
    >
      <div className="bg-gray-900/95 backdrop-blur-md border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/60" />
            <h2 className="text-lg font-bold text-cyan-400 tracking-wide">
              {region.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar panel"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-3">
          <p className="text-gray-300 text-sm leading-relaxed">
            {region.description}
          </p>
          {region.funFact && (
            <div className="mt-3 flex gap-2 p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wider shrink-0 mt-0.5">
                Dato
              </span>
              <p className="text-cyan-200 text-xs leading-relaxed">{region.funFact}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-1 flex gap-2">
          <AudioButton
            text={`${region.name}. ${region.description} ${region.funFact || ''}`}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  )
}

function CloseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
