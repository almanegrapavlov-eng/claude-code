// Headless smoke test: run the real client against a stubbed browser to catch
// runtime errors in sprite build + the full render/HUD/minimap path.
const noop = () => {};
function ctxStub() {
  const t = { canvas: { width: 1280, height: 720 } };
  return new Proxy(t, {
    get(o, p) {
      if (p in o) return o[p];
      if (p === "createRadialGradient" || p === "createLinearGradient") return () => ({ addColorStop: noop });
      if (p === "createPattern") return () => ({});
      if (p === "measureText") return () => ({ width: 12 });
      if (p === "getImageData") return () => ({ data: [] });
      return noop; // any drawing method
    },
    set(o, p, v) { o[p] = v; return true; },
  });
}
function el() {
  return new Proxy({ style: {}, classList: { add: noop, remove: noop }, width: 1280, height: 720, value: "", dataset: {} }, {
    get(o, p) {
      if (p in o) return o[p];
      if (p === "getContext") return () => ctxStub();
      if (p === "addEventListener" || p === "removeEventListener" || p === "appendChild" || p === "focus" || p === "setAttribute") return noop;
      if (p === "querySelector") return () => el();
      if (p === "getBoundingClientRect") return () => ({ left: 0, top: 0, width: 1280, height: 720 });
      return undefined;
    },
    set(o, p, v) { o[p] = v; return true; },
  });
}
const audioParam = () => ({ value: 0, setValueAtTime: noop, exponentialRampToValueAtTime: noop, linearRampToValueAtTime: noop });
const audioNode = () => new Proxy({ gain: audioParam(), frequency: audioParam(), detune: audioParam(), Q: audioParam(), type: "", buffer: null }, { get(o, p) { if (p in o) return o[p]; return noop; }, set(o, p, v) { o[p] = v; return true; } });
class AudioCtxStub { constructor() { this.currentTime = 0; this.sampleRate = 44100; this.destination = {}; } createGain() { return audioNode(); } createBiquadFilter() { return audioNode(); } createOscillator() { return audioNode(); } createBufferSource() { return audioNode(); } createBuffer() { return { getChannelData: () => new Float32Array(16) }; } }

const rafCbs = [];
let nowT = 1000;
let lastWS = null;
class WSStub { constructor(u) { this.url = u; this.readyState = 1; this.sent = []; lastWS = this; setTimeout(() => this.onopen && this.onopen(), 0); } send(d) { this.sent.push(d); } close() { this.readyState = 3; this.onclose && this.onclose(); } }

globalThis.window = globalThis;
globalThis.document = {
  getElementById: () => el(), createElement: () => el(), addEventListener: noop, body: el(),
};
globalThis.addEventListener = noop;
globalThis.matchMedia = () => ({ matches: false, addEventListener: noop });
globalThis.devicePixelRatio = 2;
globalThis.innerWidth = 1280; globalThis.innerHeight = 720;
globalThis.performance = { now: () => nowT };
globalThis.requestAnimationFrame = (cb) => { rafCbs.push(cb); return rafCbs.length; };
Object.defineProperty(globalThis, "navigator", { value: { getGamepads: () => [] }, configurable: true });
globalThis.location = { protocol: "https:", host: "x.test", pathname: "/s/zz/", search: "" };
const store = () => { const m = new Map(); return { getItem: (k) => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; };
globalThis.localStorage = store(); globalThis.sessionStorage = store();
globalThis.AudioContext = AudioCtxStub; globalThis.webkitAudioContext = AudioCtxStub;
globalThis.WebSocket = WSStub;
globalThis.setInterval = (fn) => { return 0; }; // capture but don't loop
globalThis.URLSearchParams = URLSearchParams;

let failed = false;
process.on("uncaughtException", (e) => { console.error("RUNTIME ERROR:", e && e.stack || e); failed = true; });

await import("/home/user/claude-code/zombie-io/game.js");
console.log("module import: OK (sprites + ground pattern built)");

// start the game (wires connect, audio, loop)
globalThis.__zz.startGame();
if (lastWS) lastWS.onopen && lastWS.onopen();
console.log("startGame: OK, join sent:", lastWS && lastWS.sent.length > 0);

// feed an init + a couple of states, then drive frames
const obstacles = [
  { kind: "wall", x: 1700, y: 1700, w: 300, h: 26 },
  { kind: "tree", x: 1850, y: 1900, r: 34 },
  { kind: "rock", x: 1600, y: 1850, r: 36 },
];
lastWS.onmessage({ data: JSON.stringify({ t: "init", self: "p1", map: { w: 3600, h: 3600 }, obstacles, tick: 1 }) });

function makeState(alive, tick) {
  return JSON.stringify({
    t: "state", tick, alive: 9,
    me: { x: 1800, y: 1800, a: 0.3, hp: alive ? 78 : 0, armor: 40, alive, respawn: alive ? 0 : 40, prot: 0, weapon: "smg", owned: ["pistol", "smg", "shotgun"], mag: 18, magmax: 30, ammo: 64, reloading: 0, kills: 3, zk: 7, name: "Tester", muzzle: tick % 2, hurt: alive ? 0 : 1, pickup: tick === 3 ? "medkit" : 0, killedBy: alive ? 0 : "Reaper", rank: 2 },
    players: [{ i: "b1", x: 1950, y: 1820, a: 3.1, h: 60, n: "Reaper", w: "rifle", t: 1, m: 1, b: 1, p: 0 }, { i: "b2", x: 1700, y: 1950, a: 1.2, h: 100, n: "Vex", w: "pistol", t: 2, m: 0, b: 1, p: 1 }],
    zombies: [{ i: 5, x: 1880, y: 1760, a: 2.0, h: 70 }, { i: 6, x: 1760, y: 1880, a: 0.5, h: 100 }],
    bullets: [{ x: 1860, y: 1805, a: 0.3 }, { x: 1820, y: 1808, a: 0.3 }],
    loot: [{ i: 11, x: 1840, y: 1840, k: "weapon", w: "shotgun" }, { i: 12, x: 1770, y: 1810, k: "medkit" }, { i: 13, x: 1900, y: 1790, k: "crate" }, { i: 14, x: 1700, y: 1700, k: "ammo" }, { i: 15, x: 1730, y: 1760, k: "armor" }],
    zone: { x: 1800, y: 1800, r: 1200, tx: 1850, ty: 1750, tr: 700, dps: 4, shrinking: true },
    board: [{ n: "Reaper", k: 9, s: 900, b: 1 }, { n: "Tester", k: 3, s: 405, b: 0 }, { n: "Vex", k: 2, s: 215, b: 1 }],
    feed: [{ a: "Reaper", b: "Husk", w: "Rifle" }, { a: "🧟", b: "Pike", w: "zombie" }],
  });
}
for (let i = 1; i <= 4; i++) { nowT += 50; lastWS.onmessage({ data: makeState(true, i) }); }
// drive a few animation frames
for (let f = 0; f < 6 && rafCbs.length; f++) { const cb = rafCbs.shift(); nowT += 16; cb(nowT); }
console.log("alive render frames: OK");
// now a death state + frames (exercises showDeath + hurt vignette)
nowT += 50; lastWS.onmessage({ data: makeState(false, 9) });
for (let f = 0; f < 4 && rafCbs.length; f++) { const cb = rafCbs.shift(); nowT += 16; cb(nowT); }
console.log("death render frames: OK");

setTimeout(() => { if (failed) { console.log("SMOKE: FAIL"); process.exit(1); } console.log("SMOKE: PASS"); process.exit(0); }, 50);
