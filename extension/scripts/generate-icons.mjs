// Placeholder icon generator.
//
// Produces 16/32/48/128px PNGs at extension/public/icons/.
// The design canvas calls for a black tile with an italic serif "v" — we
// approximate this with a pure-JS PNG writer (no native deps, no sharp) so
// `npm install` doesn't pull a 100MB compiler.
//
// REPLACE THESE BEFORE PUBLIC LAUNCH — they're placeholders. See README.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'public', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

// PNG colour palette (RGBA).
const BG = [0x15, 0x14, 0x0f, 0xff];   // #15140f — near-black brand tile
const FG = [0xf6, 0xf3, 0xee, 0xff];   // #f6f3ee — off-white

// CRC32 table (used by the PNG writer for chunk checksums).
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(size, drawPixel) {
  // RGBA pixels with a leading filter byte per scanline.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = drawPixel(x, y, size);
      raw[p++] = r;
      raw[p++] = g;
      raw[p++] = b;
      raw[p++] = a;
    }
  }
  const compressed = deflateSync(raw);

  // PNG signature.
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr[8] = 8;                  // bit depth
  ihdr[9] = 6;                  // colour type: RGBA
  ihdr[10] = 0;                 // compression
  ihdr[11] = 0;                 // filter
  ihdr[12] = 0;                 // interlace

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Draw an italic-ish "v" via a simple geometric mask: two diagonals meeting
// at the bottom. Not pretty but recognisable at 16px.
function pixelAt(x, y, size) {
  // Inset for the tile background to give a small black border.
  const inset = Math.max(1, Math.floor(size * 0.08));
  if (x < inset || x >= size - inset || y < inset || y >= size - inset) {
    return BG;
  }

  // Normalise to 0..1 within the inner area.
  const nx = (x - inset) / (size - 2 * inset);
  const ny = (y - inset) / (size - 2 * inset);

  // V-shape: two thick diagonals from top corners meeting at bottom centre.
  // Italic-ish lean by shifting x by 0.1 * (1 - ny).
  const lean = 0.08 * (1 - ny);
  const cx = 0.5 + lean;

  // Left stroke goes from (0.15, 0.15) → (cx, 0.85)
  // Right stroke goes from (0.85, 0.15) → (cx, 0.85)
  const tLeft = (ny - 0.15) / (0.85 - 0.15);
  const xLeft = 0.15 + tLeft * (cx - 0.15);
  const xRight = 0.85 + tLeft * (cx - 0.85);

  const thickness = 0.13;
  const onLeft = Math.abs(nx - xLeft) < thickness / 2;
  const onRight = Math.abs(nx - xRight) < thickness / 2;

  if (ny >= 0.1 && ny <= 0.9 && (onLeft || onRight)) {
    return FG;
  }
  return BG;
}

const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const png = makePng(size, pixelAt);
  const path = resolve(OUT_DIR, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`wrote ${path} (${png.length} bytes)`);
}

console.log('Done — placeholder icons generated.');
