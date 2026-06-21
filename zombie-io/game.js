// ZOMBIE ZONE .io — client. Renders the authoritative server state with client-side
// prediction + interpolation. ALL art is procedural canvas, ALL audio is WebAudio-synth,
// every visual bound to STYLE FORMULA v1 (flat vector cartoon, muted apocalyptic greens &
// grey asphalt, sickly grey-green zombies, signal-yellow pickups, crisp dark outlines).
import { STR } from "./strings.js";

// ----- shared constants (must match server.js) -----
const MAP = 3600, PLAYER_R = 26, PLAYER_SPEED = 230, VIEW_H = 1040;
const WORDER = ["pistol", "smg", "shotgun", "rifle"];
const TICK = 0.05, INTERP_MS = 100, INPUT_MS = 50;

// ----- palette (STYLE FORMULA v1) -----
const C = {
  ground: "#3b423a", grass: "#535a3b", crack: "#2a2f28", asphalt: "#444b41",
  ink: "#171411", inkSoft: "#241f1a", shadow: "rgba(10,12,9,0.30)",
  yellow: "#ffd23f", yellowDk: "#e0a92a", red: "#b23a2e", blood: "#6e1414",
  zombie: "#6f7d4e", zombie2: "#5e6b42", flesh: "#869160", skin: "#caa079",
  safe: "#f2f5ee", danger: "rgba(150,30,24,0.22)", dangerEdge: "rgba(220,70,55,0.9)",
  hud: "rgba(20,23,18,0.72)", hudLine: "#3a4030", text: "#e9ead8", textDim: "#9aa488",
};
// warm contrasting survivor tints (hero pops off the ground)
const TINTS = ["#3f548f", "#a85a34", "#c2a468", "#7d6c3a", "#8d3b4f", "#3f7a66"];
const SELF = "#46c7c0";

// ===================================================================== DOM
const cv = document.getElementById("c");
const ctx = cv.getContext("2d");
const menu = document.getElementById("menu");
const death = document.getElementById("death");
const conn = document.getElementById("conn");
const elName = document.getElementById("name");
const elPlay = document.getElementById("play");
const elRedeploy = document.getElementById("redeploy");
const elDeathTitle = document.getElementById("deathTitle");
const elDeathSub = document.getElementById("deathSub");
const elMute = document.getElementById("mute");
const elDev = document.getElementById("dev");
const isTouch = matchMedia("(pointer:coarse)").matches || "ontouchstart" in window;

// fill menu text
document.getElementById("title").textContent = STR.title;
document.getElementById("tagline").textContent = STR.tagline;
elName.placeholder = STR.namePlaceholder;
elPlay.textContent = STR.play;
document.getElementById("howToTitle").textContent = STR.howToTitle;
document.getElementById("controls").textContent = isTouch ? STR.controlsMobile : STR.controlsDesktop;
document.getElementById("tip").textContent = STR.tips[(Math.random() * STR.tips.length) | 0];
elName.value = localStorage.getItem("zz-name") || "";

// ===================================================================== canvas
let W = 0, H = 0, scale = 1, DPR = 1;
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 1.5);
  W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + "px"; cv.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  scale = H / VIEW_H;
}
addEventListener("resize", resize); addEventListener("orientationchange", resize); resize();

// ===================================================================== procedural sprites
function spr(size, draw) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const x = c.getContext("2d"); x.translate(size / 2, size / 2); x.lineJoin = "round"; x.lineCap = "round";
  draw(x, size); return c;
}
function outline(x, w) { x.lineWidth = w; x.strokeStyle = C.ink; x.stroke(); }

