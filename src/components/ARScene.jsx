import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { loadBrainModel, highlightRegion, resetHighlight } from './BrainModel.js'
import { BRAIN_REGIONS } from '../data/brainRegions.js'
import InfoPanel from './InfoPanel.jsx'

/**
 * AR modes:
 * 'loading'      — app initialising (loading GLB + starting AR engine)
 * 'scanning'     — AR started, searching for marker image
 * 'marker'       — marker detected, brain tracking on it
 * 'surface'      — fallback: brain at fixed position in camera space, slow rotation
 * 'camera-error' — camera permission denied or hardware not available
 * 'ar-error'     — AR engine failed (missing .mind file, etc.)
 */

const FALLBACK_DELAY_MS = 5000

export default function ARScene() {
  const containerRef = useRef(null)
  const mindarRef = useRef(null)
  const brainRef = useRef(null)
  const anchorRef = useRef(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const fallbackTimerRef = useRef(null)
  const startedRef = useRef(false)
  const modeRef = useRef('loading')

  const [mode, setModeState] = useState('loading')
  const [loadProgress, setLoadProgress] = useState(0)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [arErrorMsg, setArErrorMsg] = useState('')

  const setMode = useCallback((m) => {
    modeRef.current = m
    setModeState(m)
  }, [])

  const handleRegionSelect = useCallback((regionId) => {
    if (!brainRef.current) return
    setSelectedRegion(regionId)
    highlightRegion(brainRef.current, regionId)
  }, [])

  const handlePanelClose = useCallback(() => {
    setSelectedRegion(null)
    if (brainRef.current) resetHighlight(brainRef.current)
  }, [])

  useEffect(() => {
    // React 18 StrictMode double-invoke guard
    if (startedRef.current) return
    startedRef.current = true

    let mindar = null
    let cleanedUp = false

    function switchToSurface() {
      if (modeRef.current === 'marker') return
      if (!brainRef.current || !mindarRef.current) return

      const { scene } = mindarRef.current
      if (anchorRef.current?.group && brainRef.current.parent === anchorRef.current.group) {
        anchorRef.current.group.remove(brainRef.current)
      }
      scene.add(brainRef.current)
      // Place brain centered in front of camera
      brainRef.current.position.set(0, -0.5, -6)
      brainRef.current.visible = true
      setMode('surface')
    }

    async function init() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMode('camera-error')
        return
      }

      try {
        setMode('loading')

        // Load brain model first (with progress)
        const brain = await loadBrainModel((pct) => setLoadProgress(pct))
        if (cleanedUp) return
        brainRef.current = brain

        // Dynamically import mind-ar to keep it out of the initial bundle
        const mindarModule = await import('mind-ar/dist/mindar-image-three.prod.js')
        if (cleanedUp) return
        const MindARThree = mindarModule.MindARThree ?? mindarModule.default?.MindARThree

        mindar = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: '/targets/brain-target.mind',
          uiLoading: 'no',
          uiScanning: 'no',
          uiError: 'no',
          filterMinCF: 0.001,
          filterBeta: 0.001,
        })
        mindarRef.current = mindar

        const { renderer, scene, camera } = mindar

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 1.0)
        scene.add(ambient)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
        dirLight.position.set(3, 5, 5)
        scene.add(dirLight)
        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
        fillLight.position.set(-5, -2, -3)
        scene.add(fillLight)

        // Create anchor and attach brain
        const anchor = mindar.addAnchor(0)
        anchorRef.current = anchor
        anchor.group.add(brain)
        brain.visible = false

        anchor.onTargetFound = () => {
          clearTimeout(fallbackTimerRef.current)
          brain.visible = true
          setMode('marker')
        }

        anchor.onTargetLost = () => {
          brain.visible = false
          fallbackTimerRef.current = setTimeout(switchToSurface, FALLBACK_DELAY_MS)
        }

        // Raycasting (touch + click)
        const canvas = renderer.domElement
        function onInteract(e) {
          e.preventDefault()
          if (!brainRef.current) return
          const rect = canvas.getBoundingClientRect()
          const clientX = e.touches ? e.touches[0].clientX : e.clientX
          const clientY = e.touches ? e.touches[0].clientY : e.clientY
          const x = ((clientX - rect.left) / rect.width) * 2 - 1
          const y = -((clientY - rect.top) / rect.height) * 2 + 1
          raycasterRef.current.setFromCamera({ x, y }, camera)
          const meshes = []
          brainRef.current.traverse(obj => { if (obj.isMesh) meshes.push(obj) })
          const hits = raycasterRef.current.intersectObjects(meshes, false)
          if (hits.length > 0) {
            const regionId = hits[0].object.userData.regionId
            if (regionId) handleRegionSelect(regionId)
          }
        }
        canvas.addEventListener('click', onInteract)
        canvas.addEventListener('touchstart', onInteract, { passive: false })

        // Render loop
        let rotationY = 0
        renderer.setAnimationLoop(() => {
          if (modeRef.current === 'surface' && brainRef.current) {
            rotationY += 0.004
            brainRef.current.rotation.y = rotationY
          }
          renderer.render(scene, camera)
        })

        // Start AR engine (requests camera permission here)
        await mindar.start()
        if (cleanedUp) return

        setMode('scanning')
        // Start fallback timer immediately — if marker not found in 5s, go to surface mode
        fallbackTimerRef.current = setTimeout(switchToSurface, FALLBACK_DELAY_MS)

      } catch (err) {
        if (cleanedUp) return
        console.error('[NeuroExplora] AR init error:', err)
        const isCameraErr =
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError' ||
          err.name === 'NotFoundError' ||
          err.name === 'DevicesNotFoundError' ||
          (err.message && /camera|permission/i.test(err.message))

        if (isCameraErr) {
          setMode('camera-error')
        } else {
          setMode('ar-error')
          setArErrorMsg(err?.message || err?.toString() || 'Error desconocido')
        }
      }
    }

    init()

    return () => {
      cleanedUp = true
      clearTimeout(fallbackTimerRef.current)
      if (mindar) {
        mindar.renderer?.setAnimationLoop(null)
        try { mindar.stop() } catch (_) { /* ignore */ }
      }
      startedRef.current = false
    }
  }, [setMode, handleRegionSelect])

  return (
    <div className="absolute inset-0 bg-gray-950 overflow-hidden">
      {/* MindARThree mounts video + canvas into this div */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {mode === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 z-20 gap-5">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#1f2937" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none" stroke="#00d4ff" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - loadProgress / 100)}`}
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-cyan-400 text-sm font-bold">
              {loadProgress}%
            </span>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold mb-1">Cargando NeuroExplora</p>
            <p className="text-gray-500 text-sm">Preparando el modelo cerebral…</p>
          </div>
        </div>
      )}

      {/* Camera error */}
      {mode === 'camera-error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-20 px-8 gap-5">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <CameraOffIcon className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-center">
            <h2 className="text-white text-lg font-bold mb-2">Cámara no disponible</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              La Realidad Aumentada requiere acceso a la cámara. Permite el acceso en la configuración
              de tu navegador y recarga la página.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-cyan-500 text-gray-950 font-bold rounded-xl"
          >
            Recargar página
          </button>
        </div>
      )}

      {/* AR engine error (missing .mind file) */}
      {mode === 'ar-error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-20 px-8 gap-5">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
            <WarnIcon className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="text-center">
            <h2 className="text-white text-lg font-bold mb-2">Error al iniciar AR</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              El motor de realidad aumentada no pudo iniciarse.
            </p>
          </div>
          {arErrorMsg && (
            <div className="p-4 bg-gray-800/60 rounded-xl border border-red-700/50 w-full max-w-xs text-xs text-red-300 font-mono leading-relaxed break-all">
              {arErrorMsg}
            </div>
          )}
        </div>
      )}

      {/* Mode indicator (scanning / marker / surface) */}
      {(mode === 'scanning' || mode === 'marker' || mode === 'surface') && (
        <div className="absolute top-4 left-0 right-0 flex justify-center z-20 px-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-sm border
            ${mode === 'marker'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : mode === 'surface'
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                : 'bg-gray-800/70 border-gray-700 text-gray-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              mode === 'marker' ? 'bg-emerald-400 animate-pulse' :
              mode === 'surface' ? 'bg-cyan-400' :
              'bg-gray-400 animate-pulse'
            }`} />
            {mode === 'scanning' && 'Buscando marcador…'}
            {mode === 'marker' && 'Marcador detectado'}
            {mode === 'surface' && 'Modo libre — toca una región'}
          </div>
        </div>
      )}

      {/* Touch hint (shown in surface mode when nothing is selected) */}
      {mode === 'surface' && !selectedRegion && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20 px-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-950/70 backdrop-blur-sm border border-gray-800 text-gray-400 text-xs animate-bounce">
            <TouchIcon className="w-4 h-4" />
            Toca una región del cerebro
          </div>
        </div>
      )}

      {/* Scanning frame (shown while looking for marker) */}
      {mode === 'scanning' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="relative w-56 h-56">
            {/* Corner brackets */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
              <div
                key={pos}
                className={`absolute w-8 h-8 border-cyan-400 opacity-60
                  ${pos === 'top-left' ? 'top-0 left-0 border-t-2 border-l-2 rounded-tl-lg' : ''}
                  ${pos === 'top-right' ? 'top-0 right-0 border-t-2 border-r-2 rounded-tr-lg' : ''}
                  ${pos === 'bottom-left' ? 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg' : ''}
                  ${pos === 'bottom-right' ? 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg' : ''}
                `}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info panel */}
      {selectedRegion && (
        <InfoPanel
          region={BRAIN_REGIONS[selectedRegion]}
          onClose={handlePanelClose}
        />
      )}
    </div>
  )
}

function CameraOffIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function WarnIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
    </svg>
  )
}

function TouchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  )
}
