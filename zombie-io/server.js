// ZOMBIE ZONE .io — authoritative realtime server (Tier-2 custom server).
// One DurableObject instance == one match room (one shard). Fixed 20Hz tick.
// Style note: simulation only; all visuals are drawn client-side from STYLE FORMULA v1.
import { DurableObject } from "cloudflare:workers";

// ---------------------------------------------------------------- config
const TICK_MS = 50;                 // 20 Hz fixed step
const DT = TICK_MS / 1000;
const MAP = 3600;                   // world is MAP x MAP units
const VIEW = 1300;                  // per-player broadcast cull radius
const TARGET_PLAYERS = 10;          // humans + bots fill to this
const MAX_PLAYERS = 14;
const PLAYER_R = 26, PLAYER_SPEED = 230, PLAYER_HP = 100;
const ZOMBIE_R = 24, ZOMBIE_HP = 58, ZOMBIE_BITE = 14, ZOMBIE_BITE_CD = 700;
const ZOMBIE_AGGRO = 430, ZOMBIE_CAP_MAX = 90;
const RESPAWN_TICKS = Math.round(3000 / TICK_MS);
const SPAWN_PROT_TICKS = Math.round(2000 / TICK_MS);
const MAX_BULLETS = 420;

const WEAPONS = {
  pistol:  { name: "Pistol",  dmg: 18, rate: 280, speed: 900,  mag: 12, reload: 1100, spread: 0.045, pellets: 1, range: 900,  inf: true  },
  smg:     { name: "SMG",     dmg: 12, rate: 90,  speed: 1000, mag: 30, reload: 1500, spread: 0.10,  pellets: 1, range: 820,  inf: false },
  shotgun: { name: "Shotgun", dmg: 11, rate: 750, speed: 850,  mag: 6,  reload: 2000, spread: 0.20,  pellets: 8, range: 540,  inf: false },
  rifle:   { name: "Rifle",   dmg: 40, rate: 600, speed: 1500, mag: 8,  reload: 2100, spread: 0.022, pellets: 1, range: 1500, inf: false },
};
const WORDER = ["pistol", "smg", "shotgun", "rifle"];

// zone shrink cycle (radii in units, times in seconds). after the last it relocates.
const ZONE_STAGES = [
  { r: 1800, hold: 9,  move: 18, dps: 2 },
  { r: 1150, hold: 8,  move: 16, dps: 4 },
  { r: 680,  hold: 8,  move: 14, dps: 7 },
  { r: 360,  hold: 9,  move: 12, dps: 12 },
  { r: 170,  hold: 11, move: 10, dps: 20 },
];

const BOT_NAMES = ["Reaper", "Vex", "Hazmat", "Ghoul", "Rotter", "Cinder", "Husk", "Maw",
  "Briar", "Crank", "Drift", "Echo", "Fang", "Grit", "Halo", "Iron", "Jolt", "Kilo",
  "Nomad", "Onyx", "Pike", "Quill", "Rust", "Slate", "Talon", "Umber", "Viper", "Wraith"];

// ---------------------------------------------------------------- math
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const len = (x, y) => Math.hypot(x, y);
function segCircle(ax, ay, bx, by, cx, cy, r) { // does segment AB intersect circle (c,r)?
  const dx = bx - ax, dy = by - ay; const fx = ax - cx, fy = ay - cy;
  const a = dx * dx + dy * dy; if (a === 0) return fx * fx + fy * fy <= r * r;
  let t = -(fx * dx + fy * dy) / a; t = clamp(t, 0, 1);
  const px = ax + dx * t - cx, py = ay + dy * t - cy; return px * px + py * py <= r * r;
}
function segRect(ax, ay, bx, by, rx, ry, rw, rh) { // segment vs axis-aligned rect (corner x,y,w,h)
  // quick: clip with Liang-Barsky
  let t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay;
  const p = [-dx, dx, -dy, dy]; const q = [ax - rx, rx + rw - ax, ay - ry, ry + rh - ay];
  for (let i = 0; i < 4; i++) { if (p[i] === 0) { if (q[i] < 0) return false; } else { const t = q[i] / p[i]; if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } } }
  return true;
}

