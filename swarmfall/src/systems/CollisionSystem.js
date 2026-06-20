import { circleOverlap, normalize } from '../core/MathUtils.js';
import {
  KNOCKBACK_STRENGTH,
  SHAKE_MAGNITUDE,
  SHAKE_DURATION,
} from '../core/Constants.js';

// Resolves the frame's collisions using circle overlaps (radii are kept smaller
// than the sprites so the game feels fair):
//   - projectiles damage enemies, knock them back, spawn damage numbers, count kills
//   - enemies deal contact damage to the player and shake the screen on a hit
// Removal of dead entities is handled by their owning systems afterward.
export class CollisionSystem {
  update(dt, game) {
    this._projectilesHitEnemies(game);
    this._enemiesTouchPlayer(game);
  }

  _projectilesHitEnemies(game) {
    const { projectiles } = game.weapon;
    const { enemies } = game.spawner;

    for (const p of projectiles) {
      if (!p.alive) continue;
      for (const e of enemies) {
        if (!e.alive) continue;
        if (!circleOverlap(p.x, p.y, p.radius, e.x, e.y, e.radius)) continue;

        e.takeDamage(p.damage);
        game.effects.spawnDamage(e.x, e.y - e.radius * 0.4, p.damage);

        // Shove the enemy in the projectile's travel direction.
        const k = normalize(p.vx, p.vy);
        e.applyKnockback(k.x, k.y, KNOCKBACK_STRENGTH);

        if (!e.alive) game.kills += 1;

        p.pierce -= 1;
        if (p.pierce <= 0) {
          p.alive = false;
          break; // this projectile is spent; stop checking enemies
        }
      }
    }
  }

  _enemiesTouchPlayer(game) {
    const { player } = game;
    for (const e of game.spawner.enemies) {
      if (!e.alive) continue;
      if (circleOverlap(player.x, player.y, player.radius, e.x, e.y, e.radius)) {
        const hit = player.takeDamage(e.damage); // no-op during i-frames
        if (hit) game.camera.addShake(SHAKE_MAGNITUDE, SHAKE_DURATION);
      }
    }
  }
}
