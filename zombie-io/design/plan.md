# ZOMBIE ZONE .io — design plan

## Profile
- Time: real-time, continuous. Space: continuous 2D top-down. Agency: one survivor.
- Conflict: PvPvE — rival survivors AND zombie hordes. Content: procedural map/loot/spawns.
- Outcome: per-match win/lose (last survivor) + endless rolling matches. Players: online
  multiplayer (massive-ish), bots fill empty slots. Session: minutes. Engagement: execution
  (aim/dodge) primary, calculation (loot/zone positioning) secondary.
- Delivery: desktop (WASD + mouse), mobile (dual virtual sticks), gamepad (Gamepad API).
  Physical key codes. All strings external (strings.js).

## Experience formula
The player feels the thrill of desperate survival because the game constantly forces
split-second choices between fighting, fleeing and scavenging while danger closes in from
zombies, rival survivors and the shrinking safe zone.

## Style formula (approved, byte-identical into every asset prompt)
Flat vector cartoon with soft cel shading and subtle gradients, rounded chunky shapes with
crisp dark outlines, environment in muted desaturated greens and cracked grey asphalt with
deep charcoal shadows, survivor heroes in warm contrasting tones (tan, navy, rust) that pop
off the ground, zombies in sickly grey-green flesh with tattered clothing, weapons and
pickups marked with a bright signal-yellow glow, grim overcast apocalyptic mood with flat
ambient daylight, high contrast between characters and the ground, clean readable
silhouettes, consistent strict top-down perspective across all assets.

## Architecture (Tier 2 — custom realtime server)
- server.js: `GameServer extends DurableObject` (imports only `cloudflare:workers`). One
  shard = one match room. Authoritative fixed-tick simulation (20 Hz). Manages players, bots,
  zombies, bullets, loot, obstacles, shrinking zone, match lifecycle. Per-player view culling
  (only entities within view radius are broadcast) for bandwidth + anti-cheat. Bots fill to a
  target headcount so a lone human always has a full match. Game loop runs only while a human
  is connected; stops when the room empties.
- index.html + game client: canvas renderer. Connects to `<base>/ws/<room>`. Sends input
  ~20 Hz (move vector, aim angle, buttons). Renders from snapshots: client-side prediction
  for own movement, entity interpolation (~100 ms buffer) for everyone else. HUD, minimap,
  leaderboard, kill feed, death/victory screens.

## Verbs & systems
- MOVE (dodge/kite/reposition), SHOOT (kill zombies & rivals), LOOT (auto-pickup weapons,
  ammo via magazines+reload, medkits heal, armor reduces damage).
- Weapons: pistol (start), SMG, shotgun (pellets+spread), rifle (long range, high dmg). One
  cost curve; non-transitive (shotgun close > rifle far > smg mid, roughly).
- Zone: circle shrinks in timed phases; outside = damage/sec scaling up each phase. Forces
  convergence => comeback pressure so a fresh player can still win.
- Zombies: wander, aggro nearest survivor in radius, chase, bite on contact. Cap for perf.
- Bots: seek zone center if outside, else scavenge/engage nearest enemy in range with LoS.

## Information map
Limited view radius (fog beyond). Others visible only when near. Zone + alive count + minimap
always shown. Server masks distant entities in viewFor-equivalent culling.

## Loops & balance
Positive: kills/loot snowball power. Negative: zone collapse + final-circle chaos give
comebacks; good play still wins. Balance numbers in server data tables, tuned one at a time.

## Entry
Title screen: name + Play. Drop into the current match within seconds. Controls learnable
on screen (hints + how-to). Returning view always shows current goal (survive / zone timer).
