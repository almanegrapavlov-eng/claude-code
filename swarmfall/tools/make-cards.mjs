// Generates the deploy card images (cover 16:9 + icon 1:1) in pure Node — no
// browser, no native canvas. Reuses the game's palette and character shapes so
// the art matches what you actually play. Output: tools/thumbnail.png, favicon.png.
import zlib from 'zlib';
import fs from 'fs';

// ---- palette (same as the game) ----
const BG = [17, 19, 26];
const TEAL = [55, 209, 196];
const TEAL_DARK = [14, 59, 56];
const GREEN = [126, 200, 80];
const GREEN_DARK = [47, 91, 34];
const PURPLE = [160, 108, 213];
const PURPLE_WING = [123, 70, 176];
const PURPLE_DARK = [51, 24, 79];
const YELLOW = [255, 243, 176];
const YELLOW_HALO = [255, 217, 102];
const WHITE = [255, 255, 255];

// ---- 5x7 bitmap font, just the letters in SWARMFALL ----
const FONT = {
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
};

function makeImage(W, H, draw) {
  const SS = 2; // supersample for anti-aliasing
  const w = W * SS;
  const h = H * SS;
  const buf = new Uint8Array(w * h * 3);

  const px = (x, y, c, a = 1) => {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 3;
    if (a >= 1) {
      buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
    } else {
      buf[i] = buf[i] * (1 - a) + c[0] * a;
      buf[i + 1] = buf[i + 1] * (1 - a) + c[1] * a;
      buf[i + 2] = buf[i + 2] * (1 - a) + c[2] * a;
    }
  };

  const api = {
    fillBg(c) { for (let i = 0; i < w * h; i++) { buf[i * 3] = c[0]; buf[i * 3 + 1] = c[1]; buf[i * 3 + 2] = c[2]; } },
    rect(x, y, rw, rh, c, a = 1) {
      const x0 = Math.round(x * SS), y0 = Math.round(y * SS);
      const x1 = Math.round((x + rw) * SS), y1 = Math.round((y + rh) * SS);
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) px(xx, yy, c, a);
    },
    circle(cx, cy, r, c, a = 1) { this.ellipse(cx, cy, r, r, c, a); },
    ellipse(cx, cy, rx, ry, c, a = 1) {
      const x0 = Math.floor((cx - rx) * SS), x1 = Math.ceil((cx + rx) * SS);
      const y0 = Math.floor((cy - ry) * SS), y1 = Math.ceil((cy + ry) * SS);
      const ccx = cx * SS, ccy = cy * SS, RX = rx * SS, RY = ry * SS;
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const dx = (xx + 0.5 - ccx) / RX, dy = (yy + 0.5 - ccy) / RY;
        if (dx * dx + dy * dy <= 1) px(xx, yy, c, a);
      }
    },
    tri(p1, p2, p3, c, a = 1) {
      const xs = [p1[0], p2[0], p3[0]], ys = [p1[1], p2[1], p3[1]];
      const x0 = Math.floor(Math.min(...xs) * SS), x1 = Math.ceil(Math.max(...xs) * SS);
      const y0 = Math.floor(Math.min(...ys) * SS), y1 = Math.ceil(Math.max(...ys) * SS);
      const ax = p1[0] * SS, ay = p1[1] * SS, bx = p2[0] * SS, by = p2[1] * SS, cx2 = p3[0] * SS, cy2 = p3[1] * SS;
      const d = (by - cy2) * (ax - cx2) + (cx2 - bx) * (ay - cy2);
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const Px = xx + 0.5, Py = yy + 0.5;
        const l1 = ((by - cy2) * (Px - cx2) + (cx2 - bx) * (Py - cy2)) / d;
        const l2 = ((cy2 - ay) * (Px - cx2) + (ax - cx2) * (Py - cy2)) / d;
        const l3 = 1 - l1 - l2;
        if (l1 >= 0 && l2 >= 0 && l3 >= 0) px(xx, yy, c, a);
      }
    },
    text(str, x, y, cell, c, a = 1) {
      let cx = x;
      for (const ch of str) {
        if (ch === ' ') { cx += cell * 4; continue; }
        const g = FONT[ch];
        if (g) for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++)
          if (g[r][col] === '#') this.rect(cx + col * cell, y + r * cell, cell, cell, c, a);
        cx += cell * 6;
      }
      return cx;
    },
  };

  draw(api);

  // downsample SS -> 1 (box filter = anti-aliasing)
  const out = Buffer.alloc(W * H * 3);
  const n = SS * SS;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const i = ((y * SS + sy) * w + (x * SS + sx)) * 3;
      r += buf[i]; g += buf[i + 1]; b += buf[i + 2];
    }
    const o = (y * W + x) * 3;
    out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n); out[o + 2] = Math.round(b / n);
  }
  return { W, H, data: out };
}