const SUR = TINTS.map(t => makeSurvivor(t));
const SUR_SELF = makeSurvivor(SELF, true);
function makeSurvivor(tint, self) {
  return spr(72, (x) => {
    // backpack
    x.fillStyle = C.inkSoft; x.beginPath(); x.ellipse(-7, 0, 9, 11, 0, 0, 7); x.fill(); outline(x, 3);
    // body
    x.fillStyle = tint; x.beginPath(); x.ellipse(0, 0, 15, 13, 0, 0, 7); x.fill(); outline(x, 3.5);
    // arms forward to gun
    x.strokeStyle = shade(tint, -22); x.lineWidth = 6;
    x.beginPath(); x.moveTo(3, -8); x.lineTo(17, -4); x.moveTo(3, 8); x.lineTo(17, 4); x.stroke();
    // gun
    x.fillStyle = "#23211d"; x.beginPath(); x.rect(10, -3.5, 22, 7); x.fill(); outline(x, 2.5);
    x.fillStyle = C.yellow; x.fillRect(30, -2.5, 4, 5);
    // head
    x.fillStyle = self ? "#eef" : C.skin; x.beginPath(); x.arc(3, 0, 8, 0, 7); x.fill(); outline(x, 3);
    if (self) { x.strokeStyle = SELF; x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, 22, 0, 7); x.stroke(); }
  });
}
const ZOM = [makeZombie(C.zombie, 1), makeZombie(C.zombie2, 1.08)];
function makeZombie(col, s) {
  return spr(70, (x) => {
    x.scale(s, s);
    // arms reaching forward
    x.strokeStyle = shade(col, -18); x.lineWidth = 6.5;
    x.beginPath(); x.moveTo(0, -7); x.lineTo(18, -7); x.moveTo(0, 7); x.lineTo(18, 7); x.stroke();
    x.fillStyle = C.flesh; x.beginPath(); x.arc(18, -7, 3.5, 0, 7); x.arc(18, 7, 3.5, 0, 7); x.fill();
    // body (hunched, tattered)
    x.fillStyle = col; x.beginPath(); x.ellipse(0, 0, 14, 12, 0, 0, 7); x.fill(); outline(x, 3.2);
    // tatters
    x.fillStyle = C.inkSoft; x.beginPath(); x.moveTo(-10, 8); x.lineTo(-6, 13); x.lineTo(-2, 8); x.fill();
    // head
    x.fillStyle = C.flesh; x.beginPath(); x.arc(4, 0, 7, 0, 7); x.fill(); outline(x, 3);
    x.fillStyle = C.blood; x.beginPath(); x.arc(6, 1.5, 2, 0, 7); x.fill(); // gore
    x.fillStyle = "#cfe070"; x.beginPath(); x.arc(7, -2, 1.4, 0, 7); x.fill(); // glowing eye
  });
}
const CRATE = spr(60, (x) => {
  x.fillStyle = "#7a5230"; x.beginPath(); x.rect(-22, -22, 44, 44); x.fill(); outline(x, 3.5);
  x.strokeStyle = shade("#7a5230", -26); x.lineWidth = 3;
  x.beginPath(); x.moveTo(-22, -7); x.lineTo(22, -7); x.moveTo(-22, 9); x.lineTo(22, 9); x.stroke();
  x.strokeStyle = "#caa05a"; x.lineWidth = 2; x.beginPath(); x.moveTo(-22, -22); x.lineTo(22, 22); x.moveTo(22, -22); x.lineTo(-22, 22); x.stroke();
});
const TREE = spr(86, (x) => {
  x.fillStyle = C.shadow; x.beginPath(); x.arc(2, 3, 33, 0, 7); x.fill();
  x.fillStyle = "#46582f"; x.beginPath(); blob(x, 33, 7); x.fill(); outline(x, 3.5);
  x.fillStyle = "#566a39"; x.beginPath(); blob(x, 24, 6); x.fill();
  x.fillStyle = "#2c1d12"; x.beginPath(); x.arc(0, 0, 5, 0, 7); x.fill();
});
const ROCK = spr(82, (x) => {
  x.fillStyle = C.shadow; x.beginPath(); x.arc(2, 3, 32, 0, 7); x.fill();
  x.fillStyle = "#6b6f68"; x.beginPath(); blob(x, 31, 6); x.fill(); outline(x, 3.5);
  x.fillStyle = "#81857c"; x.beginPath(); blob(x, 19, 5); x.fill();
  x.fillStyle = "#4f6b42"; x.beginPath(); x.arc(-9, 8, 4, 0, 7); x.arc(7, -7, 3, 0, 7); x.fill();
});
function blob(x, r, n) { for (let i = 0; i <= n; i++) { const a = i / n * 7; const rr = r * (0.82 + 0.18 * Math.sin(a * 3 + r)); const px = Math.cos(a) * rr, py = Math.sin(a) * rr; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); }

const PICK = {
  medkit: spr(44, (x) => { glow(x, 18, C.red); x.fillStyle = "#f4f1ea"; round(x, -14, -14, 28, 28, 6); x.fill(); outline(x, 3); x.fillStyle = C.red; x.fillRect(-3, -10, 6, 20); x.fillRect(-10, -3, 20, 6); }),
  armor: spr(44, (x) => { glow(x, 18, C.yellow); x.fillStyle = "#39414f"; x.beginPath(); x.moveTo(-12, -12); x.lineTo(12, -12); x.lineTo(12, 8); x.lineTo(0, 15); x.lineTo(-12, 8); x.closePath(); x.fill(); outline(x, 3); x.strokeStyle = C.yellow; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-6, -10); x.lineTo(-6, 8); x.moveTo(6, -10); x.lineTo(6, 8); x.stroke(); }),
  ammo: spr(40, (x) => { glow(x, 16, C.yellow); x.fillStyle = C.yellowDk; round(x, -13, -10, 26, 20, 4); x.fill(); outline(x, 3); x.fillStyle = C.ink; for (let i = -1; i < 2; i++) { x.fillRect(i * 7 - 1.5, -6, 3, 8); } }),
};
const GUN = {}; for (const k of WORDER) GUN[k] = makeGun(k);
function makeGun(k) {
  return spr(48, (x) => {
    x.fillStyle = "#26241f"; x.strokeStyle = C.ink; x.lineWidth = 2.5;
    if (k === "pistol") { round(x, -8, -4, 18, 8, 2); x.fill(); x.stroke(); x.fillRect(-6, 2, 5, 8); x.strokeRect(-6, 2, 5, 8); }
    else if (k === "smg") { round(x, -12, -4, 26, 8, 2); x.fill(); x.stroke(); x.fillRect(-4, 3, 5, 11); x.strokeRect(-4, 3, 5, 11); }
    else if (k === "shotgun") { round(x, -18, -5, 36, 10, 2); x.fill(); x.stroke(); x.fillStyle = "#5a3b22"; x.fillRect(-18, -4, 10, 8); }
    else { round(x, -20, -3.5, 42, 7, 2); x.fill(); x.stroke(); x.fillStyle = C.ink; x.fillRect(2, -8, 8, 5); /*scope*/ }
    x.fillStyle = C.yellow; x.fillRect(GUNTIP(k), -2, 3, 4);
  });
}
function GUNTIP(k) { return k === "rifle" ? 19 : k === "shotgun" ? 15 : k === "smg" ? 11 : 7; }
function round(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function glow(x, r, col) { const g = x.createRadialGradient(0, 0, 1, 0, 0, r); g.addColorStop(0, col + "cc"); g.addColorStop(1, col + "00"); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); }
function shade(hex, d) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) + d, g = ((n >> 8) & 255) + d, b = (n & 255) + d; r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b)); return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1); }