// ---------------------------------------------------------------- map
function genMap(seed) {
  const rng = mulberry32(seed);
  const obstacles = []; // {kind, x,y, r?  / w,h?}
  const pad = 220;
  // buildings: rectangular wall rooms with a door gap
  const nB = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < nB; i++) {
    const w = 280 + rng() * 360, h = 280 + rng() * 360;
    const x = pad + rng() * (MAP - 2 * pad - w), y = pad + rng() * (MAP - 2 * pad - h);
    const th = 26; // wall thickness
    const door = 110 + rng() * 60; const dside = Math.floor(rng() * 4);
    // four walls, leave a door gap on one side
    const segs = [];
    if (dside === 0) { segs.push([x, y, w * 0.5 - door * 0.5, th]); segs.push([x + w * 0.5 + door * 0.5, y, w * 0.5 - door * 0.5, th]); }
    else segs.push([x, y, w, th]);
    if (dside === 1) { segs.push([x, y + h - th, w * 0.5 - door * 0.5, th]); segs.push([x + w * 0.5 + door * 0.5, y + h - th, w * 0.5 - door * 0.5, th]); }
    else segs.push([x, y + h - th, w, th]);
    if (dside === 2) { segs.push([x, y, th, h * 0.5 - door * 0.5]); segs.push([x, y + h * 0.5 + door * 0.5, th, h * 0.5 - door * 0.5]); }
    else segs.push([x, y, th, h]);
    if (dside === 3) { segs.push([x + w - th, y, th, h * 0.5 - door * 0.5]); segs.push([x + w - th, y + h * 0.5 + door * 0.5, th, h * 0.5 - door * 0.5]); }
    else segs.push([x + w - th, y, th, h]);
    for (const s of segs) if (s[2] > 8 && s[3] > 8) obstacles.push({ kind: "wall", x: s[0], y: s[1], w: s[2], h: s[3] });
  }
  // trees & rocks (circular cover)
  const nT = 46 + Math.floor(rng() * 18);
  for (let i = 0; i < nT; i++) {
    const kind = rng() < 0.6 ? "tree" : "rock";
    const r = kind === "tree" ? 30 + rng() * 14 : 30 + rng() * 18;
    obstacles.push({ kind, x: pad + rng() * (MAP - 2 * pad), y: pad + rng() * (MAP - 2 * pad), r });
  }
  return { obstacles, seed };
}

