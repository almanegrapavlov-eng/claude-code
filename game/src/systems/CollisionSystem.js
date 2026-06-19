// Simple circle-vs-circle collision detection.
// All collision shapes are circles defined by entity.collisionRadius.
export class CollisionSystem {

  // Returns true if two circular entities overlap.
  overlaps(a, b) {
    const dx   = b.x - a.x;
    const dy   = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < a.collisionRadius + b.collisionRadius;
  }

  // Returns the squared distance between two entities (cheaper than sqrt).
  distSq(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
  }

  // Returns true if point (px, py) is inside entity e's circle.
  pointInCircle(px, py, e) {
    const dx = px - e.x;
    const dy = py - e.y;
    return dx * dx + dy * dy < e.collisionRadius * e.collisionRadius;
  }

  // Placeholder — full resolution (enemy vs player, projectile vs enemy)
  // will be wired up in the next step.
  resolve(player, enemies, projectiles, gems) {
    // TODO
  }

}
