// Circle-vs-circle collision for all entity pairs.
export class CollisionSystem {

  resolve(player, enemies, projectiles, gems) {
    // 1. Projectile hits enemy — projectile is consumed on first hit.
    for (const proj of projectiles) {
      if (!proj.active) continue;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        if (this._overlaps(proj, enemy)) {
          enemy.takeDamage(proj.damage);
          proj.active = false;
          break; // one projectile, one enemy
        }
      }
    }

    // 2. Enemy touches player — player takes damage (i-frames prevent spam).
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (this._overlaps(enemy, player)) {
        player.takeDamage(enemy.damage);
      }
    }
  }

  // Returns true when two circular entities overlap.
  _overlaps(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const r  = a.collisionRadius + b.collisionRadius;
    return dx * dx + dy * dy < r * r;
  }

}
