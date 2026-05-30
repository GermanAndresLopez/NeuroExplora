import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { loadBrainModel, highlightRegion, resetHighlight } from './BrainModel.js'
import { BRAIN_REGIONS } from '../data/brainRegions.js'
import InfoPanel from './InfoPanel.jsx'

// Status: checking → starting → scanning → placed | error | unsupported
export default function ARSceneXR({ onExit }) {
  const containerRef    = useRef(null)
  const overlayRef      = useRef(null)
  const [status, setStatus]               = useState('checking')
  const [errorMsg, setErrorMsg]           = useState('')
  const [selectedRegion, setSelectedRegion] = useState(null)
  const brainRef        = useRef(null)
  const highlightFnRef  = useRef(null)
  const resetFnRef      = useRef(null)

  const closePanel = useCallback(() => {
    setSelectedRegion(null)
    if (brainRef.current) resetHighlight(brainRef.current)
  }, [])

  useEffect(() => {
    let renderer   = null
    let session    = null
    let hitTestSrc = null
    let cleanedUp  = false
    let brainPlaced = false
    let reticle    = null
    let brain      = null
    const raycaster = new THREE.Raycaster()

    async function init() {
      // ── Check WebXR AR support ────────────────────────────────────────
      if (!navigator.xr) { setStatus('unsupported'); return }
      const ok = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false)
      if (!ok) { setStatus('unsupported'); return }

      setStatus('starting')

      // ── Scene ─────────────────────────────────────────────────────────
      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)

      // ── Renderer (must enable XR before session) ───────────────────────
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.xr.enabled = true
      containerRef.current.appendChild(renderer.domElement)

      // ── Lighting ──────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xffffff, 0.9))
      const sun = new THREE.DirectionalLight(0xffffff, 1.2)
      sun.position.set(2, 4, 3)
      scene.add(sun)

      // ── Load brain ────────────────────────────────────────────────────
      brain = await loadBrainModel()
      if (cleanedUp) return

      brainRef.current = brain

      // Scale to ~18cm in AR world units (meters)
      const box    = new THREE.Box3().setFromObject(brain)
      const maxDim = box.getSize(new THREE.Vector3()).length()
      const scale  = 0.18 / maxDim
      brain.scale.setScalar(scale)
      // Center model origin
      const center = box.getCenter(new THREE.Vector3())
      brain.position.copy(center.negate().multiplyScalar(scale))
      brain.visible = false
      scene.add(brain)

      // ── Reticle (pink ring for surface indicator) ─────────────────────
      const rGeom = new THREE.RingGeometry(0.06, 0.09, 32).rotateX(-Math.PI / 2)
      const rMat  = new THREE.MeshBasicMaterial({
        color: 0xe56c78, side: THREE.DoubleSide, transparent: true, opacity: 0.85,
      })
      reticle = new THREE.Mesh(rGeom, rMat)
      reticle.matrixAutoUpdate = false
      reticle.visible = false
      scene.add(reticle)

      // ── XR Session ────────────────────────────────────────────────────
      const sessionOpts = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: overlayRef.current },
      }
      session = await navigator.xr.requestSession('immersive-ar', sessionOpts)
      await renderer.xr.setSession(session)

      // Hit-test source (viewer space = direction user is looking)
      const viewerSpace = await session.requestReferenceSpace('viewer')
      hitTestSrc = await session.requestHitTestSource({ space: viewerSpace })

      setStatus('scanning')

      // ── Tap handler ───────────────────────────────────────────────────
      session.addEventListener('select', (event) => {
        const frame = event.frame
        if (!frame) return

        if (!brainPlaced) {
          // Place brain at reticle position on first tap
          if (reticle.visible) {
            const pos = new THREE.Vector3().setFromMatrixPosition(reticle.matrix)
            // Center offset: brain.position has the centering offset; place group here
            const wrapper = new THREE.Group()
            scene.remove(brain)
            wrapper.add(brain)
            brain.position.set(0, 0, 0)
            // Reset centering
            const b = new THREE.Box3().setFromObject(brain)
            const c = b.getCenter(new THREE.Vector3())
            brain.position.copy(c.negate())
            wrapper.position.copy(pos)
            scene.add(wrapper)
            brainRef.current = wrapper
            brain.visible = true
            brainPlaced = true
            reticle.visible = false
            // Cancel hit-test (no longer needed)
            hitTestSrc?.cancel?.()
            hitTestSrc = null
            setStatus('placed')
          }
          return
        }

        // ── After placed: tap to select brain regions ──────────────────
        const refSpace = renderer.xr.getReferenceSpace()
        const inputSource = event.inputSource
        if (!inputSource?.targetRaySpace) return
        const pose = frame.getPose(inputSource.targetRaySpace, refSpace)
        if (!pose) return

        const mat = new THREE.Matrix4().fromArray(pose.transform.matrix)
        const origin = new THREE.Vector3().setFromMatrixPosition(mat)
        const dir    = new THREE.Vector3(0, 0, -1).transformDirection(mat).normalize()

        raycaster.set(origin, dir)
        const meshes = []
        brainRef.current.traverse(o => { if (o.isMesh) meshes.push(o) })
        const hits = raycaster.intersectObjects(meshes, false)
        if (hits.length > 0 && hits[0].object.userData.regionId) {
          const rid = hits[0].object.userData.regionId
          if (brainRef.current) highlightRegion(brainRef.current, rid)
          setSelectedRegion(rid)
        } else {
          if (brainRef.current) resetHighlight(brainRef.current)
          setSelectedRegion(null)
        }
      })

      // Session end → call onExit
      session.addEventListener('end', () => {
        if (!cleanedUp) onExit?.()
      })

      // ── Render loop ───────────────────────────────────────────────────
      renderer.setAnimationLoop((timestamp, frame) => {
        if (frame && hitTestSrc) {
          const refSpace = renderer.xr.getReferenceSpace()
          const results  = frame.getHitTestResults(hitTestSrc)
          if (results.length > 0) {
            const pose = results[0].getPose(refSpace)
            if (pose) {
              reticle.visible = true
              reticle.matrix.fromArray(pose.transform.matrix)
            }
          } else {
            reticle.visible = false
          }
        }
        renderer.render(scene, camera)
      })
    }

    init().catch(err => {
      console.error('[ARSceneXR]', err)
      if (!cleanedUp) {
        setStatus('error')
        setErrorMsg(err?.message || String(err))
      }
    })

    return () => {
      cleanedUp = true
      renderer?.setAnimationLoop(null)
      hitTestSrc?.cancel?.()
      session?.end().catch(() => {})
      renderer?.domElement.remove()
      renderer?.dispose()
    }
  }, [onExit])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      {/* Three.js canvas goes here */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* DOM Overlay — shown on top of the AR camera feed */}
      <div ref={overlayRef} id="xr-overlay"
           style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }}>

        {/* Status: scanning */}
        {status === 'scanning' && (
          <div style={{
            position: 'absolute', bottom: 120, left: 0, right: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              padding: '8px 20px',
              background: 'rgba(5,5,8,0.82)',
              border: '1px solid var(--accent-border)',
              fontSize: '0.6rem',
              color: '#fff',
              fontFamily: "'Press Start 2P', monospace",
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              APUNTA A UNA SUPERFICIE<br />
              <span style={{ color: 'var(--accent)', fontSize: '0.55rem' }}>
                TOCA PARA COLOCAR EL CEREBRO
              </span>
            </div>
            {/* Animated scanner lines */}
            <ScannerAnim />
          </div>
        )}

        {/* Status: placed */}
        {status === 'placed' && !selectedRegion && (
          <div style={{
            position: 'absolute', bottom: 120, left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              padding: '6px 16px',
              background: 'rgba(5,5,8,0.75)',
              border: '1px solid var(--accent-border)',
              fontSize: '0.55rem',
              color: 'rgba(232,232,240,0.8)',
              fontFamily: "'Courier New', monospace",
            }}>
              MUEVE EL CELULAR · TOCA EL CEREBRO PARA EXPLORAR
            </div>
          </div>
        )}

        {/* Exit button */}
        {(status === 'scanning' || status === 'placed') && (
          <button
            onClick={onExit}
            style={{
              position: 'absolute', top: 16, right: 16,
              padding: '8px 14px',
              background: 'rgba(5,5,8,0.85)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
              fontSize: '0.6rem',
              fontFamily: "'Press Start 2P', monospace",
              letterSpacing: '0.05em',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            × SALIR
          </button>
        )}

        {/* Info panel */}
        {selectedRegion && (
          <div style={{ pointerEvents: 'auto' }}>
            <InfoPanel region={BRAIN_REGIONS[selectedRegion]} onClose={closePanel} />
          </div>
        )}
      </div>

      {/* States that show before AR starts */}
      {status === 'checking' && <LoadingOverlay msg="VERIFICANDO SOPORTE AR..." />}
      {status === 'starting' && <LoadingOverlay msg="INICIANDO CÁMARA..." />}

      {status === 'unsupported' && (
        <MessageOverlay
          icon="📵"
          title="AR NO DISPONIBLE"
          body="Tu dispositivo o navegador no soporta WebXR AR. Necesitas Android Chrome con ARCore activado."
          onAction={onExit}
          actionLabel="> USAR VISTA 3D"
        />
      )}

      {status === 'error' && (
        <MessageOverlay
          icon="⚠️"
          title="ERROR AR"
          body={errorMsg}
          onAction={onExit}
          actionLabel="> VOLVER"
        />
      )}
    </div>
  )
}

function LoadingOverlay({ msg }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 30,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#050508', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '3px solid var(--accent)',
        borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ fontSize: '0.6rem', color: 'var(--accent)', fontFamily: "'Courier New', monospace", letterSpacing: '0.1em' }}>
        {msg}
      </p>
    </div>
  )
}