// ground tile pattern (seamless-by-construction, seeded)
const groundPat = (() => {
  const t = spr(256, (x) => {
    x.translate(-128, -128);
    x.fillStyle = C.ground; x.fillRect(0, 0, 256, 256);
    let s = 99; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    x.fillStyle = C.asphalt; for (let i = 0; i < 30; i++) { const r = 6 + rnd() * 16; x.beginPath(); x.arc(rnd() * 256, rnd() * 256, r, 0, 7); x.fill(); }
    x.fillStyle = C.grass; for (let i = 0; i < 26; i++) { x.globalAlpha = 0.5 + rnd() * 0.4; x.beginPath(); x.ellipse(rnd() * 256, rnd() * 256, 5 + rnd() * 9, 3 + rnd() * 5, rnd() * 6, 0, 7); x.fill(); } x.globalAlpha = 1;
    x.strokeStyle = C.crack; x.lineWidth = 1.6; for (let i = 0; i < 7; i++) { x.beginPath(); let px = rnd() * 256, py = rnd() * 256; x.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (rnd() - 0.5) * 60; py += (rnd() - 0.5) * 60; x.lineTo(px, py); } x.stroke(); }
  });
  return ctx.createPattern(t, "repeat");
})();

// ===================================================================== audio (WebAudio synth)
let actx = null, master = null, muted = localStorage.getItem("zz-mute") === "1";
function initAudio() {
  if (actx) return;
  try { actx = new (AudioContext || webkitAudioContext)(); } catch (e) { return; }
  master = actx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(actx.destination);
  startMusic();
}
function noiseBuf(d) { const n = actx.sampleRate * d, b = actx.createBuffer(1, n, actx.sampleRate), c = b.getChannelData(0); for (let i = 0; i < n; i++) c[i] = Math.random() * 2 - 1; return b; }
function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function sfxShot(vol = 1) {
  if (!actx || muted) return; const t = actx.currentTime;
  const src = actx.createBufferSource(); src.buffer = noiseBuf(0.18);
  const bp = actx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1500 + Math.random() * 400; bp.Q.value = 0.7;
  const lp = actx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
  const g = actx.createGain(); env(g, t, 0.004, 0.28 * vol, 0.14);
  src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(master); src.start(t); src.stop(t + 0.2);
  const o = actx.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.1);
  const g2 = actx.createGain(); env(g2, t, 0.003, 0.18 * vol, 0.09); o.connect(g2); g2.connect(master); o.start(t); o.stop(t + 0.14);
}
function sfxZombie(vol = 1) {
  if (!actx || muted) return; const t = actx.currentTime;
  const o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(90 + Math.random() * 30, t); o.frequency.linearRampToValueAtTime(60, t + 0.5);
  const o2 = actx.createOscillator(); o2.type = "sawtooth"; o2.detune.value = 18;
  const lp = actx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600;
  const lfo = actx.createOscillator(); lfo.frequency.value = 7; const lg = actx.createGain(); lg.gain.value = 90; lfo.connect(lg); lg.connect(lp.frequency);
  const g = actx.createGain(); env(g, t, 0.05, 0.16 * vol, 0.5);
  o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(master);
  o.start(t); o2.start(t); lfo.start(t); o.stop(t + 0.6); o2.stop(t + 0.6); lfo.stop(t + 0.6);
}
function sfxPickup() {
  if (!actx || muted) return; const t = actx.currentTime;
  [660, 990].forEach((f, i) => { const o = actx.createOscillator(); o.type = "square"; o.frequency.value = f; const g = actx.createGain(); env(g, t + i * 0.07, 0.005, 0.14, 0.1); o.connect(g); g.connect(master); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.12); });
}
function sfxHit() {
  if (!actx || muted) return; const t = actx.currentTime;
  const o = actx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.18);
  const g = actx.createGain(); env(g, t, 0.003, 0.3, 0.18); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.22);
}
function startMusic() {
  if (!actx) return; const t = actx.currentTime;
  const g = actx.createGain(); g.gain.value = 0.06; g.connect(master);
  const lp = actx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 240; lp.connect(g);
  [55, 82.4, 110].forEach((f, i) => { const o = actx.createOscillator(); o.type = i === 2 ? "sine" : "sawtooth"; o.frequency.value = f; o.detune.value = (i - 1) * 6; o.connect(lp); o.start(t); });
  const lfo = actx.createOscillator(); lfo.frequency.value = 0.07; const lg = actx.createGain(); lg.gain.value = 70; lfo.connect(lg); lg.connect(lp.frequency); lfo.start(t);
}
function setMute(m) { muted = m; localStorage.setItem("zz-mute", m ? "1" : "0"); if (master) master.gain.value = m ? 0 : 0.9; elMute.textContent = m ? STR.muted : STR.unmuted; }
elMute.textContent = muted ? STR.muted : STR.unmuted;
elMute.onclick = () => setMute(!muted);

// ===================================================================== networking
let pid = sessionStorage.getItem("zz-pid"); if (!pid) { pid = "p" + Math.random().toString(36).slice(2, 10); sessionStorage.setItem("zz-pid", pid); }
const params = new URLSearchParams(location.search);
const room = (params.get("room") || "arena").replace(/[^a-z0-9]/gi, "").slice(0, 24) || "arena";
let ws = null, connected = false, playerName = "Survivor";
let obstacles = [], selfId = null;
const snaps = []; // {time, me, P:Map, Z:Map, B:[], L:Map, zone, alive, board, feed}
let latest = null;
let rtt = 0;

