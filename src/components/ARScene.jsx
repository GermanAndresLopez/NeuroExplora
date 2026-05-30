import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { loadBrainModel, highlightRegion, resetHighlight } from './BrainModel.js'
import { BRAIN_REGIONS } from '../data/brainRegions.js'
import InfoPanel from './InfoPanel.jsx'

const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

function orientationToQuat(alpha, beta, gamma, screenAngle) {
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(beta),
    THREE.MathUtils.degToRad(alpha),
    THREE.MathUtils.degToRad(-gamma),
    'YXZ'
  )
  const q  = new THREE.Quaternion().setFromEuler(euler)
  const q0 = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2)
  const qz = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    -THREE.MathUtils.degToRad(screenAngle)
  )
  return q.multiply(qz).premultiply(q0)
}

export default function ARScene() {
  const containerRef   = useRef(null)
  const videoRef       = useRef(null)
  const rendererRef    = useRef(null)
  const cameraRef      = useRef(null)
  const brainRef       = useRef(null)
  const controlsRef    = useRef(null)
  const raycasterRef   = useRef(new THREE.Raycaster())
  const startedRef     = useRef(false)
  const deviceQuatRef  = useRef(new THREE.Quaternion())
  const arActiveRef    = useRef(false)
  const brainScaleRef  = useRef(1)

  const [mode, setMode]                     = useState('loading')
  const [loadProgress, setLoadProgress]     = useState(0)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [errorMsg, setErrorMsg]             = useState('')

  const handleRegionSelect = useCallback((regionId) => {
    setSelectedRegion(regionId)
    if (brainRef.current) highlightRegion(brainRef.current, regionId)
  }, [])

  const handlePanelClose = useCallback(() => {
    setSelectedRegion(null)
    if (brainRef.current) resetHighlight(brainRef.current)
  }, [])

  const handleTap = useCallback((clientX, clientY) => {
    if (!brainRef.current || !cameraRef.current || !rendererRef.current) return
    const canvas = rendererRef.current.domElement
    const rect   = canvas.getBoundingClientRect()
    const ndc    = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  *  2 - 1,
      ((clientY - rect.top)  / rect.height) * -2 + 1
    )
    raycasterRef.current.setFromCamera(ndc, cameraRef.current)
    const meshes = []
    brainRef.current.traverse(o => { if (o.isMesh) meshes.push(o) })
    const hits = raycasterRef.current.intersectObjects(meshes, false)
    if (hits.length > 0) {
      const rid = hits[0].object.userData.regionId
      if (rid) handleRegionSelect(rid)
    }
  }, [handleRegionSelect])

  // ── Three.js init ──────────────────────────────────────────────────────
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    let raf       = null
    let cleanedUp = false
    const container = containerRef.current

    async function init() {
      const w = container.clientWidth
      const h = container.clientHeight

      const scene    = new THREE.Scene()
      const camera   = new THREE.PerspectiveCamera(55, w / h, 0.001, 200)
      cameraRef.current = camera

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.setSize(w, h)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      rendererRef.current = renderer
      container.appendChild(renderer.domElement)

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 0.7))
      const sun = new THREE.DirectionalLight(0xffffff, 1.1)
      sun.position.set(2, 4, 3)
      scene.add(sun)
      scene.add(Object.assign(new THREE.DirectionalLight(0x6688cc, 0.35), {
        position: new THREE.Vector3(-3, -1, -2)
      }))

      // Load model
      let brain
      try {
        brain = await loadBrainModel(p => setLoadProgress(p))
        if (cleanedUp) return
      } catch (err) {
        if (!cleanedUp) { setMode('error'); setErrorMsg(err?.message || String(err)) }
        return
      }

      brainRef.current = brain
      scene.add(brain)

      // Auto-scale & center
      const box    = new THREE.Box3().setFromObject(brain)
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = box.getSize(new THREE.Vector3()).length()
      const scale  = 1.8 / maxDim
      brainScaleRef.current = scale
      brain.scale.setScalar(scale)
      brain.position.copy(center.negate().multiplyScalar(scale))

      // Camera & OrbitControls
      camera.position.set(0, 0.1, 2.4)
      camera.lookAt(0, 0, 0)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.07
      controls.minDistance   = 0.6
      controls.maxDistance   = 6
      controls.target.set(0, 0, 0)
      controls.update()
      controlsRef.current = controls

      setMode('viewer')

      // Tap detection (ignore drags)
      const canvas = renderer.domElement
      let pd = null
      const onDown = e => { pd = { x: e.clientX, y: e.clientY, t: Date.now() } }
      const onUp   = e => {
        if (!pd) return
        if (Math.hypot(e.clientX - pd.x, e.clientY - pd.y) < 10 && Date.now() - pd.t < 320)
          handleTap(e.clientX, e.clientY)
        pd = null
      }
      canvas.addEventListener('pointerdown',  onDown)
      canvas.addEventListener('pointerup',    onUp)
      canvas.addEventListener('pointercancel', () => { pd = null })

      // Resize
      const onResize = () => {
        const w = container.clientWidth, h = container.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', onResize)

      // Render loop
      const loop = () => {
        raf = requestAnimationFrame(loop)
        if (arActiveRef.current) {
          camera.quaternion.copy(deviceQuatRef.current)
        } else {
          controls.update()
        }
        renderer.render(scene, camera)
      }
      loop()
    }

    init()

    return () => {
      cleanedUp = true
      if (raf) cancelAnimationFrame(raf)
      controlsRef.current?.dispose()
      rendererRef.current?.domElement.remove()
      rendererRef.current?.dispose()
    }
  }, [handleTap])

  // ── Activate AR (must be called from user gesture for iOS perm) ────────
  const activateAR = useCallback(async () => {
    const camera   = cameraRef.current
    const brain    = brainRef.current
    const controls = controlsRef.current
    if (!camera || !brain) return

    try {
      // Camera
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      videoRef.current.srcObject = s
      await videoRef.current.play()

      // iOS device orientation permission
      if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
        const p = await DeviceOrientationEvent.requestPermission()
        if (p !== 'granted') throw new Error('Permiso de orientación denegado')
      }

      // Disable orbit controls
      if (controls) controls.enabled = false

      // Reset camera — device orientation will drive it
      camera.position.set(0, 0, 0)
      camera.quaternion.identity()

      // Place brain 1.5 units in front, slightly below "eye level"
      brain.position.set(0, -0.5, -1.5)

      // Device orientation listener
      const screenAngle = window.screen?.orientation?.angle ?? 0
      const onOrient = evt => {
        if (evt.alpha == null) return
        deviceQuatRef.current.copy(
          orientationToQuat(evt.alpha, evt.beta, evt.gamma, screenAngle)
        )
      }
      window.addEventListener('deviceorientation', onOrient, true)

      arActiveRef.current = true
      setMode('ar')
    } catch (err) {
      console.warn('AR failed:', err.message)
      setErrorMsg('No se pudo activar AR: ' + (err.message || err))
    }
  }, [])

  const exitAR = useCallback(() => {
    arActiveRef.current = false

    // Stop camera
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }

    // Restore viewer
    const camera   = cameraRef.current
    const brain    = brainRef.current
    const controls = controlsRef.current

    if (camera) { camera.position.set(0, 0.1, 2.4); camera.lookAt(0, 0, 0) }
    if (brain) {
      const box = new THREE.Box3().setFromObject(brain)
      brain.position.copy(box.getCenter(new THREE.Vector3()).negate())
    }
    if (controls) { controls.enabled = true; controls.target.set(0, 0, 0); controls.update() }

    setMode('viewer')
  }, [])

  // ── JSX ────────────────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 overflow-hidden bg-gray-950">

      {/* Camera background (AR) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: mode === 'ar' ? 'block' : 'none', zIndex: 0 }}
        autoPlay playsInline muted
      />

      {/* Three.js renders here */}
      <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 1 }} />

      {/* Loading */}
      {mode === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-20 gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-cyan-400 text-sm font-mono">{loadProgress}%</p>
          <p className="text-gray-500 text-xs">Cargando modelo cerebral…</p>
        </div>
      )}

      {/* Error */}
      {mode === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-20 px-8 gap-3">
          <p className="text-4xl">⚠️</p>
          <p className="text-white font-bold">Error al cargar el modelo</p>
          <p className="text-red-400 text-xs font-mono text-center break-all">{errorMsg}</p>
        </div>
      )}

      {/* Viewer hints + AR button */}
      {mode === 'viewer' && !selectedRegion && (
        <div className="absolute top-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="px-4 py-1.5 rounded-full bg-black/55 text-white/75 text-xs backdrop-blur-sm">
            {IS_MOBILE
              ? 'Arrastra · Pellizca para zoom · Toca una región'
              : 'Arrastra para rotar · Scroll para zoom · Clic en una región'}
          </div>
        </div>
      )}

      {mode === 'viewer' && IS_MOBILE && (
        <button
          onClick={activateAR}
          className="absolute bottom-20 right-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full bg-cyan-500 text-gray-950 text-sm font-bold shadow-lg active:scale-95 transition-transform"
        >
          <CameraIcon /> AR
        </button>
      )}

      {/* AR hints + exit */}
      {mode === 'ar' && (
        <>
          {!selectedRegion && (
            <div className="absolute top-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
              <div className="px-4 py-1.5 rounded-full bg-black/55 text-white/75 text-xs backdrop-blur-sm">
                Apunta al suelo · Toca una región para explorar
              </div>
            </div>
          )}
          <button
            onClick={exitAR}
            className="absolute top-3 right-4 z-10 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm active:scale-95"
          >
            ✕ Salir AR
          </button>
        </>
      )}

      {/* Info panel */}
      {selectedRegion && (
        <InfoPanel region={BRAIN_REGIONS[selectedRegion]} onClose={handlePanelClose} />
      )}
    </div>
  )
}

function CameraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
