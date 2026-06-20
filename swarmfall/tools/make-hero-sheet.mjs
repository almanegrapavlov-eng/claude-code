// Generates the hero sprite sheet as a real RGBA PNG (transparent background),
// in pure Node — no browser, no native canvas. Layout: 4 rows x 4 columns,
// each cell 182x182. Rows = facing directions [down, left, right, up];
// columns = a 4-frame walk cycle. Output: ../assets/sprites/hero.png
//
// This is an original top-down character (blonde hair, purple coat, parasol)
// — a placeholder you can replace by dropping your own sheet at the same path
// with the same grid.
import zlib from 'zlib';
import fs from 'fs';

const S = 182, COLS = 4, ROWS = 4, SS = 3; // SS = supersample for clean edges
const W = S * COLS, H = S * ROWS, w = W * SS, h = H * SS;
const buf = new Uint8Array(w * h * 4); // RGBA, starts fully transparent

// palette
const COAT = [124, 70, 179], COAT_DK = [58, 30, 96], COAT_LT = [156, 104, 214];
const BOOT = [40, 33, 58], SKIN = [244, 205, 163], SKIN_DK = [214, 165, 120];
const HAIR = [238, 210, 96], HAIR_DK = [183, 140, 42], EYE = [38, 32, 56];
const UMB = [92, 58, 136];

// ---- primitives (final-coordinate space; supersampled internally) ----
function px(x, y, c, a) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = (y * w + x) * 4, da = buf[i + 3] / 255, oa = a + da * (1 - a);
  if (oa <= 0) return;
  buf[i] = (c[0] * a + buf[i] * da * (1 - a)) / oa;
  buf[i + 1] = (c[1] * a + buf[i + 1] * da * (1 - a)) / oa;
  buf[i + 2] = (c[2] * a + buf[i + 2] * da * (1 - a)) / oa;
  buf[i + 3] = oa * 255;
}
function ellipse(cx, cy, rx, ry, c, a = 1) {
  const x0 = Math.floor((cx - rx) * SS), x1 = Math.ceil((cx + rx) * SS);
  const y0 = Math.floor((cy - ry) * SS), y1 = Math.ceil((cy + ry) * SS);
  const CX = cx * SS, CY = cy * SS, RX = rx * SS, RY = ry * SS;
  for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
    const dx = (xx + 0.5 - CX) / RX, dy = (yy + 0.5 - CY) / RY;
    if (dx * dx + dy * dy <= 1) px(xx, yy, c, a);
  }
}
const circle = (cx, cy, r, c, a = 1) => ellipse(cx, cy, r, r, c, a);
function rect(x, y, rw, rh, c, a = 1) {
  const x0 = Math.round(x * SS), y0 = Math.round(y * SS);
  const x1 = Math.round((x + rw) * SS), y1 = Math.round((y + rh) * SS);
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) px(xx, yy, c, a);
}
function tri(p1, p2, p3, c, a = 1) {
  const xs = [p1[0], p2[0], p3[0]], ys = [p1[1], p2[1], p3[1]];
  const x0 = Math.floor(Math.min(...xs) * SS), x1 = Math.ceil(Math.max(...xs) * SS);
  const y0 = Math.floor(Math.min(...ys) * SS), y1 = Math.ceil(Math.max(...ys) * SS);
  const ax = p1[0] * SS, ay = p1[1] * SS, bx = p2[0] * SS, by = p2[1] * SS, cx2 = p3[0] * SS, cy2 = p3[1] * SS;
  const d = (by - cy2) * (ax - cx2) + (cx2 - bx) * (ay - cy2);
  if (!d) return;
  for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
    const Px = xx + 0.5, Py = yy + 0.5;
    const l1 = ((by - cy2) * (Px - cx2) + (cx2 - bx) * (Py - cy2)) / d;
    const l2 = ((cy2 - ay) * (Px - cx2) + (ax - cx2) * (Py - cy2)) / d;
    if (l1 >= -0.002 && l2 >= -0.002 && 1 - l1 - l2 >= -0.002) px(xx, yy, c, a);
  }
}
const quad = (p1, p2, p3, p4, c, a = 1) => { tri(p1, p2, p3, c, a); tri(p1, p3, p4, c, a); };
function thickLine(ax, ay, bx, by, wd, c, a = 1) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = (-dy / L) * wd / 2, ny = (dx / L) * wd / 2;
  quad([ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny], c, a);
}

