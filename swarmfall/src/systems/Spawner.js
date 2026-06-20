import { Enemy } from '../entities/Enemy.js';
import {
  VIEW_WIDTH,
  VIEW_HEIGHT,
  SPAWN_INTERVAL,
  SPAWN_MARGIN,
  MAX_ENEMIES,
  ENEMY_TYPES,
} from '../core/Constants.js';
import { randomRange } from '../core/MathUtils.js';

// Owns the live enemies and spawns new ones on a timer, just outside the
// visible screen so they walk in from the edges.
export class Spawner {
  constructor() {
    this.enemies = [];
    this.timer = 0; // spawn the first enemy almost immediately
  }

  update(dt, game) {
    this.timer -= dt;
    if (this.timer <= 0 && this.enemies.length < MAX_ENEMIES) {
      this.enemies.push(this._spawnOne(game.camera));
      this.timer = SPAWN_INTERVAL;
    }
    for (const e of this.enemies) e.update(dt, game.player);
  }

  removeDead() {
    this.enemies = this.enemies.filter((e) => e.alive);
  }

  // Pick a random point just outside one of the four screen edges (in world
  // coordinates). Because it's always off-screen, an enemy never spawns on the
  // player, who sits at the center.
  _spawnOne(camera) {
    const halfW = VIEW_WIDTH / 2 + SPAWN_MARGIN;
    const halfH = VIEW_HEIGHT / 2 + SPAWN_MARGIN;
    let x;
    let y;
    switch (Math.floor(Math.random() * 4)) {
      case 0: // top
        x = camera.x + randomRange(-halfW, halfW);
        y = camera.y - halfH;
        break;
      case 1: // bottom
        x = camera.x + randomRange(-halfW, halfW);
        y = camera.y + halfH;
        break;
      case 2: // left
        x = camera.x - halfW;
        y = camera.y + randomRange(-halfH, halfH);
        break;
      default: // right
        x = camera.x + halfW;
        y = camera.y + randomRange(-halfH, halfH);
        break;
    }
    return new Enemy(x, y, this._pickType());
  }

  // Weighted random enemy type, using the `weight` field in ENEMY_TYPES.
  _pickType() {
    const entries = Object.entries(ENEMY_TYPES);
    const total = entries.reduce((sum, [, cfg]) => sum + cfg.weight, 0);
    let roll = Math.random() * total;
    for (const [key, cfg] of entries) {
      roll -= cfg.weight;
      if (roll <= 0) return key;
    }
    return entries[0][0];
  }
}
