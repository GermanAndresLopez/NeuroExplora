import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { BRAIN_REGIONS } from '../data/brainRegions.js'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const loader = new GLTFLoader()
loader.setDRACOLoader(dracoLoader)

const HIGHLIGHT_HEX = 0x00cfff
const DIM_OPACITY = 0.18

function normalizeName(name) {
  return name.toLowerCase().replace(/[\s_\-\.]/g, '')
}

function getRegionForMesh(meshName) {
  const n = normalizeName(meshName)

  // Check each region's keywords in priority order
  const regionPriority = ['frontal', 'parietal', 'temporal', 'occipital', 'cerebelo', 'tronco']
  for (const regionId of regionPriority) {
    const region = BRAIN_REGIONS[regionId]
    for (const keyword of region.meshKeywords) {
      if (n.includes(normalizeName(keyword))) {
        return regionId
      }
    }
  }

  return 'tronco' // default fallback
}

// Log all mesh names once on first load (helpful for dev mapping)
let meshNamesLogged = false

export function loadBrainModel(onProgress) {
  return new Promise((resolve, reject) => {
    const modelPath = '/models/cerebro-draco.glb'

    loader.load(
      modelPath,
      (gltf) => {
        const root = gltf.scene

        if (!meshNamesLogged) {
          meshNamesLogged = true
          const names = []
          root.traverse(obj => { if (obj.isMesh) names.push(obj.name) })
          console.log('[NeuroExplora] Brain mesh names:', names)
        }

        root.traverse(obj => {
          if (!obj.isMesh) return

          const regionId = getRegionForMesh(obj.name)
          obj.userData.regionId = regionId

          // Store original material (cloned to avoid shared state)
          const origMat = Array.isArray(obj.material)
            ? obj.material.map(m => m.clone())
            : obj.material.clone()
          obj.userData.originalMaterial = origMat

          // Pre-build highlight material
          const hlMat = Array.isArray(obj.material)
            ? obj.material.map(m => buildHighlightMat(m))
            : buildHighlightMat(obj.material)
          obj.userData.highlightMaterial = hlMat

          // Pre-build dim material
          const dimMat = Array.isArray(obj.material)
            ? obj.material.map(m => buildDimMat(m))
            : buildDimMat(obj.material)
          obj.userData.dimMaterial = dimMat
        })

        // Scale and orient for AR marker
        root.scale.setScalar(0.06)
        root.rotation.x = -0.15

        resolve(root)
      },
      (progress) => {
        if (onProgress && progress.total > 0) {
          onProgress(Math.round((progress.loaded / progress.total) * 100))
        }
      },
      reject
    )
  })
}

function buildHighlightMat(sourceMat) {
  const mat = sourceMat.clone()
  mat.color = new THREE.Color(HIGHLIGHT_HEX)
  if (mat.emissive !== undefined) {
    mat.emissive = new THREE.Color(0x0066aa)
    mat.emissiveIntensity = 0.7
  }
  mat.transparent = false
  mat.opacity = 1
  mat.depthWrite = true
  mat.needsUpdate = true
  return mat
}

function buildDimMat(sourceMat) {
  const mat = sourceMat.clone()
  mat.transparent = true
  mat.opacity = DIM_OPACITY
  mat.depthWrite = false
  mat.needsUpdate = true
  return mat
}

export function highlightRegion(root, regionId) {
  root.traverse(obj => {
    if (!obj.isMesh) return
    if (obj.userData.regionId === regionId) {
      obj.material = obj.userData.highlightMaterial
      obj.renderOrder = 1
    } else {
      obj.material = obj.userData.dimMaterial
      obj.renderOrder = 0
    }
  })
}

export function resetHighlight(root) {
  root.traverse(obj => {
    if (!obj.isMesh) return
    obj.material = obj.userData.originalMaterial
    obj.renderOrder = 0
  })
}