// ---- character ----
function legFront(cx, by, xoff, len) {
  rect(cx + xoff - 6, by + 16, 12, len, COAT_DK);
  ellipse(cx + xoff, by + 16 + len, 9, 6, BOOT);
}
function drawFrontBack(cx, by, swing, back) {
  const leftLen = 22 - Math.max(0, swing) * 9;
  const rightLen = 22 - Math.max(0, -swing) * 9;
  legFront(cx, by, -12, leftLen);
  legFront(cx, by, 12, rightLen);
  // torso (dark outline then coat then a lighter front panel)
  quad([cx - 23, by - 20], [cx + 23, by - 20], [cx + 30, by + 25], [cx - 30, by + 25], COAT_DK);
  quad([cx - 20, by - 18], [cx + 20, by - 18], [cx + 26, by + 22], [cx - 26, by + 22], COAT);
  quad([cx - 7, by - 16], [cx + 7, by - 16], [cx + 9, by + 20], [cx - 9, by + 20], COAT_LT, 0.5);
  // sleeves + hands (slight swing)
  rect(cx - 28, by - 14, 9, 24, COAT); rect(cx + 19, by - 14, 9, 24, COAT);
  ellipse(cx - 23, by + 12 - swing * 3, 5.5, 5.5, SKIN);
  ellipse(cx + 23, by + 12 + swing * 3, 5.5, 5.5, SKIN);
  // head
  ellipse(cx, by - 33, 22, 22, SKIN);
  ellipse(cx, by - 40, 24, 19, HAIR); // hair cap
  if (back) {
    ellipse(cx, by - 31, 21, 20, HAIR); // hair covers the whole back of the head
    tri([cx - 16, by - 14], [cx - 6, by - 22], [cx - 4, by - 12], HAIR);
    tri([cx + 16, by - 14], [cx + 6, by - 22], [cx + 4, by - 12], HAIR);
  } else {
    // spiky bangs
    tri([cx - 22, by - 38], [cx - 10, by - 24], [cx - 2, by - 39], HAIR);
    tri([cx - 3, by - 39], [cx + 6, by - 25], [cx + 12, by - 39], HAIR);
    tri([cx + 11, by - 39], [cx + 20, by - 27], [cx + 23, by - 38], HAIR);
    // eyes
    ellipse(cx - 8, by - 30, 3, 4.2, EYE);
    ellipse(cx + 8, by - 30, 3, 4.2, EYE);
  }
}
function drawSide(cx, by, swing) {
  // facing LEFT (right is produced by mirroring this row)
  const strideF = -4 + swing * 9, strideB = 6 - swing * 9;
  // parasol slung over the back
  thickLine(cx + 6, by + 8, cx + 30, by - 16, 3, COAT_DK);
  quad([cx + 22, by - 26], [cx + 34, by - 18], [cx + 26, by - 8], [cx + 20, by - 18], UMB);
  // back leg, torso, front leg
  rect(cx + strideB - 5, by + 16, 10, 18, COAT_DK);
  ellipse(cx + strideB - 3, by + 34, 10, 6, BOOT);
  quad([cx - 15, by - 19], [cx + 13, by - 16], [cx + 21, by + 23], [cx - 17, by + 23], COAT_DK);
  quad([cx - 13, by - 17], [cx + 11, by - 15], [cx + 18, by + 21], [cx - 15, by + 21], COAT);
  rect(cx + strideF - 5, by + 16, 10, 18, COAT_DK);
  ellipse(cx + strideF - 3, by + 34, 10, 6, BOOT);
  // front arm + hand
  rect(cx - 10, by - 8, 8, 22, COAT);
  ellipse(cx - 6, by + 14 + swing * 2, 5.5, 5.5, SKIN);
  // head profile (faces left)
  ellipse(cx - 2, by - 33, 21, 21, SKIN);
  ellipse(cx - 21, by - 31, 4, 4, SKIN); // nose
  ellipse(cx + 2, by - 40, 20, 16, HAIR); // hair top/back
  tri([cx + 12, by - 45], [cx + 31, by - 40], [cx + 14, by - 33], HAIR); // back spikes
  tri([cx + 12, by - 33], [cx + 28, by - 27], [cx + 12, by - 22], HAIR);
  tri([cx - 20, by - 41], [cx - 23, by - 28], [cx - 10, by - 34], HAIR); // bang
  ellipse(cx - 12, by - 31, 3, 4.2, EYE); // eye
}
function drawHero(dir, frame, cx, cy) {
  const ph = (frame / COLS) * Math.PI * 2;
  const swing = Math.sin(ph);
  const by = cy + 8 - Math.abs(Math.sin(ph)) * 4; // body baseline + walk bob
  if (dir === 'left') drawSide(cx, by, swing);
  else drawFrontBack(cx, by, swing, dir === 'up');
}

// ---- compose ----
for (let f = 0; f < COLS; f++) {
  drawHero('down', f, f * S + 91, 0 * S + 91);
  drawHero('left', f, f * S + 91, 1 * S + 91);
  drawHero('up', f, f * S + 91, 3 * S + 91);
}
// row 2 (right) = horizontal mirror of row 1 (left), done on the hi-res buffer
(function mirrorRow(srcRow, dstRow) {
  const cell = S * SS;
  for (let c = 0; c < COLS; c++) {
    const x0 = c * cell;
    for (let yy = 0; yy < cell; yy++) for (let xx = 0; xx < cell; xx++) {
      const si = ((srcRow * cell + yy) * w + (x0 + xx)) * 4;
      const di = ((dstRow * cell + yy) * w + (x0 + cell - 1 - xx)) * 4;
      buf[di] = buf[si]; buf[di + 1] = buf[si + 1]; buf[di + 2] = buf[si + 2]; buf[di + 3] = buf[si + 3];
    }
  }
})(1, 2);

// ---- downsample (premultiplied) ----
const out = Buffer.alloc(W * H * 4), n = SS * SS;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  let pr = 0, pg = 0, pb = 0, pa = 0;
  for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
    const i = ((y * SS + sy) * w + (x * SS + sx)) * 4, a = buf[i + 3] / 255;
    pr += buf[i] * a; pg += buf[i + 1] * a; pb += buf[i + 2] * a; pa += a;
  }
  const oa = pa / n, o = (y * W + x) * 4;
  if (oa > 0) { out[o] = Math.round(pr / n / oa); out[o + 1] = Math.round(pg / n / oa); out[o + 2] = Math.round(pb / n / oa); }
  out[o + 3] = Math.round(oa * 255);
}

// ---- PNG encode (RGBA, color type 6) ----
function crc32(b) { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) { raw[y * (1 + W * 4)] = 0; out.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4); }
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
]);

const dir = new URL('../assets/sprites/', import.meta.url).pathname;
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(dir + 'hero.png', png);
console.log('wrote assets/sprites/hero.png', W + 'x' + H, '(' + COLS + ' frames x ' + ROWS + ' directions)');