// ---- characters ----
function hero(api, cx, cy, r) {
  api.circle(cx, cy, r * 1.08, TEAL_DARK);
  api.circle(cx, cy, r, TEAL);
  api.circle(cx - r * 0.3, cy - r * 0.34, r * 0.42, WHITE, 0.18);
  const ex = r * 0.36, ey = -r * 0.04, er = r * 0.22;
  for (const s of [-1, 1]) {
    api.circle(cx + s * ex, cy + ey, er, WHITE);
    api.circle(cx + s * ex, cy + ey, er * 0.5, TEAL_DARK);
  }
}
function slime(api, cx, cy, r) {
  api.ellipse(cx, cy + r * 0.18, r * 1.2, r * 0.96, GREEN_DARK);
  api.ellipse(cx, cy + r * 0.18, r * 1.12, r * 0.86, GREEN);
  api.ellipse(cx - r * 0.35, cy - r * 0.05, r * 0.3, r * 0.22, WHITE, 0.22);
  for (const s of [-1, 1]) {
    api.circle(cx + s * r * 0.3, cy + r * 0.1, r * 0.15, WHITE);
    api.circle(cx + s * r * 0.3, cy + r * 0.1, r * 0.08, GREEN_DARK);
  }
}
function bat(api, cx, cy, r) {
  for (const s of [-1, 1]) {
    api.tri([cx + s * r * 0.4, cy - r * 0.1], [cx + s * r * 2.2, cy - r], [cx + s * r * 1.7, cy + r * 0.5], PURPLE_WING);
  }
  api.circle(cx, cy, r * 1.1, PURPLE_DARK);
  api.circle(cx, cy, r, PURPLE);
  for (const s of [-1, 1]) {
    api.circle(cx + s * r * 0.4, cy - r * 0.08, r * 0.3, YELLOW_HALO);
    api.circle(cx + s * r * 0.4, cy - r * 0.08, r * 0.15, PURPLE_DARK);
  }
}
function bolt(api, x, y) {
  api.circle(x, y, 19, YELLOW_HALO, 0.45);
  api.circle(x, y, 9, YELLOW);
  api.circle(x, y, 4, WHITE);
}
function grid(api, W, H, step) {
  for (let x = 0; x <= W; x += step) api.rect(x, 0, 1, H, WHITE, 0.05);
  for (let y = 0; y <= H; y += step) api.rect(0, y, W, 1, WHITE, 0.05);
}

// ---- cover (16:9) ----
const cover = makeImage(1280, 720, (api) => {
  api.fillBg(BG);
  grid(api, 1280, 720, 80);

  slime(api, 250, 565, 60);
  slime(api, 1035, 560, 60);
  slime(api, 450, 320, 46);
  slime(api, 845, 315, 46);
  bat(api, 175, 330, 34);
  bat(api, 1110, 335, 34);
  bat(api, 480, 200, 30);
  bat(api, 815, 185, 30);

  hero(api, 640, 440, 98);

  bolt(api, 430, 505);
  bolt(api, 835, 500);
  bolt(api, 545, 305);
  bolt(api, 735, 300);
  bolt(api, 350, 430);
  bolt(api, 930, 430);

  const cell = 10;
  const text = 'SWARMFALL';
  const width = text.length * 6 * cell - cell;
  const tx = (1280 - width) / 2;
  const ty = 44;
  api.text(text, tx + 4, ty + 5, cell, [4, 6, 9], 0.85); // shadow
  api.text(text, tx, ty, cell, TEAL);
});

// ---- icon (1:1) ----
const icon = makeImage(512, 512, (api) => {
  api.fillBg(BG);
  api.rect(14, 14, 484, 484, TEAL, 0.12); // subtle inner frame
  api.rect(20, 20, 472, 472, BG);
  hero(api, 256, 262, 158);
});

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG({ W, H, data }) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit, RGB
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) { raw[y * (1 + W * 3)] = 0; data.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3); }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const dir = new URL('.', import.meta.url).pathname;
fs.writeFileSync(dir + 'thumbnail.png', encodePNG(cover));
fs.writeFileSync(dir + 'favicon.png', encodePNG(icon));
console.log('wrote thumbnail.png', cover.W + 'x' + cover.H, 'and favicon.png', icon.W + 'x' + icon.H);
