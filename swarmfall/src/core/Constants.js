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
export const HIT_FLASH_TIME = 0.1; // seconds an enemy flashes/pops after being hit
export const KNOCKBACK_STRENGTH = 700; // initial knockback speed when a projectile lands
export const KNOCKBACK_DAMP = 11; // higher = knockback fades faster
export const SHAKE_MAGNITUDE = 9; // pixels of screen shake when the player is hit
export const SHAKE_DURATION = 0.18; // seconds
export const DAMAGE_NUMBER_LIFETIME = 0.7; // seconds a floating number lives
export const MAX_DAMAGE_NUMBERS = 240; // safety cap for performance

// ---- Health bars ----
export const PLAYER_BAR_WIDTH = 76;
export const PLAYER_BAR_HEIGHT = 9;
export const ENEMY_BAR_WIDTH = 64;
export const ENEMY_BAR_HEIGHT = 7;
export const UI_HP_BAR_WIDTH = 480;
export const UI_HP_BAR_HEIGHT = 26;

// ---- Enemy types ----
// `radius` is the collision circle, kept well under the 182px sprite so the
// game feels fair. `weight` is the relative spawn chance.
export const ENEMY_TYPES = {
  // Slow, medium health — the bulk of the swarm.
  slime: { spriteKey: 'slime', maxHp: 24, speed: 90, radius: 52, damage: 8, weight: 0.6 },
  // Faster, fragile — punishes standing still.
  bat: { spriteKey: 'bat', maxHp: 12, speed: 205, radius: 38, damage: 5, weight: 0.4 },
};

// ---- Hero sprite-sheet animation ----
// The hero is drawn from a sprite sheet laid out as rows = facing directions
// (in this order) x columns = walk-cycle frames. Drop your own sheet at
// HERO_SHEET_SRC with the same grid to replace the built-in character.
export const HERO_DIRECTIONS = ['down', 'left', 'right', 'up'];
export const HERO_FRAMES = 4; // columns in the sheet
export const HERO_FRAME_TIME = 0.12; // seconds per frame while walking
export const HERO_SHEET_SRC = './assets/sprites/hero.png';