function wsUrl() { const base = location.pathname.replace(/\/+$/, ""); return (location.protocol === "https:" ? "wss://" : "ws://") + location.host + base + "/ws/" + room; }
function connect() {
  ws = new WebSocket(wsUrl());
  ws.onopen = () => { connected = true; hide(conn); ws.send(JSON.stringify({ t: "join", pid, name: playerName })); };
  ws.onclose = () => { connected = false; if (playing) { conn.querySelector("span").textContent = STR.reconnecting; show(conn); setTimeout(connect, 1200); } };
  ws.onerror = () => { try { ws.close(); } catch (e) { } };
  ws.onmessage = (e) => onNet(JSON.parse(e.data));
}
function onNet(m) {
  if (m.t === "init") { obstacles = m.obstacles; selfId = m.self; return; }
  if (m.t === "pong") { rtt = performance.now() - m.ts; return; }
  if (m.t !== "state") return;
  const P = new Map(); for (const p of m.players) P.set(p.i, p);
  const Z = new Map(); for (const z of m.zombies) Z.set(z.i, z);
  const L = new Map(); for (const l of m.loot) L.set(l.i, l);
  const snap = { time: performance.now(), me: m.me, P, Z, B: m.bullets, L, zone: m.zone, alive: m.alive, board: m.board, feed: m.feed };
  // detect deaths/removed for blood effects (diff vs previous)
  if (latest) {
    for (const [id, z] of latest.Z) if (!Z.has(id)) splatter(z.x, z.y, C.blood, 10);
    for (const [id, p] of latest.P) if (!P.has(id) && p.h > 0) splatter(p.x, p.y, C.blood, 16);
  }
  snaps.push(snap); if (snaps.length > 12) snaps.shift();
  latest = snap;
  // reconcile prediction
  const me = m.me;
  if (!pred.init || !me.alive) { pred.x = me.x; pred.y = me.y; pred.init = true; }
  else { const dx = me.x - pred.x, dy = me.y - pred.y, d = Math.hypot(dx, dy); if (d > 180) { pred.x = me.x; pred.y = me.y; } else { pred.x += dx * 0.18; pred.y += dy * 0.18; } }
  // audio reactions
  if (me.muzzle) sfxShot(1);
  if (me.hurt) { sfxHit(); shakeAmt = Math.min(14, shakeAmt + 7); }
  if (me.pickup) sfxPickup();
  // nearby gunfire / groans (throttled)
  let muz = 0; for (const p of m.players) if (p.m) muz++;
  if (muz && Math.random() < 0.5) sfxShot(0.5);
  if (m.zombies.length && Math.random() < 0.03) sfxZombie(0.5);
  // death screen
  if (!me.alive && !deathShown) showDeath(me);
  if (me.alive && deathShown) { hide(death); deathShown = false; }
}

// ===================================================================== input
const keys = new Set();
const BIND = { KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right", ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
let mouse = { x: innerWidth / 2, y: innerHeight / 2, down: false };
let aim = 0, fireHeld = false, reloadReq = false, swapReq = null;

addEventListener("keydown", (e) => {
  if (!playing) return;
  if (BIND[e.code]) { keys.add(BIND[e.code]); e.preventDefault(); }
  if (e.code === "KeyR") reloadReq = true;
  if (e.code.startsWith("Digit")) { const i = +e.code.slice(5) - 1; if (i >= 0 && i < 4) swapReq = WORDER[i]; }
});
addEventListener("keyup", (e) => { if (BIND[e.code]) keys.delete(BIND[e.code]); });
cv.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
cv.addEventListener("mousedown", (e) => { if (e.button === 0) fireHeld = true; });
addEventListener("mouseup", () => { fireHeld = false; });
cv.addEventListener("contextmenu", (e) => e.preventDefault());

// touch: left half = move stick, right half = aim+fire stick
const sticks = { move: null, aim: null };
function touchStart(e) {
  for (const t of e.changedTouches) {
    const left = t.clientX < innerWidth * 0.5;
    const s = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY };
    if (left && !sticks.move) sticks.move = s; else if (!left && !sticks.aim) sticks.aim = s;
  }
  e.preventDefault();
}
function touchMove(e) { for (const t of e.changedTouches) { for (const k in sticks) { const s = sticks[k]; if (s && s.id === t.identifier) { s.x = t.clientX; s.y = t.clientY; } } } e.preventDefault(); }
function touchEnd(e) { for (const t of e.changedTouches) { for (const k in sticks) { if (sticks[k] && sticks[k].id === t.identifier) sticks[k] = null; } } e.preventDefault(); }
if (isTouch) {
  cv.addEventListener("touchstart", touchStart, { passive: false });
  cv.addEventListener("touchmove", touchMove, { passive: false });
  cv.addEventListener("touchend", touchEnd, { passive: false });
  cv.addEventListener("touchcancel", touchEnd, { passive: false });
}
// mobile weapon swap by tapping HUD slots is handled in render hit-test (tapSlots)
let tapSlots = [];
cv.addEventListener("touchstart", (e) => { if (!isTouch) return; const t = e.changedTouches[0]; for (const s of tapSlots) if (t.clientX > s.x && t.clientX < s.x + s.w && t.clientY > s.y && t.clientY < s.y + s.h) swapReq = s.k; });

function readGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : []; let mv = null;
  for (const gp of pads) {
    if (!gp) continue;
    const lx = gp.axes[0] || 0, ly = gp.axes[1] || 0, rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
    if (Math.hypot(lx, ly) > 0.22) mv = { x: lx, y: ly };
    if (Math.hypot(rx, ry) > 0.28) { aim = Math.atan2(ry, rx); fireHeld = true; } else if (gp.buttons[7] && gp.buttons[7].pressed) fireHeld = fireHeld;
    if (gp.buttons[7] && gp.buttons[7].pressed) fireHeld = true;
    if (gp.buttons[2] && gp.buttons[2].pressed) reloadReq = true;
    if (gp.buttons[5] && gp.buttons[5].pressed) cycleWeapon(1);
    if (gp.buttons[4] && gp.buttons[4].pressed) cycleWeapon(-1);
    break;
  }
  return mv;
}
let lastCycle = 0;
function cycleWeapon(d) { const now = performance.now(); if (now - lastCycle < 220) return; lastCycle = now; const owned = (latest && latest.me.owned) || ["pistol"]; const cur = (latest && latest.me.weapon) || "pistol"; let i = owned.indexOf(cur); i = (i + d + owned.length) % owned.length; swapReq = owned[i]; }

// compute movement + aim each input tick
function gatherInput() {
  let mx = 0, my = 0;
  if (keys.has("up")) my -= 1; if (keys.has("down")) my += 1; if (keys.has("left")) mx -= 1; if (keys.has("right")) mx += 1;
  // touch move stick
  if (sticks.move) { const dx = sticks.move.x - sticks.move.ox, dy = sticks.move.y - sticks.move.oy; const d = Math.hypot(dx, dy); if (d > 12) { mx = dx / Math.max(d, 50); my = dy / Math.max(d, 50); } }
  // touch aim stick
  if (sticks.aim) { const dx = sticks.aim.x - sticks.aim.ox, dy = sticks.aim.y - sticks.aim.oy; const d = Math.hypot(dx, dy); if (d > 14) { aim = Math.atan2(dy, dx); fireHeld = true; } else fireHeld = false; }
  // gamepad
  const gmv = readGamepad(); if (gmv) { mx = gmv.x; my = gmv.y; }
  // desktop aim from mouse (player at screen center)
  if (!isTouch && !gmv) aim = Math.atan2(mouse.y - H / 2, mouse.x - W / 2);
  const m = Math.hypot(mx, my); if (m > 1) { mx /= m; my /= m; }
  return { mx, my };
}

// ===================================================================== prediction
const pred = { x: MAP / 2, y: MAP / 2, init: false };
function resolveLocal(p, r) {
  for (const o of obstacles) {
    if (o.kind === "wall") { const cx = clmp(p.x, o.x, o.x + o.w), cy = clmp(p.y, o.y, o.y + o.h); const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy); if (d < r && d > 0.001) { p.x = cx + dx / d * r; p.y = cy + dy / d * r; } }
    else { const rr = o.r + r, dx = p.x - o.x, dy = p.y - o.y, d2 = dx * dx + dy * dy; if (d2 < rr * rr) { const d = Math.sqrt(d2) || 0.001; p.x = o.x + dx / d * rr; p.y = o.y + dy / d * rr; } }
  }
  p.x = clmp(p.x, r, MAP - r); p.y = clmp(p.y, r, MAP - r);
}
const clmp = (v, a, b) => v < a ? a : v > b ? b : v;

// ===================================================================== particles
const parts = []; // pooled-ish
function splatter(x, y, col, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 7, s = 30 + Math.random() * 120; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.4, max: 0.9, col, r: 2 + Math.random() * 3 }); } }
function muzzleFx(x, y, a) { for (let i = 0; i < 4; i++) { const sp = a + (Math.random() - 0.5) * 0.5, s = 120 + Math.random() * 120; parts.push({ x, y, vx: Math.cos(sp) * s, vy: Math.sin(sp) * s, life: 0.12, max: 0.12, col: C.yellow, r: 2 + Math.random() * 2 }); } }
function updateParts(dt) { for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.life -= dt; if (p.life <= 0) parts.splice(i, 1); } }

// ===================================================================== loop
let playing = false, deathShown = false, shakeAmt = 0, lastFrame = performance.now(), seq = 0;
let fps = 0, fc = 0, fAt = performance.now();
const dev = params.has("dev");

function startGame() {
  playerName = (elName.value || "Survivor").slice(0, 16); localStorage.setItem("zz-name", playerName);
  initAudio(); hide(menu); playing = true; show(conn); conn.querySelector("span").textContent = STR.connecting;
  connect();
  setInterval(() => { // 20Hz input send
    if (!connected || !ws || ws.readyState !== 1) return;
    const mv = gatherInput();
    ws.send(JSON.stringify({ t: "input", mx: mv.mx, my: mv.my, aim: +aim.toFixed(3), fire: fireHeld, reload: reloadReq, swap: swapReq, seq: seq++ }));
    reloadReq = false; swapReq = null;
    if (seq % 25 === 0) ws.send(JSON.stringify({ t: "ping", ts: performance.now() }));
  }, INPUT_MS);
  requestAnimationFrame(frame);
}
elPlay.onclick = startGame;
elName.addEventListener("keydown", (e) => { if (e.code === "Enter") startGame(); });
elRedeploy.onclick = () => { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ t: "respawn" })); };

function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - lastFrame) / 1000; lastFrame = now; if (dt > 0.05) dt = 0.05;
  // predict own movement
  if (latest && latest.me.alive) {
    const mv = gatherInput();
    pred.x += mv.mx * PLAYER_SPEED * dt; pred.y += mv.my * PLAYER_SPEED * dt; resolveLocal(pred, PLAYER_R);
  }
  updateParts(dt);
  if (shakeAmt > 0) shakeAmt *= 0.86;
  render(now);
  if (dev) { fc++; if (now - fAt > 500) { fps = Math.round(fc * 1000 / (now - fAt)); fc = 0; fAt = now; elDev.style.display = "block"; elDev.textContent = `${fps} fps · ${parts.length} fx · rtt ${rtt | 0}ms · ${latest ? latest.alive : 0} alive`; } }
}

