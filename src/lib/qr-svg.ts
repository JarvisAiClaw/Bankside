/**
 * Minimal QR Code SVG encoder (byte mode, ECC level L, versions 1–4).
 * Enough for short invite URLs; no external dependency.
 */

const ECC_CODEWORDS = [7, 10, 15, 20]; // L for v1–4
const TOTAL_CODEWORDS = [26, 44, 70, 100];
const ALIGNMENT = [null, [6, 18], [6, 22], [6, 26]] as const;

function gfMul(a: number, b: number) {
  if (!a || !b) return 0;
  let r = 0;
  while (b) {
    if (b & 1) r ^= a;
    a = a << 1;
    if (a & 0x100) a ^= 0x11d;
    b >>= 1;
  }
  return r & 0xff;
}

function rsRemainder(data: number[], ecLen: number) {
  const gen = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= gfMul(gen[j], 1 << i); // α^i — wrong for proper RS; use proper below
    }
    // rebuild properly
  }
  // Proper generator poly for α^i
  let g = [1];
  for (let i = 0; i < ecLen; i++) {
    const ng = new Array(g.length + 1).fill(0);
    const alpha = exp[i];
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= gfMul(g[j], alpha);
    }
    g = ng;
  }
  const msg = data.concat(new Array(ecLen).fill(0));
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (!coef) continue;
    for (let j = 0; j < g.length; j++) msg[i + j] ^= gfMul(g[j], coef);
  }
  return msg.slice(data.length);
}

const exp = new Array(512);
const log = new Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
})();

function gfMul2(a: number, b: number) {
  if (a === 0 || b === 0) return 0;
  return exp[log[a] + log[b]];
}

function rsEncode(data: number[], ecLen: number) {
  let g = [1];
  for (let i = 0; i < ecLen; i++) {
    const ng = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j];
      ng[j + 1] ^= gfMul2(g[j], exp[i]);
    }
    g = ng;
  }
  const msg = data.concat(new Array(ecLen).fill(0));
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (!coef) continue;
    for (let j = 0; j < g.length; j++) msg[i + j] ^= gfMul2(g[j], coef);
  }
  return msg.slice(data.length);
}

function chooseVersion(len: number) {
  // byte mode: 4 mode + 8 count + 8*len + 4 terminator bits ≈
  const need = Math.ceil((4 + 8 + 8 * len + 4) / 8);
  for (let v = 1; v <= 4; v++) {
    if (need + ECC_CODEWORDS[v - 1] <= TOTAL_CODEWORDS[v - 1]) return v;
  }
  return 4;
}

function setFinder(mod: number[][], x: number, y: number) {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const xx = x + dx,
        yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= mod.length || yy >= mod.length) continue;
      const on =
        dx === -1 ||
        dy === -1 ||
        dx === 7 ||
        dy === 7 ||
        (dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 && (dx === 0 || dx === 6 || dy === 0 || dy === 6)) ||
        (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      mod[yy][xx] = on ? 1 : 0;
    }
  }
}

function setAlignment(mod: number[][], cx: number, cy: number) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const on = Math.max(Math.abs(dx), Math.abs(dy)) !== 1 || (dx === 0 && dy === 0);
      // ring pattern
      const ring = Math.max(Math.abs(dx), Math.abs(dy));
      mod[cy + dy][cx + dx] = ring === 0 || ring === 2 ? 1 : 0;
    }
  }
}

