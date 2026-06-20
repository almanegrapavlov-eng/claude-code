// Projectile skeleton.
//
// Created by the weapon system once automatic weapons are added (see
// DESIGN.md). No projectiles are fired yet.
export class Projectile {
  constructor(x, y, vx, vy, damage = 1) {
    this.x = x;
    this.y = y;
    this.vx = vx; // velocity, world units per second
    this.vy = vy;
    this.damage = damage;
    this.radius = 12;
    this.pierce = 1; // how many enemies it can pass through
    this.lifetime = 2; // seconds before it disappears
    this.alive = true;
  }

  // TODO (later step): move, age, and expire.
  update(dt) {}

  // TODO (later step): draw the projectile.
  render(ctx, camera, sprites) {}
}