// ===================================================================== render
function lerp(a, b, t) { return a + (b - a) * t; }
function angLerp(a, b, t) { let d = b - a; while (d > Math.PI) d -= 6.28318; while (d < -Math.PI) d += 6.28318; return a + d * t; }
function interpFrame() {
  const rt = performance.now() - INTERP_MS;
  let s0 = null, s1 = null;
  for (let i = snaps.length - 1; i >= 0; i--) { if (snaps[i].time <= rt) { s0 = snaps[i]; s1 = snaps[i + 1] || snaps[i]; break; } }
  if (!s0) { s0 = snaps[0]; s1 = snaps[0]; }
  const t = s1.time > s0.time ? clmp((rt - s0.time) / (s1.time - s0.time), 0, 1) : 0;
  return { s0, s1, t };
}

function render(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (!latest) return;
  const me = latest.me;
  const sx = (Math.random() - 0.5) * shakeAmt, sy = (Math.random() - 0.5) * shakeAmt;
  ctx.save();
  ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(scale, scale); ctx.translate(-pred.x, -pred.y);
  const hw = (W / 2) / scale + 80, hh = (H / 2) / scale + 80;
  const camL = pred.x - hw, camT = pred.y - hh, camR = pred.x + hw, camB = pred.y + hh;

  // ground
  ctx.fillStyle = groundPat; ctx.fillRect(camL, camT, hw * 2, hh * 2);
  // map border void
  ctx.fillStyle = "#15180f";
  if (camL < 0) ctx.fillRect(camL, camT, -camL, hh * 2);
  if (camT < 0) ctx.fillRect(camL, camT, hw * 2, -camT);
  if (camR > MAP) ctx.fillRect(MAP, camT, camR - MAP, hh * 2);
  if (camB > MAP) ctx.fillRect(camL, MAP, hw * 2, camB - MAP);

  const { s0, s1, t } = interpFrame();

  // loot (under entities) from latest snapshot
  for (const l of latest.L.values()) {
    if (l.x < camL || l.x > camR || l.y < camT || l.y > camB) continue;
    if (l.k === "crate") { ctx.drawImage(CRATE, l.x - 30, l.y - 30, 60, 60); continue; }
    const img = l.k === "weapon" ? null : PICK[l.k];
    if (l.k === "weapon") { ctx.save(); ctx.translate(l.x, l.y); glowRing(0, 0, 16); ctx.drawImage(GUN[l.w] || GUN.pistol, -24, -24, 48, 48); ctx.restore(); }
    else if (img) ctx.drawImage(img, l.x - img.width / 2, l.y - img.height / 2);
  }

  // zone (danger overlay) — fill outside the safe circle
  const z = latest.zone;
  ctx.fillStyle = C.danger; ctx.beginPath();
  ctx.rect(camL, camT, hw * 2, hh * 2);
  ctx.arc(z.x, z.y, z.r, 0, 7, true); ctx.fill("evenodd");
  ctx.lineWidth = 4 / scale; ctx.strokeStyle = C.dangerEdge; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.stroke();
  if (z.shrinking) { ctx.setLineDash([14 / scale, 10 / scale]); ctx.strokeStyle = C.safe; ctx.lineWidth = 2.5 / scale; ctx.beginPath(); ctx.arc(z.tx, z.ty, z.tr, 0, 7); ctx.stroke(); ctx.setLineDash([]); }

  // bullets (tracers) from latest
  ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.lineCap = "round";
  for (const b of latest.B) { if (b.x < camL || b.x > camR || b.y < camT || b.y > camB) continue; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - Math.cos(b.a) * 22, b.y - Math.sin(b.a) * 22); ctx.stroke(); }

  // zombies (interpolated)
  for (const [id, zz] of (s0.Z.size ? s0.Z : latest.Z)) {
    let x = zz.x, y = zz.y, a = zz.a; const z1 = s1.Z.get(id); if (z1) { x = lerp(zz.x, z1.x, t); y = lerp(zz.y, z1.y, t); a = angLerp(zz.a, z1.a, t); }
    if (x < camL || x > camR || y < camT || y > camB) continue;
    shadow(x, y, 22);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); const img = ZOM[id % 2]; ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore();
    if (zz.h < 100) bar(x, y - 30, 30, zz.h / 100, "#cf5", true);
  }

  // other players (interpolated)
  for (const [id, pp] of (s0.P.size ? s0.P : latest.P)) {
    let x = pp.x, y = pp.y, a = pp.a; const p1 = s1.P.get(id); if (p1) { x = lerp(pp.x, p1.x, t); y = lerp(pp.y, p1.y, t); a = angLerp(pp.a, p1.a, t); }
    if (x < camL - 40 || x > camR + 40 || y < camT - 40 || y > camB + 40) continue;
    shadow(x, y, 24);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); const img = SUR[pp.t % SUR.length]; ctx.drawImage(img, -img.width / 2, -img.height / 2);
    if (pp.m) muzzleAt(a); ctx.restore();
    if (pp.p) ring(x, y, 30, "rgba(120,200,255,0.5)");
    bar(x, y - 32, 34, pp.h / 100, C.red);
    label(x, y - 40, pp.n, "#ffcfca");
    if (pp.m) muzzleFx(x + Math.cos(a) * 30, y + Math.sin(a) * 30, a);
  }

  // self (predicted)
  if (me.alive) {
    shadow(pred.x, pred.y, 24);
    ctx.save(); ctx.translate(pred.x, pred.y); ctx.rotate(aim); ctx.drawImage(SUR_SELF, -36, -36);
    if (me.muzzle) muzzleAt(aim); ctx.restore();
    if (me.prot) ring(pred.x, pred.y, 32, "rgba(120,255,235,0.7)");
    if (me.muzzle) muzzleFx(pred.x + Math.cos(aim) * 32, pred.y + Math.sin(aim) * 32, aim);
    label(pred.x, pred.y - 42, STR.you, SELF);
  }

  // particles
  for (const p of parts) { ctx.globalAlpha = clmp(p.life / p.max, 0, 1); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); } ctx.globalAlpha = 1;

  ctx.restore();
  // hurt vignette
  if (me.hurt || me.hp < 30 && me.alive) { const a = me.hurt ? 0.35 : 0.18 + 0.1 * Math.sin(now / 200); ctx.fillStyle = `rgba(150,20,15,${a})`; vignette(); }
  drawHUD(me);
}

