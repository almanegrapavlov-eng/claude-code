// Central place for tunable numbers. Keeping them here means balancing the
// game later doesn't require digging through gameplay logic.

// Internal render resolution. The canvas always draws at this size; CSS
// scales it to fit the window while preserving the 16:9 aspect ratio, so
// every game coordinate stays in this fixed space.
export const VIEW_WIDTH = 1920;
export const VIEW_HEIGHT = 1080;

// Source size for every character/monster sprite (always square).
export const SPRITE_SIZE = 182;

// Player tuning.
export const PLAYER_SPEED = 420; // world units (pixels) per second
export const PLAYER_RADIUS = 45; // collision radius — smaller than the sprite so it feels fair
export const PLAYER_MAX_HP = 100;

// Background grid cell size, in world units.
export const GRID_SIZE = 128;
