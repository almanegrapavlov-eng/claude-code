# Numeric thresholds (frozen before code; tuned one change at a time)

## Performance budget (weakest platform = mid mobile)
- Render: target 60 fps, hard floor 30 fps on a 390x844 phone viewport.
- devicePixelRatio capped at 1.5.
- Visible entities cap (post server cull): <= 220 (zombies+players+bullets+loot+obstacles).
- Same-type swarms (zombies, bullets) drawn via cached sprite/path, zero per-frame allocations
  in the render/predict hot path; object pools for bullets and particles.

## Server simulation
- Tick rate: 20 Hz (50 ms fixed step), seeded RNG per match.
- Snapshot broadcast: 20 Hz (every tick), per-player culled to view radius.
- Map: 3600 x 3600 world units. View radius for culling: 1300 units (+ margin).
- Entity caps: max 14 survivors (humans + bots) per match; target fill 10. Max 90 zombies.
  Max ~400 live bullets. Hard total entity cap 700 (drop oldest bullets first).
- Collision via uniform spatial grid (cell 200 u) — no O(n^2) full scans.

## Netcode
- Client input send rate: 20 Hz (throttled), with latest-wins coalescing.
- Interpolation buffer: render remote entities ~100 ms in the past (2 snapshots).
- Own player: client-side prediction; reconcile/lerp to server pos when error > 40 u.

## Combat / agency metrics (frozen before content)
- Player radius 26 u, move speed 230 u/s. Zombie radius 24 u, speed 95-150 u/s.
- Player HP 100, armor 0-100 (absorbs 50% of damage while > 0).
- Weapons (dmg / fireRate ms / bulletSpeed u/s / mag / reload ms / spread rad / pellets / range u):
  - pistol  18 / 280 / 900 / 12 / 1100 / 0.04 / 1 / 900
  - smg     12 / 90  / 1000 / 30 / 1500 / 0.10 / 1 / 800
  - shotgun 11 / 750 / 850 / 6  / 2000 / 0.20 / 7 / 520
  - rifle   42 / 600 / 1500 / 8 / 2100 / 0.02 / 1 / 1500
- Medkit heals 50 HP over 0 ms (instant on pickup-use). Armor pickup sets armor to 100.
- Zombie bite: 14 dmg, 700 ms cooldown.

## Zone schedule (phases: wait then shrink)
- Start radius = map/2. 6 phases. Each: hold then shrink to a fraction of current.
- Out-of-zone damage per second ramps: 1, 2, 4, 7, 12, 20 by phase.

## Input tolerance
- Aim deadzone (gamepad) 0.22. Touch stick deadzone 12 px. Fire auto-repeats while held.
- Pickup is automatic on overlap (no precise press needed).
