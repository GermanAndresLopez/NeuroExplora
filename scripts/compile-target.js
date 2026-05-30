// Compiles public/targets/brain-marker.png → public/targets/brain-target.mind
// Run with: node --loader ./scripts/canvas-loader.mjs scripts/compile-target.js
//
// Uses a pure-JS PNG decoder + canvas shim (no Visual Studio / node-gyp needed).

import { readFileSync, writeFileSync } from 'fs';
import { inflateSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { OfflineCompiler } from 'mind-ar/src/image-target/offline-compiler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Minimal PNG decoder (grayscale + RGB + RGBA, all filter types) ---
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decodePNG(buf) {
  let pos = 8; // skip 8-byte signature
  let width, height, colorType;
  const idats = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos); pos += 4;
    const type = buf.toString('ascii', pos, pos + 4); pos += 4;
    const data = buf.slice(pos, pos + len); pos += len + 4;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9]; // 0=gray 2=RGB 6=RGBA
    } else if (type === 'IDAT') {
      idats.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const raw = inflateSync(Buffer.concat(idats));
  const ch = colorType === 2 ? 3 : colorType === 6 ? 4 : 1;
  const rowBytes = 1 + width * ch;
  const prev = new Uint8Array(width * ch);
  const rgba = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * rowBytes];
    const row = new Uint8Array(width * ch);

    for (let i = 0; i < width * ch; i++) {
      const x = raw[y * rowBytes + 1 + i];
      const a = i >= ch ? row[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      if      (filter === 0) row[i] = x;
      else if (filter === 1) row[i] = (x + a) & 0xFF;
      else if (filter === 2) row[i] = (x + b) & 0xFF;
      else if (filter === 3) row[i] = (x + Math.floor((a + b) / 2)) & 0xFF;
      else if (filter === 4) row[i] = (x + paeth(a, b, c)) & 0xFF;
    }

    prev.set(row);

    for (let x = 0; x < width; x++) {
      const s = x * ch, d = (y * width + x) * 4;
      if (colorType === 0) {
        rgba[d] = rgba[d+1] = rgba[d+2] = row[s]; rgba[d+3] = 255;
      } else if (colorType === 2) {
        rgba[d] = row[s]; rgba[d+1] = row[s+1]; rgba[d+2] = row[s+2]; rgba[d+3] = 255;
      } else if (colorType === 6) {
        rgba[d] = row[s]; rgba[d+1] = row[s+1]; rgba[d+2] = row[s+2]; rgba[d+3] = row[s+3];
      }
    }
  }

  return { width, height, _rgba: rgba };
}

// --- Main ---
async function main() {
  const imgPath = join(__dirname, '../public/targets/brain-marker.png');
  const outPath = join(__dirname, '../public/targets/brain-target.mind');

  console.log('Decodificando PNG...');
  const img = decodePNG(readFileSync(imgPath));
  console.log(`Imagen: ${img.width}x${img.height}px`);

  console.log('Compilando features AR (puede tardar 30-90s)...');
  const compiler = new OfflineCompiler();

  await compiler.compileImageTargets([img], (progress) => {
    const p = Math.round(progress);
    const bar = '█'.repeat(Math.floor(p / 5)).padEnd(20);
    process.stdout.write(`\r  ${String(p).padStart(3)}% [${bar}]`);
  });

  console.log('\nExportando...');
  const buffer = compiler.exportData();
  writeFileSync(outPath, Buffer.from(buffer));

  console.log(`✓ brain-target.mind (${(buffer.byteLength / 1024).toFixed(1)} KB) → ${outPath}`);
  console.log('\nAhora commitea:');
  console.log('  git add public/targets/brain-target.mind public/targets/brain-marker.png');
  console.log('  git commit -m "add: compiled AR marker target"');
  console.log('  git push');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