function shadow(x, y, r) { ctx.fillStyle = C.shadow; ctx.beginPath(); ctx.ellipse(x, y + 6, r, r * 0.6, 0, 0, 7); ctx.fill(); }
function ring(x, y, r, col) { ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); }
function glowRing(x, y, r) { const g = ctx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, C.yellow + "88"); g.addColorStop(1, C.yellow + "00"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function muzzleAt(a) { ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(44, -5); ctx.lineTo(50, 0); ctx.lineTo(44, 5); ctx.closePath(); ctx.fill(); }
function bar(x, y, w, f, col, small) { f = clmp(f, 0, 1); const h = small ? 3 : 4; ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(x - w / 2, y, w, h); ctx.fillStyle = col; ctx.fillRect(x - w / 2, y, w * f, h); }
function label(x, y, txt, col) { ctx.font = "700 13px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillText(txt, x + 1, y + 1); ctx.fillStyle = col; ctx.fillText(txt, x, y); }
function vignette() { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, ctx.fillStyle); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }

// ===================================================================== HUD (screen space)
function drawHUD(me) {
  const pad = 14;
  // top center: zone status
  const z = latest.zone;
  const outside = Math.hypot(pred.x - z.x, pred.y - z.y) > z.r;
  let msg = STR.zoneSafe, col = C.textDim;
  if (outside) { msg = STR.zoneToxic; col = "#ff7a6a"; } else if (z.shrinking) { msg = STR.zoneShrinking; col = C.yellow; }
  ctx.textAlign = "center"; ctx.font = "800 18px system-ui,sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillText(msg, W / 2 + 1, 31); ctx.fillStyle = col; ctx.fillText(msg, W / 2, 30);

  // top-left: kills / alive
  ctx.textAlign = "left"; panel(pad, pad, 150, 46);
  ctx.font = "800 22px system-ui"; ctx.fillStyle = C.yellow; ctx.fillText(me.kills, pad + 12, pad + 30);
  ctx.font = "600 11px system-ui"; ctx.fillStyle = C.textDim; ctx.fillText(STR.hudKills, pad + 12, pad + 41);
  ctx.font = "800 22px system-ui"; ctx.fillStyle = C.text; ctx.fillText(latest.alive, pad + 84, pad + 30);
  ctx.font = "600 11px system-ui"; ctx.fillStyle = C.textDim; ctx.fillText(STR.hudAlive, pad + 84, pad + 41);

  // top-right: leaderboard
  const lbW = 188, lbX = W - lbW - pad;
  panel(lbX, pad, lbW, 22 + latest.board.length * 18 + 8);
  ctx.font = "700 12px system-ui"; ctx.fillStyle = C.yellow; ctx.fillText(STR.leaderboard, lbX + 10, pad + 17);
  ctx.font = "600 12px system-ui";
  latest.board.forEach((e, i) => { const y = pad + 35 + i * 18; const mine = e.n === me.name; ctx.fillStyle = mine ? C.yellow : C.text; ctx.fillText(`${i + 1}. ${e.n}${e.b ? "" : " ★"}`, lbX + 10, y); ctx.textAlign = "right"; ctx.fillStyle = mine ? C.yellow : C.textDim; ctx.fillText(e.s, lbX + lbW - 10, y); ctx.textAlign = "left"; });

  // kill feed (under leaderboard)
  ctx.font = "600 12px system-ui"; ctx.textAlign = "right";
  const feedY = pad + 35 + latest.board.length * 18 + 18;
  latest.feed.slice().reverse().forEach((f, i) => { ctx.globalAlpha = clmp(1 - i * 0.18, 0.25, 1); ctx.fillStyle = C.textDim; ctx.fillText(`${f.a}  ⟶  ${f.b}`, W - pad, feedY + i * 17); }); ctx.globalAlpha = 1; ctx.textAlign = "left";

  // bottom-left: health + armor + weapon + ammo
  const bw = Math.min(330, W - 28), bx = pad, by = H - 84;
  panel(bx, by, bw, 70);
  // health bar
  hbar(bx + 12, by + 12, bw - 24, 16, me.hp / 100, "#d8463a", `${me.hp}`);
  // armor bar
  if (me.armor > 0) hbar(bx + 12, by + 33, bw - 24, 8, me.armor / 100, "#5aa0d8", "");
  // weapon slots
  let wx = bx + 12; tapSlots = [];
  for (const k of WORDER) { const owned = me.owned.includes(k); const cur = me.weapon === k; const sw = 52, sy = by + 44, sh = 22;
    ctx.fillStyle = cur ? "rgba(255,210,63,0.22)" : "rgba(255,255,255,0.05)"; round(ctx, wx, sy, sw, sh, 4); ctx.fill();
    ctx.strokeStyle = cur ? C.yellow : (owned ? C.hudLine : "rgba(255,255,255,0.08)"); ctx.lineWidth = cur ? 2 : 1; ctx.stroke();
    if (owned) { ctx.globalAlpha = 1; ctx.drawImage(GUN[k], wx + 4, sy - 6, 34, 34); } else ctx.globalAlpha = 0.25;
    ctx.globalAlpha = 1;
    if (isTouch) tapSlots.push({ k, x: wx, y: sy, w: sw, h: sh });
    wx += sw + 6;
  }
  // ammo readout
  ctx.textAlign = "right"; ctx.font = "800 20px system-ui";
  ctx.fillStyle = me.reloading ? C.yellow : C.text;
  const ammoTxt = me.reloading ? STR.reloading : `${me.mag}${WORDER.indexOf(me.weapon) > 0 ? " / " + me.ammo : ""}`;
  ctx.fillText(ammoTxt, bx + bw - 12, by + 38);
  ctx.font = "600 11px system-ui"; ctx.fillStyle = C.textDim; ctx.fillText(STR.weapons[me.weapon], bx + bw - 12, by + 52); ctx.textAlign = "left";

  // minimap bottom-right
  drawMinimap();

  // crosshair (desktop)
  if (!isTouch) { ctx.strokeStyle = "rgba(255,210,63,0.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 9, 0, 7); ctx.moveTo(mouse.x - 14, mouse.y); ctx.lineTo(mouse.x - 5, mouse.y); ctx.moveTo(mouse.x + 5, mouse.y); ctx.lineTo(mouse.x + 14, mouse.y); ctx.moveTo(mouse.x, mouse.y - 14); ctx.lineTo(mouse.x, mouse.y - 5); ctx.moveTo(mouse.x, mouse.y + 5); ctx.lineTo(mouse.x, mouse.y + 14); ctx.stroke(); }

  // touch stick visuals
  if (isTouch) { drawStick(sticks.move); drawStick(sticks.aim, true); }
}
function panel(x, y, w, h) { ctx.fillStyle = C.hud; round(ctx, x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = C.hudLine; ctx.lineWidth = 1; ctx.stroke(); }
function hbar(x, y, w, h, f, col, txt) { f = clmp(f, 0, 1); ctx.fillStyle = "rgba(0,0,0,0.45)"; round(ctx, x, y, w, h, h / 2); ctx.fill(); ctx.fillStyle = col; round(ctx, x, y, Math.max(h, w * f), h, h / 2); ctx.fill(); if (txt) { ctx.fillStyle = "#fff"; ctx.font = "700 11px system-ui"; ctx.textAlign = "center"; ctx.fillText(txt, x + w / 2, y + h - 3); ctx.textAlign = "left"; } }
function drawStick(s, aimStick) { if (!s) return; ctx.strokeStyle = aimStick ? "rgba(255,210,63,0.5)" : "rgba(255,255,255,0.4)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.ox, s.oy, 46, 0, 7); ctx.stroke(); const dx = clmp(s.x - s.ox, -46, 46), dy = clmp(s.y - s.oy, -46, 46); ctx.fillStyle = aimStick ? "rgba(255,210,63,0.6)" : "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(s.ox + dx, s.oy + dy, 22, 0, 7); ctx.fill(); }

function drawMinimap() {
  const s = Math.min(150, W * 0.28), x = W - s - 14, y = H - s - 14, k = s / MAP;
  ctx.fillStyle = "rgba(15,18,12,0.78)"; round(ctx, x, y, s, s, 8); ctx.fill(); ctx.strokeStyle = C.hudLine; ctx.lineWidth = 1; ctx.stroke();
  ctx.save(); round(ctx, x, y, s, s, 8); ctx.clip();
  const z = latest.zone;
  ctx.fillStyle = C.danger; ctx.fillRect(x, y, s, s);
  ctx.beginPath(); ctx.arc(x + z.x * k, y + z.y * k, z.r * k, 0, 7); ctx.fillStyle = "rgba(60,70,52,0.65)"; ctx.fill();
  ctx.strokeStyle = C.dangerEdge; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + z.x * k, y + z.y * k, z.r * k, 0, 7); ctx.stroke();
  if (z.shrinking) { ctx.setLineDash([4, 3]); ctx.strokeStyle = C.safe; ctx.beginPath(); ctx.arc(x + z.tx * k, y + z.ty * k, z.tr * k, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  for (const p of latest.P.values()) { ctx.fillStyle = "#e0584a"; ctx.fillRect(x + p.x * k - 1.5, y + p.y * k - 1.5, 3, 3); }
  for (const zz of latest.Z.values()) { ctx.fillStyle = "rgba(150,200,80,0.6)"; ctx.fillRect(x + zz.x * k - 1, y + zz.y * k - 1, 2, 2); }
  ctx.fillStyle = SELF; ctx.beginPath(); ctx.arc(x + pred.x * k, y + pred.y * k, 3, 0, 7); ctx.fill();
  ctx.restore();
}

// ===================================================================== screens
function show(el) { el.style.display = "flex"; }
function hide(el) { el.style.display = "none"; }
function showDeath(me) {
  deathShown = true; elDeathTitle.textContent = STR.died;
  elDeathSub.textContent = me.killedBy ? STR.eliminatedBy(me.killedBy) : "";
  show(death);
  const tick = () => { if (!deathShown) return; const m = latest.me; if (m.alive) { hide(death); deathShown = false; return; } const sec = Math.ceil(m.respawn * TICK); if (sec > 0) { elRedeploy.textContent = STR.redeployIn(sec); elRedeploy.disabled = true; } else { elRedeploy.textContent = STR.redeploy; elRedeploy.disabled = false; } setTimeout(tick, 200); };
  tick();
}

// expose for inline html
window.__zz = { startGame };
