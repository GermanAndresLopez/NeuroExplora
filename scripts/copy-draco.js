/**
 * Copies Draco WASM decoder files from three/examples into public/draco/
 * so DRACOLoader can decode Draco-compressed GLB files at runtime.
 *
 * Run once after npm install: node scripts/copy-draco.js
 */
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const require = createRequire(import.meta.url)
let threeMain
try {
  threeMain = require.resolve('three')
} catch {
  console.error('Error: "three" package not found. Run npm install first.')
  process.exit(1)
}

const threeRoot = resolve(dirname(threeMain), '..')
const dracoSrcDir = resolve(threeRoot, 'examples', 'jsm', 'libs', 'draco', 'gltf')
const dracoDstDir = resolve(__dirname, '..', 'public', 'draco')

const files = [
  'draco_decoder.wasm',
  'draco_decoder.js',
  'draco_wasm_wrapper.js',
]

if (!existsSync(dracoSrcDir)) {
  // Fallback: three/examples/jsm/libs/draco (non-gltf variant)
  console.warn(`GLTF Draco dir not found at ${dracoSrcDir}`)
  console.warn('Draco files may be in a different location for this version of three.js')
  process.exit(0)
}

mkdirSync(dracoDstDir, { recursive: true })

let copied = 0
for (const file of files) {
  const src = resolve(dracoSrcDir, file)
  const dst = resolve(dracoDstDir, file)
  if (existsSync(src)) {
    copyFileSync(src, dst)
    console.log(`  Copied: ${file}`)
    copied++
  } else {
    console.warn(`  Not found: ${file}`)
  }
}

if (copied > 0) {
  console.log(`\nDraco decoders copied to public/draco/ (${copied} files)`)
  console.log('DRACOLoader is now active for compressed GLB files.')
} else {
  console.warn('\nNo Draco files copied. The app will still work but Draco-compressed GLBs may not load.')
}
