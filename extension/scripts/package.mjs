// Package the built extension into a single downloadable ZIP.
//
// Output: `extension/visa-master-v<version>.zip`, containing one folder named
// `visa-master-v<version>/` so when a user double-clicks the ZIP they get a
// single tidy folder ready to "Load unpacked" in chrome://extensions.
//
// Why pure-Node (no `archiver` / `JSZip` dependency):
//   - The project's icon generator (`generate-icons.mjs`) already established
//     the "no native deps, no compilers" ethos so `npm install` stays small.
//   - The ZIP format spec (PKWARE APPNOTE.TXT) is short enough that a
//     local-file-header + central-directory writer fits in <200 lines, and
//     Node's built-in `zlib.deflateRawSync` provides the compression.
//   - Avoids one more transitive-dependency supply-chain surface.
//
// Run with: `npm run package` (after `npm run build`).

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const PKG = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const MANIFEST = JSON.parse(readFileSync(resolve(DIST, 'manifest.json'), 'utf8'));

// Use manifest.json's version (the source of truth for Chrome).
const VERSION = MANIFEST.version || PKG.version || '0.0.0';
const NAME = 'visa-master';
const FOLDER_NAME = `${NAME}-v${VERSION}`;          // folder name inside the ZIP
const OUT_PATH = resolve(ROOT, `${FOLDER_NAME}.zip`);

// ---------- CRC32 ----------
//
// IEEE 802.3 polynomial (0xedb88320, reversed). Same as the PNG writer in
// scripts/generate-icons.mjs but kept independent so each script stands alone.

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

// ---------- Filesystem walk ----------

function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full, base));
    } else if (stat.isFile()) {
      out.push({
        absPath: full,
        relPath: relative(base, full).split(sep).join('/'), // ZIP spec: forward slashes
        size: stat.size,
        mtime: stat.mtime,
      });
    }
  }
  return out.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

// ---------- DOS time/date (ZIP epoch is 1980-01-01) ----------

function dosTime(date) {
  return (
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getSeconds() / 2) & 0x1f)
  );
}

function dosDate(date) {
  return (
    (((date.getFullYear() - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f)
  );
}

// ---------- ZIP encoder (STORE for tiny files, DEFLATE otherwise) ----------

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_END = 0x06054b50;
const METHOD_STORE = 0;
const METHOD_DEFLATE = 8;
const VERSION_NEEDED = 20;
// External attrs: 0o100644 (regular file, rw-r--r--) shifted to upper 16 bits.
const EXT_ATTR_FILE = (0o100644 << 16) >>> 0;

function buildZipBuffer(files, folderPrefix) {
  /** @type {Buffer[]} */
  const localChunks = [];
  /** @type {Buffer[]} */
  const centralChunks = [];
  let offset = 0;

  for (const f of files) {
    const data = readFileSync(f.absPath);
    const crc = crc32(data);

    // Try deflate; fall back to store if it doesn't shrink the data.
    let compressed = deflateRawSync(data, { level: 9 });
    let method = METHOD_DEFLATE;
    if (compressed.length >= data.length) {
      compressed = data;
      method = METHOD_STORE;
    }

    const nameInZip = `${folderPrefix}/${f.relPath}`;
    const nameBuf = Buffer.from(nameInZip, 'utf8');

    const time = dosTime(f.mtime);
    const date = dosDate(f.mtime);

    // ----- Local file header -----
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(SIG_LOCAL, 0);
    local.writeUInt16LE(VERSION_NEEDED, 4);     // version needed to extract
    local.writeUInt16LE(0x0800, 6);             // flags (bit 11 = UTF-8 filename)
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18); // compressed size
    local.writeUInt32LE(data.length, 22);       // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);                 // extra field length
    nameBuf.copy(local, 30);

    localChunks.push(local, compressed);
    const headerOffset = offset;
    offset += local.length + compressed.length;

    // ----- Central directory header -----
    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(SIG_CENTRAL, 0);
    central.writeUInt16LE(VERSION_NEEDED, 4);   // version made by
    central.writeUInt16LE(VERSION_NEEDED, 6);   // version needed to extract
    central.writeUInt16LE(0x0800, 8);           // flags
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);                // extra field length
    central.writeUInt16LE(0, 32);                // file comment length
    central.writeUInt16LE(0, 34);                // disk number start
    central.writeUInt16LE(0, 36);                // internal attrs
    central.writeUInt32LE(EXT_ATTR_FILE, 38);    // external attrs
    central.writeUInt32LE(headerOffset, 42);     // relative offset of local header
    nameBuf.copy(central, 46);
    centralChunks.push(central);
  }

  const localBuf = Buffer.concat(localChunks);
  const centralBuf = Buffer.concat(centralChunks);

  // ----- End of central directory -----
  const end = Buffer.alloc(22);
  end.writeUInt32LE(SIG_END, 0);
  end.writeUInt16LE(0, 4);                // disk number
  end.writeUInt16LE(0, 6);                // disk where central dir starts
  end.writeUInt16LE(files.length, 8);     // entries on this disk
  end.writeUInt16LE(files.length, 10);    // total entries
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(localBuf.length, 16); // central dir offset (after all local headers + data)
  end.writeUInt16LE(0, 20);               // comment length

  return Buffer.concat([localBuf, centralBuf, end]);
}

// ---------- Main ----------

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const files = walk(DIST);
if (files.length === 0) {
  console.error('ERROR: dist/ is empty. Run `npm run build` first.');
  process.exit(1);
}

const zip = buildZipBuffer(files, FOLDER_NAME);
writeFileSync(OUT_PATH, zip);

console.log(`✓ Packaged ${files.length} files into:`);
console.log(`  ${OUT_PATH}`);
console.log(`  ${fmtSize(zip.length)} compressed`);
console.log('');
console.log(`Unzipping produces one folder: ${FOLDER_NAME}/`);
console.log(`Users "Load unpacked" that folder in chrome://extensions.`);