/** Encode text to a QR module matrix (0/1). Falls back to null if too long. */
export function qrModules(text: string): number[][] | null {
  const bytes = Array.from(new TextEncoder().encode(text));
  if (bytes.length > 80) return null;
  const version = chooseVersion(bytes.length);
  const size = 21 + (version - 1) * 4;
  const total = TOTAL_CODEWORDS[version - 1];
  const ecLen = ECC_CODEWORDS[version - 1];
  const dataLen = total - ecLen;

  // Bit buffer
  const bits: number[] = [];
  const put = (val: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  put(0b0100, 4); // byte
  put(bytes.length, 8);
  for (const b of bytes) put(b, 8);
  put(0, Math.min(4, dataLen * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | (bits[i + j] || 0);
    data.push(v);
  }
  const pads = [0xec, 0x11];
  let pi = 0;
  while (data.length < dataLen) data.push(pads[pi++ % 2]);
  const ec = rsEncode(data, ecLen);
  const code = data.concat(ec);

  const mod = Array.from({ length: size }, () => new Array(size).fill(-1));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const mark = (x: number, y: number, v: number) => {
    mod[y][x] = v;
    reserved[y][x] = true;
  };

  // Finders
  const paintFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const on = x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
        mark(ox + x, oy + y, on ? 1 : 0);
      }
    for (let i = -1; i <= 7; i++) {
      for (const [x, y] of [
        [ox + i, oy - 1],
        [ox + i, oy + 7],
        [ox - 1, oy + i],
        [ox + 7, oy + i],
      ] as const) {
        if (x >= 0 && y >= 0 && x < size && y < size) mark(x, y, 0);
      }
    }
  };
  paintFinder(0, 0);
  paintFinder(size - 7, 0);
  paintFinder(0, size - 7);

  // Timing
  for (let i = 8; i < size - 8; i++) {
    mark(i, 6, i % 2 === 0 ? 1 : 0);
    mark(6, i, i % 2 === 0 ? 1 : 0);
  }
  mark(8, size - 8, 1); // dark module

  // Alignment
  const aligns = ALIGNMENT[version - 1];
  if (aligns) {
    for (const cy of aligns) {
      for (const cx of aligns) {
        if ((cx <= 8 && cy <= 8) || (cx >= size - 9 && cy <= 8) || (cx <= 8 && cy >= size - 9)) continue;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const ring = Math.max(Math.abs(dx), Math.abs(dy));
            mark(cx + dx, cy + dy, ring === 0 || ring === 2 ? 1 : 0);
          }
      }
    }
  }

  // Reserve format info areas
  for (let i = 0; i < 9; i++) {
    if (i < size) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // Place data bits (mask 0 applied later in format; use mask 0: (r+c)%2==0)
  let bitIdx = 0;
  const codeBits: number[] = [];
  for (const c of code) for (let i = 7; i >= 0; i--) codeBits.push((c >> i) & 1);

  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5;
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (const c of [col, col - 1]) {
        if (reserved[row][c] || mod[row][c] !== -1) continue;
        const bit = codeBits[bitIdx++] ?? 0;
        const mask = (row + c) % 2 === 0 ? 1 : 0; // mask 0
        mod[row][c] = bit ^ mask;
      }
    }
    upward = !upward;
  }

  // Format info for mask 0, ECC L (0b01): BCH(15,5) known table
  // ECC L = 01, mask 0 = 000 → 01000 → format bits after BCH+xor
  const formatBits = [
    // precomputed: (eccL<<3|mask0) BCH then XOR 0x5412
    1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0,
  ];
  // Use known good format string for L / mask0 = 0x77C4 bits
  const fmt = 0x77c4;
  const fb = Array.from({ length: 15 }, (_, i) => (fmt >> (14 - i)) & 1);
  const putFmt = (i: number, v: number) => {
    // positions per QR spec
  };
  const positions1: [number, number][] = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];
  const positions2: [number, number][] = [
    [size - 1, 8],
    [size - 2, 8],
    [size - 3, 8],
    [size - 4, 8],
    [size - 5, 8],
    [size - 6, 8],
    [size - 7, 8],
    [8, size - 8],
    [8, size - 7],
    [8, size - 6],
    [8, size - 5],
    [8, size - 4],
    [8, size - 3],
    [8, size - 2],
    [8, size - 1],
  ];
  for (let i = 0; i < 15; i++) {
    mod[positions1[i][1]][positions1[i][0]] = fb[i];
    mod[positions2[i][1]][positions2[i][0]] = fb[i];
  }

  // Fill any remaining -1
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (mod[y][x] < 0) mod[y][x] = 0;
  return mod;
}

export function qrSvg(text: string, sizePx = 160): string | null {
  const m = qrModules(text);
  if (!m) return null;
  const n = m.length;
  const quiet = 2;
  const dim = n + quiet * 2;
  const cell = sizePx / dim;
  let rects = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (m[y][x]) {
        rects += `<rect x="${((x + quiet) * cell).toFixed(2)}" y="${((y + quiet) * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" />`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sizePx} ${sizePx}" width="${sizePx}" height="${sizePx}" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><g fill="#0a0a0a">${rects}</g></svg>`;
}