// ---------------------------------------------------------------- server
export class GameServer extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.clients = new Map();   // connId -> { ws, pid }
    this.nextConn = 1;
    this.loop = null;
    this.world = null;
  }

  // single entry the engine forwards every request (incl. WS upgrade) to
  async fetch(req) {
    if (req.headers.get("Upgrade") !== "websocket")
      return new Response("zombie-zone realtime server", { status: 200 });
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    server.accept();
    const id = this.nextConn++;
    this.clients.set(id, { ws: server, pid: null });
    server.addEventListener("message", (ev) => { try { this.onMessage(id, ev.data); } catch (e) { /* ignore bad frame */ } });
    server.addEventListener("close", () => this.onClose(id));
    server.addEventListener("error", () => this.onClose(id));
    this.ensureWorld();
    this.ensureLoop();
    return new Response(null, { status: 101, webSocket: client });
  }

  // ----- world lifecycle
  ensureWorld() {
    if (this.world) return;
    const seed = (Math.random() * 1e9) | 0;
    this.world = {
      rng: mulberry32(seed + 7),
      map: genMap(seed),
      players: new Map(),   // pid -> player
      zombies: [],
      bullets: [],
      loot: [],
      feed: [],
      tick: 0,
      zombieTimer: 0,
      botSeq: 0,
      zone: null,
    };
    this.initZone();
    this.scatterLoot(26);
  }
  ensureLoop() { if (!this.loop) this.loop = setInterval(() => this.tick(), TICK_MS); }
  stopLoop() { if (this.loop) { clearInterval(this.loop); this.loop = null; } }

  send(connId, obj) { const c = this.clients.get(connId); if (c && c.ws.readyState === 1) { try { c.ws.send(JSON.stringify(obj)); } catch (e) { } } }

  // ----- networking
  onMessage(connId, raw) {
    if (typeof raw !== "string") return;
    const msg = JSON.parse(raw);
    const c = this.clients.get(connId); if (!c) return;
    const w = this.world;
    if (msg.t === "join") {
      const pid = String(msg.pid || "").slice(0, 40) || ("h" + connId);
      c.pid = pid;
      let p = w.players.get(pid);
      const name = String(msg.name || "Survivor").slice(0, 16).replace(/[<>]/g, "") || "Survivor";
      if (!p) { p = this.makePlayer(pid, name, false); w.players.set(pid, p); this.spawnPlayer(p); }
      else { p.name = name; p.isBot = false; }
      p.conn = connId;
      this.balanceBots();
      this.send(connId, { t: "init", self: pid, map: { w: MAP, h: MAP }, obstacles: w.map.obstacles, tick: w.tick });
      return;
    }
    if (!c.pid) return;
    const p = w.players.get(c.pid); if (!p) return;
    if (msg.t === "input") {
      p.in.mx = clamp(+msg.mx || 0, -1, 1); p.in.my = clamp(+msg.my || 0, -1, 1);
      const m = len(p.in.mx, p.in.my); if (m > 1) { p.in.mx /= m; p.in.my /= m; }
      if (typeof msg.aim === "number") p.aim = msg.aim;
      p.in.fire = !!msg.fire; p.in.reload = !!msg.reload;
      if (msg.swap) p.in.swap = msg.swap; // weapon key to switch to
      p.lastSeq = msg.seq | 0;
    } else if (msg.t === "respawn") {
      if (!p.alive && p.respawn <= 0) this.spawnPlayer(p);
    } else if (msg.t === "ping") {
      this.send(connId, { t: "pong", ts: msg.ts });
    }
  }

  onClose(connId) {
    const c = this.clients.get(connId); if (!c) return;
    // a disconnected human keeps playing as a bot; reconnect (same pid) reclaims them
    if (c.pid && this.world) { const p = this.world.players.get(c.pid); if (p) { p.conn = null; p.isBot = true; } }
    this.clients.delete(connId);
    let humans = 0; for (const cc of this.clients.values()) if (cc.pid) humans++;
    if (humans === 0) { this.stopLoop(); this.world = null; }      // empty room -> stop the loop, let the DO evict
    else if (this.world) this.balanceBots();
  }

  // ----- entities
  makePlayer(pid, name, isBot) {
    return {
      id: pid, name, isBot, conn: null, x: MAP / 2, y: MAP / 2, aim: 0,
      hp: PLAYER_HP, armor: 0, alive: false, respawn: 0, prot: 0,
      weapon: "pistol", owned: { pistol: true }, mag: { pistol: WEAPONS.pistol.mag }, ammo: 0,
      reloadEnd: 0, lastShot: 0, kills: 0, zk: 0, deaths: 0, tint: (Math.random() * 6) | 0,
      in: { mx: 0, my: 0, fire: false, reload: false, swap: null }, lastSeq: 0,
      bot: { wander: Math.random() * 6.28, retarget: 0, target: null, strafe: 1, fireUntil: 0 },
      hurt: 0, leaveAt: 0,
    };
  }

  safeSpawn() {
    const w = this.world; const z = w.zone;
    for (let i = 0; i < 40; i++) {
      const ang = Math.random() * 6.28, rad = Math.random() * Math.max(120, z.r * 0.85);
      const x = clamp(z.x + Math.cos(ang) * rad, 80, MAP - 80);
      const y = clamp(z.y + Math.sin(ang) * rad, 80, MAP - 80);
      if (!this.hitsObstacle(x, y, PLAYER_R + 6) && !this.nearEnemy(x, y, 320)) return { x, y };
    }
    return { x: z.x, y: z.y };
  }
  nearEnemy(x, y, r) { const w = this.world; const r2 = r * r; for (const p of w.players.values()) if (p.alive && dist2(x, y, p.x, p.y) < r2) return true; for (const z of w.zombies) if (dist2(x, y, z.x, z.y) < r2) return true; return false; }

  spawnPlayer(p) {
    const s = this.safeSpawn();
    p.x = s.x; p.y = s.y; p.hp = PLAYER_HP; p.armor = 0; p.alive = true; p.respawn = 0;
    p.prot = SPAWN_PROT_TICKS; p.weapon = "pistol"; p.owned = { pistol: true };
    p.mag = { pistol: WEAPONS.pistol.mag }; p.ammo = 30; p.reloadEnd = 0; p.in.fire = false;
    p.killedBy = 0; p.pickup = 0; p.hurt = 0; p._zacc = 0;
  }

  balanceBots() {
    const w = this.world;
    let humans = 0, bots = [];
    for (const p of w.players.values()) { if (p.isBot) bots.push(p); else humans++; }
    const wantBots = clamp(TARGET_PLAYERS - humans, 0, MAX_PLAYERS - humans);
    while (bots.length < wantBots) {
      const id = "bot" + (w.botSeq++);
      const nm = BOT_NAMES[(Math.random() * BOT_NAMES.length) | 0];
      const b = this.makePlayer(id, nm, true); w.players.set(id, b); this.spawnPlayer(b);
      if (Math.random() < 0.5) { const g = WORDER[1 + ((Math.random() * 3) | 0)]; b.owned[g] = true; b.weapon = g; b.mag[g] = WEAPONS[g].mag; b.ammo = 90; }
      bots.push(b);
    }
    while (bots.length > wantBots) { const b = bots.pop(); w.players.delete(b.id); }
  }

  // ----- loot
  scatterLoot(n) {
    for (let i = 0; i < n; i++) this.spawnLoot(null);
    // also place destructible crates that drop loot
    const w = this.world;
    const nc = 22 + ((Math.random() * 8) | 0);
    for (let i = 0; i < nc; i++) {
      const x = 200 + Math.random() * (MAP - 400), y = 200 + Math.random() * (MAP - 400);
      if (this.hitsObstacle(x, y, 40)) continue;
      w.loot.push({ id: (w._lid = (w._lid || 0) + 1), x, y, kind: "crate", hp: 40, r: 26 });
    }
  }
  spawnLoot(at) {
    const w = this.world;
    const roll = Math.random();
    let kind, weapon = null;
    if (roll < 0.42) { kind = "weapon"; weapon = WORDER[1 + ((Math.random() * 3) | 0)]; }
    else if (roll < 0.66) kind = "ammo";
    else if (roll < 0.85) kind = "medkit";
    else kind = "armor";
    let x, y;
    if (at) { x = at.x + (Math.random() - 0.5) * 50; y = at.y + (Math.random() - 0.5) * 50; }
    else { let tries = 0; do { x = 160 + Math.random() * (MAP - 320); y = 160 + Math.random() * (MAP - 320); tries++; } while (this.hitsObstacle(x, y, 30) && tries < 20); }
    w.loot.push({ id: (w._lid = (w._lid || 0) + 1), x, y, kind, weapon, r: 18 });
  }

  // ----- zone
  initZone() {
    const w = this.world;
    w.zone = { x: MAP / 2, y: MAP / 2, r: 2600, fromx: MAP / 2, fromy: MAP / 2, fromr: 2600, tox: MAP / 2, toy: MAP / 2, tor: 2600, mode: "hold", t: 12, dur: 1, dps: 1, stage: -1 };
  }
  zoneNext() {
    const w = this.world, z = w.zone;
    z.stage++;
    if (z.stage >= ZONE_STAGES.length) { // relocate: grow to a fresh big circle elsewhere
      z.stage = -1;
      const nx = 600 + Math.random() * (MAP - 1200), ny = 600 + Math.random() * (MAP - 1200);
      this.beginMove(nx, ny, 2400, 7, 1); return;
    }
    const st = ZONE_STAGES[z.stage];
    // new center stays inside current circle so it's reachable
    const ang = Math.random() * 6.28, off = Math.random() * Math.max(0, z.r - st.r) * 0.8;
    const nx = clamp(z.x + Math.cos(ang) * off, st.r + 60, MAP - st.r - 60);
    const ny = clamp(z.y + Math.sin(ang) * off, st.r + 60, MAP - st.r - 60);
    this.beginMove(nx, ny, st.r, st.move, st.dps);
  }
  beginMove(tx, ty, tr, dur, dps) {
    const z = this.world.zone;
    z.fromx = z.x; z.fromy = z.y; z.fromr = z.r; z.tox = tx; z.toy = ty; z.tor = tr;
    z.mode = "move"; z.t = dur; z.dur = dur; z.dps = dps;
  }
  updateZone() {
    const z = this.world.zone; z.t -= DT;
    if (z.mode === "move") {
      const p = 1 - clamp(z.t / z.dur, 0, 1), e = p * p * (3 - 2 * p);
      z.x = z.fromx + (z.tox - z.fromx) * e; z.y = z.fromy + (z.toy - z.fromy) * e; z.r = z.fromr + (z.tor - z.fromr) * e;
      if (z.t <= 0) { z.x = z.tox; z.y = z.toy; z.r = z.tor; z.mode = "hold"; const st = z.stage < 0 ? { hold: 8 } : ZONE_STAGES[z.stage]; z.t = st.hold; }
    } else if (z.t <= 0) this.zoneNext();
  }

  // ----- obstacle queries / collision
  hitsObstacle(x, y, r) {
    for (const o of this.world.map.obstacles) {
      if (o.kind === "wall") { const cx = clamp(x, o.x, o.x + o.w), cy = clamp(y, o.y, o.y + o.h); if (dist2(x, y, cx, cy) < r * r) return true; }
      else { const rr = o.r + r; if (dist2(x, y, o.x, o.y) < rr * rr) return true; }
    }
    return false;
  }
  resolve(ent, r) { // push entity out of obstacles
    for (const o of this.world.map.obstacles) {
      if (o.kind === "wall") {
        const cx = clamp(ent.x, o.x, o.x + o.w), cy = clamp(ent.y, o.y, o.y + o.h);
        const dx = ent.x - cx, dy = ent.y - cy; const d = len(dx, dy);
        if (d < r && d > 0.0001) { ent.x = cx + dx / d * r; ent.y = cy + dy / d * r; }
        else if (d === 0) { ent.x += r; } // degenerate: nudge
      } else {
        const rr = o.r + r; const dx = ent.x - o.x, dy = ent.y - o.y; const d2 = dx * dx + dy * dy;
        if (d2 < rr * rr) { const d = Math.sqrt(d2) || 0.001; ent.x = o.x + dx / d * rr; ent.y = o.y + dy / d * rr; }
      }
    }
    ent.x = clamp(ent.x, r, MAP - r); ent.y = clamp(ent.y, r, MAP - r);
  }
  bulletBlocked(ax, ay, bx, by) { // returns crate hit (to damage) or true if wall/tree/rock blocks
    let crate = null, blocked = false;
    for (const o of this.world.map.obstacles) {
      if (o.kind === "wall") { if (segRect(ax, ay, bx, by, o.x, o.y, o.w, o.h)) blocked = true; }
      else if (o.kind === "rock") { if (segCircle(ax, ay, bx, by, o.x, o.y, o.r)) blocked = true; }
      // trees block bullets through their trunk only (smaller), let edges pass for feel
      else if (o.kind === "tree") { if (segCircle(ax, ay, bx, by, o.x, o.y, o.r * 0.55)) blocked = true; }
    }
    return { blocked };
  }

  // ----- combat
  tryFire(p, now) {
    const W = WEAPONS[p.weapon];
    if (now < p.reloadEnd) return;
    if (now - p.lastShot < W.rate) return;
    let mag = p.mag[p.weapon] || 0;
    if (mag <= 0) {
      if (!W.inf && p.ammo <= 0 && p.weapon !== "pistol") p.weapon = "pistol"; // dry -> fall back to sidearm
      this.startReload(p, now); return;
    }
    p.lastShot = now; p.mag[p.weapon] = mag - 1;
    const w = this.world;
    for (let i = 0; i < W.pellets; i++) {
      const sp = (Math.random() - 0.5) * 2 * W.spread + (W.pellets > 1 ? (i / (W.pellets - 1) - 0.5) * W.spread * 1.6 : 0);
      const a = p.aim + sp;
      const bx = p.x + Math.cos(p.aim) * (PLAYER_R + 6), by = p.y + Math.sin(p.aim) * (PLAYER_R + 6);
      w.bullets.push({ id: (w._bid = (w._bid || 0) + 1), x: bx, y: by, px: bx, py: by, vx: Math.cos(a) * W.speed, vy: Math.sin(a) * W.speed, dmg: W.dmg, owner: p.id, life: W.range / W.speed, a });
    }
    if (w.bullets.length > MAX_BULLETS) w.bullets.splice(0, w.bullets.length - MAX_BULLETS);
    p.muzzle = 2; // ticks of muzzle flash flag
  }
  startReload(p, now) {
    const W = WEAPONS[p.weapon]; const cur = p.mag[p.weapon] || 0; if (cur >= W.mag) return;
    if (now < p.reloadEnd) return;
    if (W.inf) { p.reloadEnd = now + W.reload; p._reloadTo = W.mag; p._reloadW = p.weapon; }
    else { if (p.ammo <= 0) return; p.reloadEnd = now + W.reload; p._reloadTo = W.mag; p._reloadW = p.weapon; }
  }
  finishReloads(p, now) {
    if (p.reloadEnd && now >= p.reloadEnd && p._reloadW) {
      const W = WEAPONS[p._reloadW]; const cur = p.mag[p._reloadW] || 0; const need = W.mag - cur;
      if (W.inf) p.mag[p._reloadW] = W.mag;
      else { const take = Math.min(need, p.ammo); p.ammo -= take; p.mag[p._reloadW] = cur + take; }
      p.reloadEnd = 0; p._reloadW = null;
    }
  }
  damagePlayer(p, dmg, srcId) {
    if (!p.alive || p.prot > 0) return;
    if (p.armor > 0) { const absorb = Math.min(p.armor, dmg * 0.5); p.armor -= absorb; dmg -= absorb; }
    p.hp -= dmg; p.hurt = 3;
    if (p.hp <= 0) this.killPlayer(p, srcId);
  }
  killPlayer(p, srcId) {
    const w = this.world; p.alive = false; p.respawn = RESPAWN_TICKS; p.deaths++;
    // drop loot
    this.spawnLoot({ x: p.x, y: p.y });
    if (p.weapon !== "pistol") w.loot.push({ id: (w._lid = (w._lid || 0) + 1), x: p.x + 14, y: p.y, kind: "weapon", weapon: p.weapon, r: 18 });
    const killer = srcId && w.players.get(srcId);
    let w_name = "the zone";
    if (srcId === "zombie") w_name = "zombie";
    else if (killer) { killer.kills++; w_name = WEAPONS[killer.weapon]?.name || "gunfire"; }
    w.feed.push({ a: killer ? killer.name : (srcId === "zombie" ? "🧟" : "☣"), b: p.name, w: w_name, t: w.tick });
    if (w.feed.length > 8) w.feed.shift();
    p.killedBy = killer ? killer.name : (srcId === "zombie" ? "a zombie" : "the toxic zone");
  }

  // ----- main tick
  tick() {
    const w = this.world; if (!w) return;
    w.tick++; const now = w.tick * TICK_MS;
    this.updateZone();

    // spawn zombies up to cap, in periodic pulses
    let parts = 0; for (const p of w.players.values()) parts++;
    const zcap = Math.min(ZOMBIE_CAP_MAX, 26 + parts * 5);
    w.zombieTimer -= TICK_MS;
    if (w.zombies.length < zcap && w.zombieTimer <= 0) {
      w.zombieTimer = 280 + Math.random() * 320;
      const batch = 1 + ((Math.random() * 3) | 0);
      for (let i = 0; i < batch && w.zombies.length < zcap; i++) this.spawnZombie();
    }

    // players (humans + bots)
    for (const p of w.players.values()) {
      if (p.isBot) this.botThink(p, now);
      // dead -> respawn countdown (bots respawn automatically; humans on request but auto after timer)
      if (!p.alive) {
        if (p.respawn > 0) p.respawn--;
        if (p.isBot && p.respawn <= 0) this.spawnPlayer(p);
        continue;
      }
      if (p.prot > 0) p.prot--;
      // weapon swap
      if (p.in.swap) { if (p.owned[p.in.swap]) { p.weapon = p.in.swap; } p.in.swap = null; }
      // movement
      const sp = PLAYER_SPEED;
      p.x += p.in.mx * sp * DT; p.y += p.in.my * sp * DT;
      this.resolve(p, PLAYER_R);
      // fire / reload
      if (p.in.reload) { this.startReload(p, now); p.in.reload = false; }
      this.finishReloads(p, now);
      if (p.in.fire) this.tryFire(p, now);
      // pickups
      this.pickups(p);
      // zone damage
      const z = w.zone;
      if (dist2(p.x, p.y, z.x, z.y) > z.r * z.r) {
        p._zacc = (p._zacc || 0) + z.dps * DT;
        if (p._zacc >= 1) { const d = Math.floor(p._zacc); p._zacc -= d; this.damagePlayer(p, d, "zone"); }
      } else p._zacc = 0;
      if (p.hurt > 0) p.hurt--;
      if (p.muzzle > 0) p.muzzle--;
    }

    this.updateZombies(now);
    this.updateBullets();

    // periodic loot replenish
    if (w.tick % 90 === 0 && w.loot.filter(l => l.kind !== "crate").length < 22) this.spawnLoot(null);

    this.broadcast();
  }

  pickups(p) {
    const w = this.world;
    for (let i = w.loot.length - 1; i >= 0; i--) {
      const l = w.loot[i]; if (l.kind === "crate") continue;
      if (dist2(p.x, p.y, l.x, l.y) < (PLAYER_R + l.r) * (PLAYER_R + l.r)) {
        let took = true;
        if (l.kind === "weapon") { if (!p.owned[l.weapon]) { p.owned[l.weapon] = true; p.mag[l.weapon] = WEAPONS[l.weapon].mag; p.weapon = l.weapon; } else p.ammo += 20; }
        else if (l.kind === "ammo") p.ammo = Math.min(300, p.ammo + 40);
        else if (l.kind === "medkit") { if (p.hp >= PLAYER_HP) took = false; else p.hp = Math.min(PLAYER_HP, p.hp + 50); }
        else if (l.kind === "armor") { if (p.armor >= 100) took = false; else p.armor = 100; }
        if (took) { w.loot.splice(i, 1); p.pickup = l.kind; }
      }
    }
  }

  spawnZombie() {
    const w = this.world; let x, y, tries = 0;
    do { const edge = Math.floor(Math.random() * 4); const m = 60 + Math.random() * 120;
      if (edge === 0) { x = m; y = Math.random() * MAP; } else if (edge === 1) { x = MAP - m; y = Math.random() * MAP; }
      else if (edge === 2) { x = Math.random() * MAP; y = m; } else { x = Math.random() * MAP; y = MAP - m; }
      tries++; } while (this.hitsObstacle(x, y, ZOMBIE_R) && tries < 12);
    w.zombies.push({ id: (w._zid = (w._zid || 0) + 1), x, y, aim: 0, hp: ZOMBIE_HP, target: null, biteCd: 0, speed: 95 + Math.random() * 55, wander: Math.random() * 6.28 });
  }

  updateZombies(now) {
    const w = this.world;
    for (let i = w.zombies.length - 1; i >= 0; i--) {
      const z = w.zombies[i];
      // acquire nearest living player in aggro
      let best = null, bd = ZOMBIE_AGGRO * ZOMBIE_AGGRO;
      for (const p of w.players.values()) { if (!p.alive || p.prot > 0) continue; const d = dist2(z.x, z.y, p.x, p.y); if (d < bd) { bd = d; best = p; } }
      if (best) {
        const ang = Math.atan2(best.y - z.y, best.x - z.x); z.aim = ang;
        z.x += Math.cos(ang) * z.speed * DT; z.y += Math.sin(ang) * z.speed * DT;
        z.biteCd -= TICK_MS;
        if (dist2(z.x, z.y, best.x, best.y) < (ZOMBIE_R + PLAYER_R) * (ZOMBIE_R + PLAYER_R) && z.biteCd <= 0) {
          z.biteCd = ZOMBIE_BITE_CD; this.damagePlayer(best, ZOMBIE_BITE, "zombie");
        }
      } else { // wander
        z.wander += (Math.random() - 0.5) * 0.4; z.aim = z.wander;
        z.x += Math.cos(z.wander) * z.speed * 0.4 * DT; z.y += Math.sin(z.wander) * z.speed * 0.4 * DT;
      }
      this.resolve(z, ZOMBIE_R);
    }
  }

  updateBullets() {
    const w = this.world;
    for (let i = w.bullets.length - 1; i >= 0; i--) {
      const b = w.bullets[i]; b.px = b.x; b.py = b.y;
      b.x += b.vx * DT; b.y += b.vy * DT; b.life -= DT;
      let dead = b.life <= 0 || b.x < 0 || b.y < 0 || b.x > MAP || b.y > MAP;
      // obstacles
      if (!dead) { const r = this.bulletBlocked(b.px, b.py, b.x, b.y); if (r.blocked) dead = true; }
      // crates (destructible loot)
      if (!dead) { for (const l of w.loot) { if (l.kind === "crate" && segCircle(b.px, b.py, b.x, b.y, l.x, l.y, l.r)) { l.hp -= b.dmg; dead = true; if (l.hp <= 0) { l._destroy = true; } break; } } }
      // zombies
      if (!dead) { for (let j = 0; j < w.zombies.length; j++) { const z = w.zombies[j]; if (segCircle(b.px, b.py, b.x, b.y, z.x, z.y, ZOMBIE_R)) { z.hp -= b.dmg; dead = true; if (z.hp <= 0) { w.zombies.splice(j, 1); const ow = w.players.get(b.owner); if (ow) { ow.zk++; } } break; } } }
      // players (FFA)
      if (!dead) { for (const p of w.players.values()) { if (p.id === b.owner || !p.alive || p.prot > 0) continue; if (segCircle(b.px, b.py, b.x, b.y, p.x, p.y, PLAYER_R)) { this.damagePlayer(p, b.dmg, b.owner); dead = true; break; } } }
      if (dead) w.bullets.splice(i, 1);
    }
    // resolve destroyed crates -> drop loot
    for (let i = w.loot.length - 1; i >= 0; i--) { const l = w.loot[i]; if (l._destroy) { w.loot.splice(i, 1); if (Math.random() < 0.85) this.spawnLoot({ x: l.x, y: l.y }); } }
  }

  // ----- bot AI
  botThink(p, now) {
    if (!p.alive) return;
    const w = this.world, b = p.bot;
    b.retarget -= TICK_MS;
    // find nearest threat: player or zombie
    let tgt = null, td = 1e9, isZombie = false;
    for (const q of w.players.values()) { if (q.id === p.id || !q.alive) continue; const d = dist2(p.x, p.y, q.x, q.y); if (d < td) { td = d; tgt = q; isZombie = false; } }
    for (const z of w.zombies) { const d = dist2(p.x, p.y, z.x, z.y); if (d < td && d < 520 * 520) { td = d; tgt = z; isZombie = true; } }
    const z = w.zone; const inZone = dist2(p.x, p.y, z.x, z.y) < (z.r - 60) * (z.r - 60);
    let mvx = 0, mvy = 0;
    if (!inZone) { // run to safety
      const a = Math.atan2(z.y - p.y, z.x - p.x); mvx = Math.cos(a); mvy = Math.sin(a); p.aim = a;
    } else if (tgt) {
      const range = isZombie ? 360 : (WEAPONS[p.weapon].range * 0.62);
      p.aim = Math.atan2(tgt.y - p.y, tgt.x - p.x) + (Math.random() - 0.5) * 0.10;
      const d = Math.sqrt(td);
      if (d > range) { mvx = Math.cos(p.aim); mvy = Math.sin(p.aim); }     // close in
      else if (d < range * 0.5 && !isZombie) { mvx = -Math.cos(p.aim); mvy = -Math.sin(p.aim); } // back off
      else { mvx = Math.cos(p.aim + 1.57) * b.strafe; mvy = Math.sin(p.aim + 1.57) * b.strafe; } // strafe
      // fire when roughly aimed and in range
      if (d < WEAPONS[p.weapon].range) { p.in.fire = true; } else p.in.fire = false;
      if (b.retarget <= 0) { b.strafe *= Math.random() < 0.5 ? -1 : 1; b.retarget = 700 + Math.random() * 900; }
    } else { // wander toward loot or randomly
      if (b.retarget <= 0 || !b.wx) { b.wx = z.x + (Math.random() - 0.5) * z.r * 1.2; b.wy = z.y + (Math.random() - 0.5) * z.r * 1.2; b.retarget = 1500 + Math.random() * 1500; }
      const a = Math.atan2(b.wy - p.y, b.wx - p.x); mvx = Math.cos(a); mvy = Math.sin(a); p.aim = a; p.in.fire = false;
    }
    p.in.mx = mvx; p.in.my = mvy;
    // auto reload when empty
    if ((p.mag[p.weapon] || 0) <= 0) this.startReload(p, now);
    // pick a better gun if owned
    if (b.retarget > 1200) { for (const g of ["rifle", "shotgun", "smg"]) if (p.owned[g]) { p.weapon = g; break; } }
  }

  // ----- broadcast (per-player culled view)
  broadcast() {
    const w = this.world;
    // shared leaderboard (top 5 by score)
    const all = [...w.players.values()].map(p => ({ name: p.name, kills: p.kills, zk: p.zk, score: p.kills * 100 + p.zk * 15, id: p.id, bot: p.isBot }));
    all.sort((a, b) => b.score - a.score);
    const board = all.slice(0, 5).map(e => ({ n: e.name, k: e.kills, s: e.score, b: e.bot ? 1 : 0 }));
    const feed = w.feed.slice(-5).map(f => ({ a: f.a, b: f.b, w: f.w }));
    const aliveCount = all.length; // participants
    const z = w.zone;
    const zoneMsg = { x: Math.round(z.x), y: Math.round(z.y), r: Math.round(z.r), tx: Math.round(z.tox), ty: Math.round(z.toy), tr: Math.round(z.tor), dps: z.dps, shrinking: z.mode === "move" };

    for (const [connId, c] of this.clients) {
      if (!c.pid) continue; const me = w.players.get(c.pid); if (!me) continue;
      const cx = me.x, cy = me.y, R = VIEW + 120;
      const players = [];
      for (const p of w.players.values()) { if (p.id === me.id) continue; if (!p.alive) continue; if (Math.abs(p.x - cx) > R || Math.abs(p.y - cy) > R) continue; players.push({ i: p.id, x: Math.round(p.x), y: Math.round(p.y), a: +p.aim.toFixed(2), h: Math.max(0, Math.round(p.hp)), n: p.name, w: p.weapon, t: p.tint, m: p.muzzle > 0 ? 1 : 0, b: p.isBot ? 1 : 0, p: p.prot > 0 ? 1 : 0 }); }
      const zombies = [];
      for (const zz of w.zombies) { if (Math.abs(zz.x - cx) > R || Math.abs(zz.y - cy) > R) continue; zombies.push({ i: zz.id, x: Math.round(zz.x), y: Math.round(zz.y), a: +zz.aim.toFixed(2), h: Math.max(0, Math.round(zz.hp / ZOMBIE_HP * 100)) }); }
      const bullets = [];
      for (const b of w.bullets) { if (Math.abs(b.x - cx) > R || Math.abs(b.y - cy) > R) continue; bullets.push({ x: Math.round(b.x), y: Math.round(b.y), a: +b.a.toFixed(2) }); }
      const loot = [];
      for (const l of w.loot) { if (Math.abs(l.x - cx) > R || Math.abs(l.y - cy) > R) continue; loot.push(l.kind === "crate" ? { i: l.id, x: Math.round(l.x), y: Math.round(l.y), k: "crate" } : { i: l.id, x: Math.round(l.x), y: Math.round(l.y), k: l.kind, w: l.weapon || 0 }); }

      const meMsg = {
        x: Math.round(me.x), y: Math.round(me.y), a: +me.aim.toFixed(2), hp: Math.max(0, Math.round(me.hp)), armor: Math.round(me.armor),
        alive: me.alive, respawn: me.respawn, prot: me.prot > 0 ? 1 : 0, weapon: me.weapon, owned: Object.keys(me.owned),
        mag: me.mag[me.weapon] || 0, magmax: WEAPONS[me.weapon].mag, ammo: me.ammo, reloading: me.reloadEnd > 0 ? 1 : 0,
        kills: me.kills, zk: me.zk, name: me.name, muzzle: me.muzzle > 0 ? 1 : 0, hurt: me.hurt > 0 ? 1 : 0, pickup: me.pickup || 0, killedBy: me.killedBy || 0,
        rank: all.findIndex(e => e.id === me.id) + 1,
      };
      me.pickup = 0;
      this.send(connId, { t: "state", tick: w.tick, me: meMsg, players, zombies, bullets, loot, zone: zoneMsg, alive: aliveCount, board, feed });
    }
  }
}

// the engine requires a module default export with a fetch; routing to the DO
// is handled by the platform, so this is only a health endpoint.
export default { fetch() { return new Response("zombie-zone", { status: 200 }); } };
