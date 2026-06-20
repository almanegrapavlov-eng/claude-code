import { Projectile } from '../entities/Projectile.js';
import {
  VIEW_WIDTH,
  VIEW_HEIGHT,
  WEAPON_FIRE_INTERVAL,
  WEAPON_DAMAGE,
  PROJECTILE_SPEED,
  PROJECTILE_CULL_MARGIN,
} from '../core/Constants.js';
import { normalize, distanceSq } from '../core/MathUtils.js';

// The player's single automatic weapon: on a fixed cooldown it fires one bolt
// at the nearest enemy. It owns the live projectiles.
export class WeaponSystem {
  constructor() {
    this.projectiles = [];
    this.cooldown = 0; // seconds until the next shot is allowed
  }

  update(dt, game) {
    this.cooldown -= dt;

    // Only fire when an enemy exists; otherwise the weapon simply waits (the
    // cooldown can go negative, so it fires immediately once one appears).
    const enemies = game.spawner.enemies;
    if (this.cooldown <= 0 && enemies.length > 0) {
      const target = this._nearestEnemy(game.player, enemies);
      if (target) {
        this._fire(game.player, target);
        this.cooldown = WEAPON_FIRE_INTERVAL;
      }
    }

    for (const p of this.projectiles) p.update(dt);
  }

  // Drop projectiles that died (hit an enemy / expired) or flew off-screen.
  removeDead(camera) {
    const halfW = VIEW_WIDTH / 2 + PROJECTILE_CULL_MARGIN;
    const halfH = VIEW_HEIGHT / 2 + PROJECTILE_CULL_MARGIN;
    this.projectiles = this.projectiles.filter(
      (p) =>
        p.alive &&
        Math.abs(p.x - camera.x) <= halfW &&
        Math.abs(p.y - camera.y) <= halfH
    );
  }

  _fire(player, target) {
    const dir = normalize(target.x - player.x, target.y - player.y);
    const projectile = new Projectile(
      player.x,
      player.y,
      dir.x * PROJECTILE_SPEED,
      dir.y * PROJECTILE_SPEED,
      WEAPON_DAMAGE
    );
    this.projectiles.push(projectile);
  }

  _nearestEnemy(player, enemies) {
    let nearest = null;
    let best = Infinity;
    for (const e of enemies) {
      const d = distanceSq(player.x, player.y, e.x, e.y);
      if (d < best) {
        best = d;
        nearest = e;
      }
    }
    return nearest;
  }
}
