// Central place for tunable numbers. Keeping them here means balancing the
// game later doesn't require digging through gameplay logic.

// ---- Display ----
// Internal render resolution. The canvas always draws at this size; CSS scales
// it to fit the window while preserving 16:9, so every game coordinate stays in
// this fixed space.
export const VIEW_WIDTH = 1920;
export const VIEW_HEIGHT = 1080;

// Source size for every character/monster sprite (always square).
export const SPRITE_SIZE = 182;

// ---- World ----
export const GRID_SIZE = 128; // background grid cell size, in world units

// ---- Player ----
export const PLAYER_SPEED = 420; // world units (pixels) per second
export const PLAYER_RADIUS = 45; // collision radius — smaller than the sprite so it feels fair
export const PLAYER_MAX_HP = 100;
export const PLAYER_IFRAMES = 0.6; // seconds of invulnerability after taking a hit

// ---- Auto weapon ----
export const WEAPON_FIRE_INTERVAL = 0.6; // seconds between shots
export const WEAPON_DAMAGE = 8;
export const PROJECTILE_SPEED = 1100; // world units per second
export const PROJECTILE_RADIUS = 14; // collision + draw radius
export const PROJECTILE_LIFETIME = 1.6; // safety cap (projectiles are also culled off-screen)
export const PROJECTILE_CULL_MARGIN = 80; // remove once this far past the view edge

// ---- Spawning ----
export const SPAWN_INTERVAL = 0.7; // seconds between enemy spawns
export const SPAWN_MARGIN = 120; // spawn this far outside the visible edge
export const MAX_ENEMIES = 200; // safety cap to keep performance steady

// ---- Combat feedback ----
export const HIT_FLASH_TIME = 0.1; // seconds an enemy "pops" after being hit

// ---- Enemy types ----
// `radius` is the collision circle, kept well under the 182px sprite so the
// game feels fair. `weight` is the relative spawn chance.
export const ENEMY_TYPES = {
  // Slow, medium health — the bulk of the swarm.
  slime: { spriteKey: 'slime', maxHp: 24, speed: 90, radius: 52, damage: 8, weight: 0.6 },
  // Faster, fragile — punishes standing still.
  bat: { spriteKey: 'bat', maxHp: 12, speed: 205, radius: 38, damage: 5, weight: 0.4 },
};
