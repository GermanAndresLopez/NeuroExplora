import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- CRC32 ---
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function u32be(val) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(val >>> 0, 0);
  return b;
}

function chunk(type, data) {
  const typeB = Buffer.from(type, 'ascii');
  const crcVal = crc32(Buffer.concat([typeB, data]));
  return Buffer.concat([u32be(data.length), typeB, data, u32be(crcVal)]);
}

// --- Marker design (300x300 grayscale) ---
const W = 300, H = 300;
const img = new Uint8Array(W * H).fill(255); // white bg

function setPixel(x, y, v) {
  if (x >= 0 && x < W && y >= 0 && y < H) img[y * W + x] = v;
}

function fillRect(x0, y0, w, h, v) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setPixel(x0 + dx, y0 + dy, v);
}

function strokeRect(x0, y0, w, h, t, v) {
  fillRect(x0, y0, w, t, v);
  fillRect(x0, y0 + h - t, w, t, v);
  fillRect(x0, y0, t, h, v);
  fillRect(x0 + w - t, y0, t, h, v);
}

function fillCircle(cx, cy, r, v) {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++)
      if (dx * dx + dy * dy <= r * r) setPixel(cx + dx, cy + dy, v);
}

function drawLine(x0, y0, x1, y1, v) {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    setPixel(x0, y0, v);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx)  { err += dx; y0 += sy; }
  }
}

// Outer border
strokeRect(0, 0, W, H, 3, 0);

// === Corner anchors (like QR code) ===
// Top-left
fillRect(8, 8, 40, 40, 0);
fillRect(13, 13, 30, 30, 255);
fillRect(18, 18, 20, 20, 0);

// Top-right (asymmetric: add inner dot)
fillRect(W-48, 8, 40, 40, 0);
fillRect(W-43, 13, 30, 30, 255);
fillRect(W-38, 18, 20, 20, 0);
fillRect(W-32, 22, 8, 8, 0); // extra inner dot — breaks symmetry with TL

// Bottom-left (asymmetric: L-shape cutout)
fillRect(8, H-48, 40, 40, 0);
fillRect(13, H-43, 30, 30, 255);
fillRect(18, H-38, 20, 20, 0);
fillRect(8, H-22, 12, 12, 255); // cuts corner

// Bottom-right: no anchor on purpose → unique corner

// === Central brain silhouette (simplified lobe outline) ===
const bx = 150, by = 145; // center
fillCircle(bx - 20, by - 15, 38, 0); // left hemisphere
fillCircle(bx + 20, by - 15, 38, 0); // right hemisphere
fillCircle(bx - 20, by - 15, 30, 255);
fillCircle(bx + 20, by - 15, 30, 255);
// brain stem
fillRect(bx - 8, by + 22, 16, 20, 0);
fillRect(bx - 5, by + 25, 10, 14, 255);
// corpus callosum hint
fillRect(bx - 15, by - 18, 30, 4, 0);
// sulci lines
drawLine(bx - 8, by - 40, bx - 12, by - 20, 0);
drawLine(bx + 8, by - 40, bx + 14, by - 22, 0);
drawLine(bx - 25, by - 28, bx - 30, by - 10, 0);
drawLine(bx + 25, by - 28, bx + 30, by - 10, 0);

// === Feature dots (Fibonacci spiral, asymmetric) ===
const PHI = 1.6180339887;
const dots = [
  [55, 130], [55, 170], [55, 210], [55, 250],
  [245, 130], [245, 170], [245, 210], [245, 250],
  [90, 255], [130, 265], [170, 265], [210, 255],
  [90, 35], [130, 25], [210, 35],
  [265, 60], [270, 100], [30, 60], [25, 100],
];
for (const [x, y] of dots) fillCircle(x, y, 5, 0);

// === Asymmetric texture patches ===
// Top center: horizontal bars
for (let i = 0; i < 5; i++) fillRect(110 + i * 16, 12, 8, 14, 0);

// Right side: diagonal hash
for (let i = 0; i < 7; i++) {
  drawLine(255, 120 + i * 16, 272, 110 + i * 16, 0);
}

// Left side: vertical bars
for (let i = 0; i < 4; i++) fillRect(12, 120 + i * 20, 14, 10, 0);

// Bottom center: checker 2x2
for (let r = 0; r < 3; r++)
  for (let c = 0; c < 5; c++)
    if ((r + c) % 2 === 0) fillRect(105 + c * 18, H - 30, 12, 12, 0);

// === Corner decoration BR (replaces missing anchor) ===
drawLine(W-48, H-8, W-8, H-48, 0);
drawLine(W-44, H-8, W-8, H-44, 0);
fillCircle(W-28, H-28, 10, 0);
fillCircle(W-28, H-28, 6, 255);

// --- Build PNG ---
const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const ihdrData = Buffer.allocUnsafe(13);
ihdrData.writeUInt32BE(W, 0);
ihdrData.writeUInt32BE(H, 4);
ihdrData[8] = 8;   // bit depth
ihdrData[9] = 0;   // grayscale
ihdrData[10] = 0;  // compression
ihdrData[11] = 0;  // filter
ihdrData[12] = 0;  // interlace

// Raw image data with filter bytes
const rawRows = Buffer.allocUnsafe(H * (1 + W));
for (let y = 0; y < H; y++) {
  rawRows[y * (1 + W)] = 0; // filter type: none
  for (let x = 0; x < W; x++) rawRows[y * (1 + W) + 1 + x] = img[y * W + x];
}

const compressed = deflateSync(rawRows, { level: 9 });

const pngBuffer = Buffer.concat([
  PNG_SIG,
  chunk('IHDR', ihdrData),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
]);

const outPath = join(__dirname, '../public/targets/brain-marker.png');
writeFileSync(outPath, pngBuffer);
console.log(`✓ brain-marker.png generado (${W}x${H}px) → ${outPath}`);
console.log('  Siguiente paso: abrir scripts/compile-target.html en el navegador para compilar a .mind');
