import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { loadBrainModel, highlightRegion, resetHighlight } from './BrainModel.js'
import { BRAIN_REGIONS } from '../data/brainRegions.js'
import InfoPanel from './InfoPanel.jsx'

const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function ARScene() {
  const containerRef   = useRef(null)
  const rendererRef    = useRef(null)
  const cameraRef      = useRef(null)
  const brainRef       = useRef(null)
  const controlsRef    = useRef(null)
  const raycasterRef   = useRef(new THREE.Raycaster())
  const startedRef     = useRef(false)

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

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    let raf       = null
    let cleanedUp = false
    const container = containerRef.current

    async function init() {
      const w = container.clientWidth
      const h = container.clientHeight

      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.001, 200)
      cameraRef.current = camera

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.setSize(w, h)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      rendererRef.current = renderer
      container.appendChild(renderer.domElement)

      scene.add(new THREE.AmbientLight(0xffffff, 0.7))
      const sun = new THREE.DirectionalLight(0xffffff, 1.1)
      sun.position.set(2, 4, 3)
      scene.add(sun)
      const fill = new THREE.DirectionalLight(0x6688cc, 0.35)
      fill.position.set(-3, -1, -2)
      scene.add(fill)

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

      const box    = new THREE.Box3().setFromObject(brain)
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = box.getSize(new THREE.Vector3()).length()
      const scale  = 1.8 / maxDim
      brain.scale.setScalar(scale)
      brain.position.copy(center.negate().multiplyScalar(scale))

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

      const canvas = renderer.domElement
      let pd = null
      canvas.addEventListener('pointerdown',  e => { pd = { x: e.clientX, y: e.clientY, t: Date.now() } })
      canvas.addEventListener('pointerup',    e => {
        if (!pd) return
        if (Math.hypot(e.clientX - pd.x, e.clientY - pd.y) < 10 && Date.now() - pd.t < 320)
          handleTap(e.clientX, e.clientY)
        pd = null
      })
      canvas.addEventListener('pointercancel', () => { pd = null })

      const onResize = () => {
        const w = container.clientWidth, h = container.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', onResize)

      const loop = () => {
        raf = requestAnimationFrame(loop)
        controls.update()
        renderer.render(scene, camera)
      }
      loop()
    }

    init().catch(err => {
      if (!cleanedUp) { setMode('error'); setErrorMsg(err?.message || String(err)) }
    })

    return () => {
      cleanedUp = true
      if (raf) cancelAnimationFrame(raf)
      controlsRef.current?.dispose()
      rendererRef.current?.domElement.remove()
      rendererRef.current?.dispose()
    }
  }, [handleTap])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#050508' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {mode === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#050508', gap: '16px',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid var(--accent)',
            borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontSize: '0.65rem', color: 'var(--accent)', fontFamily: "'Courier New', monospace" }}>
            CARGANDO MODELO... {loadProgress}%
          </p>
        </div>
      )}

      {mode === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#050508', padding: '24px', gap: '12px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '1.5rem' }}>⚠️</p>
          <p style={{ fontSize: '0.7rem', color: '#fff' }}>ERROR AL CARGAR</p>
          <p style={{ fontSize: '0.55rem', color: '#ff5555', fontFamily: "'Courier New', monospace", wordBreak: 'break-all' }}>
            {errorMsg}
          </p>
        </div>
      )}

      {mode === 'viewer' && !selectedRegion && (
        <div style={{
          position: 'absolute', top: 10, left: 0, right: 0, zIndex: 10,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            padding: '6px 14px',
            background: 'rgba(5,5,8,0.75)',
            border: '1px solid var(--accent-border)',
            fontSize: '0.5rem',
            color: 'rgba(232,232,240,0.7)',
            fontFamily: "'Courier New', monospace",
            letterSpacing: '0.05em',
          }}>
            {IS_MOBILE ? 'ARRASTRA · PELLIZCA · TOCA REGIÓN' : 'ARRASTRA · SCROLL · CLIC EN REGIÓN'}
          </div>
        </div>
      )}

      {selectedRegion && (
        <InfoPanel region={BRAIN_REGIONS[selectedRegion]} onClose={handlePanelClose} />
      )}
    </div>
  )
}
