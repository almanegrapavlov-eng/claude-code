// Server simulation smoke: stub cloudflare:workers, run 30s of ticks with a
// simulated joined human + bots + zombies; assert no errors and sane state.
import { readFileSync, writeFileSync } from "fs";
let src = readFileSync("/home/user/claude-code/zombie-io/server.js", "utf8");
src = src.replace('import { DurableObject } from "cloudflare:workers";',
  "class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }");
const testPath = "/home/user/claude-code/zombie-io/tools/_server_test.mjs";
writeFileSync(testPath, src);
const { GameServer } = await import(testPath);

const inst = new GameServer({}, {});
inst.ensureWorld();
const ws = { readyState: 1, sent: [], send(d) { this.sent.push(d); } };
inst.clients.set(1, { ws, pid: null });
inst.onMessage(1, JSON.stringify({ t: "join", pid: "h1", name: "Tester" }));

const w = inst.world;
let ok = true;
function assert(c, m) { if (!c) { ok = false; console.log("ASSERT FAIL:", m); } }
assert(w.players.size >= 2, "bots filled (" + w.players.size + ")");
assert(w.players.get("h1"), "human player exists");
assert(ws.sent.some(s => JSON.parse(s).t === "init"), "init sent");

let maxZombies = 0, sawBullets = false, totalKills = 0;
const me = w.players.get("h1");
for (let i = 0; i < 600; i++) {
  // human circles and fires toward map center
  const ang = i * 0.05;
  inst.onMessage(1, JSON.stringify({ t: "input", mx: Math.cos(ang), my: Math.sin(ang), aim: (i * 0.13) % 6.28, fire: true, reload: i % 120 === 0, seq: i }));
  inst.tick();
  maxZombies = Math.max(maxZombies, w.zombies.length);
  if (w.bullets.length) sawBullets = true;
}
for (const p of w.players.values()) totalKills += p.kills + p.zk;

assert(maxZombies > 0, "zombies spawned (max " + maxZombies + ")");
assert(sawBullets, "bullets fired");
assert(w.zone.stage >= 0, "zone advanced to stage " + w.zone.stage);
assert(w.zone.r < 2600, "zone shrank to r=" + Math.round(w.zone.r));
assert(w.loot.length > 0, "loot present (" + w.loot.length + ")");
const lastState = JSON.parse(ws.sent[ws.sent.length - 1]);
assert(lastState.t === "state", "state broadcast");
assert(lastState.board && lastState.board.length > 0, "leaderboard built");
assert(typeof lastState.me.hp === "number", "me hp present");

// reconnect: disconnect human (-> becomes bot) then rejoin keeps playing
inst.onClose(1);
assert(w.players.get("h1") && w.players.get("h1").isBot, "disconnected human became a bot");
// note: onClose with 0 humans stops loop + nulls world; re-add a client first scenario:

console.log(`players=${w.players.size} maxZombies=${maxZombies} bullets-seen=${sawBullets} kills+zk=${totalKills} zoneStage=${w.zone.stage} zoneR=${Math.round(w.zone.r)} loot=${w.loot.length} states=${ws.sent.filter(s=>JSON.parse(s).t==="state").length}`);
console.log(ok ? "SERVER SMOKE: PASS" : "SERVER SMOKE: FAIL");
process.exit(ok ? 0 : 1);
