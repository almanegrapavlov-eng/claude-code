import { Projectile } from '../entities/Projectile.js';

const PROJECTILE_SPEED = 520; // world pixels per second

// Fires one projectile at the nearest enemy every `fireRate` seconds.
// If no enemies exist, the timer still counts down so the shot fires
// immediately when the first enemy appears.
export class WeaponSystem {

  constructor() {
    this.fireRate = 0.6;  // seconds between shots
    this.damage   = 15;
    this._timer   = 0;
  }

  update(dt, player, enemies, projectiles) {
    this._timer -= dt;
    if (this._timer > 0) return;

    const target = this._nearestEnemy(player, enemies);
    if (!target) return; // wait — don't reset the timer so it fires immediately on spawn

    this._timer = this.fireRate;

    const dx   = target.x - player.x;
    const dy   = target.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    projectiles.push(new Projectile(
      player.x, player.y,
      (dx / dist) * PROJECTILE_SPEED,
      (dy / dist) * PROJECTILE_SPEED,
      { damage: this.damage },
    ));
  }

  _nearestEnemy(player, enemies) {
    let nearest  = null;
    let bestDist = Infinity;

    for (const e of enemies) {
      if (!e.active) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const d  = dx * dx + dy * dy; // squared — no sqrt needed for comparison
      if (d < bestDist) {
        bestDist = d;
        nearest  = e;
      }
    }

    return nearest;
  }

}