function MessageOverlay({ icon, title, body, onAction, actionLabel }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 30,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#050508', padding: 32, gap: 16, textAlign: 'center',
    }}>
      <p style={{ fontSize: '2.5rem' }}>{icon}</p>
      <p style={{ fontSize: '0.75rem', color: '#fff', letterSpacing: '0.1em' }}>{title}</p>
      <p style={{ fontSize: '0.55rem', color: 'var(--text-dim)', fontFamily: "'Courier New', monospace", lineHeight: 1.8, maxWidth: 300 }}>
        {body}
      </p>
      <button
        onClick={onAction}
        className="pixel-btn"
        style={{
          marginTop: 8, padding: '12px 24px',
          fontSize: '0.65rem',
          background: 'var(--accent)', color: '#050508',
          border: '2px solid var(--accent)',
          boxShadow: '4px 4px 0 var(--accent-border)',
          cursor: 'pointer',
        }}
      >
        {actionLabel}
      </button>
    </div>
  )
}

function ScannerAnim() {
  return (
    <div style={{ position: 'relative', width: 120, height: 120 }}>
      {/* Corner brackets */}
      {[
        { top: 0,  left:  0,  borderTop: '2px solid var(--accent)', borderLeft:  '2px solid var(--accent)' },
        { top: 0,  right: 0,  borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' },
        { bottom: 0, left: 0, borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' },
        { bottom: 0, right: 0,borderBottom: '2px solid var(--accent)', borderRight:'2px solid var(--accent)' },
      ].map((s, i) => (
        <span key={i} style={{ position: 'absolute', width: 16, height: 16, ...s }} />
      ))}
      {/* Scan line */}
      <div style={{
        position: 'absolute', left: 4, right: 4, height: 1,
        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        animation: 'scanY 1.6s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes scanY {
          0%   { top: 4px;   opacity: 0.3 }
          50%  { top: 108px; opacity: 1   }
          100% { top: 4px;   opacity: 0.3 }
        }
      `}</style>
    </div>
  )
}
