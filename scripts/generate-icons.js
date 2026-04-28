// Generates PNG icons for the PWA manifest using only Node.js built-ins.
// Draws the ◈ diamond mark (two concentric diamond outlines + center dot) in gold on burgundy.

import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const x of buf) {
    c ^= x;
    for (let i = 0; i < 8; i++) c = (c & 1) ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([u32(data.length), t, data, crcBuf]);
}

function makeIcon(size) {
  const half = size / 2;

  // Geometry scaled to icon size
  const outerOuter = half * 0.86;  // outer edge of outer diamond ring
  const outerInner = half * 0.75;  // inner edge of outer diamond ring
  const innerOuter = half * 0.54;  // outer edge of inner diamond ring
  const innerInner = half * 0.46;  // inner edge of inner diamond ring
  const dotR      = half * 0.10;  // center dot radius

  const scanlines = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    for (let x = 0; x < size; x++) {
      const dx = x - half;
      const dy = y - half;
      const m  = Math.abs(dx) + Math.abs(dy); // Manhattan / diamond metric

      // Default: deep burgundy
      let [r, g, b] = [42, 21, 32];

      // Outer diamond ring
      if (m >= outerInner && m <= outerOuter) [r, g, b] = [212, 174, 88];
      // Inner diamond ring
      if (m >= innerInner && m <= innerOuter) [r, g, b] = [212, 174, 88];
      // Center dot (Euclidean circle)
      if (Math.sqrt(dx * dx + dy * dy) <= dotR) [r, g, b] = [212, 174, 88];

      row[1 + x * 3]     = r;
      row[1 + x * 3 + 1] = g;
      row[1 + x * 3 + 2] = b;
    }
    scanlines.push(row);
  }

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = pngChunk("IHDR", Buffer.concat([u32(size), u32(size), Buffer.from([8, 2, 0, 0, 0])]));
  const idat = pngChunk("IDAT", deflateSync(Buffer.concat(scanlines)));
  const iend = pngChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

mkdirSync("public", { recursive: true });

for (const size of [180, 192, 512]) {
  const path = `public/icon-${size}.png`;
  writeFileSync(path, makeIcon(size));
  console.log(`Generated ${path}`);
}
