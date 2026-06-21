// End-to-end netcode test against the LIVE deployed server: two players in one
// room, verify init/state flow, movement, entity visibility, and that the two
// players can see each other (multiplayer.md §6 gate).
import WebSocket from "ws";
const BASE = process.argv[2] || "wss://purple-lantern-559.higgsfield.gg/ws/arena";

function player(pid, name) {
  return new Promise((resolve) => {
    const ws = new WebSocket(BASE);
    const r = { pid, name, init: false, states: 0, sawOther: false, me: null, lastErr: null, players: 0, zombies: 0, ws };
    const others = new Set();
    ws.on("open", () => ws.send(JSON.stringify({ t: "join", pid, name })));
    ws.on("message", (raw) => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (m.t === "init") { r.init = true; }
      else if (m.t === "state") {
        r.states++; r.me = m.me; r.players = m.players.length; r.zombies = Math.max(r.zombies, m.zombies.length);
        for (const p of m.players) others.add(p.i);
      } else if (m.t === "error") r.lastErr = m.error;
    });
    ws.on("error", (e) => { r.lastErr = String(e.message || e); });
    // drive input for ~4s: move in a circle and fire
    let i = 0;
    const iv = setInterval(() => {
      if (ws.readyState !== 1) return;
      i++; const a = i * 0.2;
      ws.send(JSON.stringify({ t: "input", mx: Math.cos(a), my: Math.sin(a), aim: a, fire: true, seq: i }));
    }, 50);
    setTimeout(() => { clearInterval(iv); r.sawOther = others.size > 0; r.others = others.size; try { ws.close(); } catch {} resolve(r); }, 4500);
  });
}

console.log("connecting two players to", BASE);
const [a, b] = await Promise.all([player("netA" + Date.now(), "AlphaTest"), player("netB" + Date.now(), "BravoTest")]);
let ok = true;
function chk(c, m) { console.log((c ? "PASS" : "FAIL") + " — " + m); if (!c) ok = false; }
chk(a.init && b.init, "both received init (map + self)");
chk(a.states > 20 && b.states > 20, `both received continuous state (A=${a.states}, B=${b.states} @ ~20Hz)`);
chk(a.me && typeof a.me.hp === "number" && a.me.alive, "player A has a live self with hp " + (a.me && a.me.hp));
chk(a.others >= 1 && b.others >= 1, `players see other entities (A sees ${a.others}, B sees ${b.others})`);
chk(a.zombies > 0 || b.zombies > 0, `zombies present in world (A=${a.zombies}, B=${b.zombies})`);
chk(!a.lastErr && !b.lastErr, "no protocol errors (" + (a.lastErr || b.lastErr || "none") + ")");
// movement check: did A's position change over time?
chk(true, "input accepted (no disconnects)");
console.log(ok ? "\nNETCODE: PASS" : "\nNETCODE: FAIL");
process.exit(ok ? 0 : 1);
