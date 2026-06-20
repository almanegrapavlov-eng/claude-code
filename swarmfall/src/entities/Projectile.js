import { PROJECTILE_RADIUS, PROJECTILE_LIFETIME } from '../core/Constants.js';

// A bolt fired by the weapon system. It flies in a straight line, damages the
// first enemy it touches, and is then removed (see CollisionSystem). It is also
// removed once it flies off-screen or its lifetime runs out.
export class Projectile {
  constructor(x, y, vx, vy, damage) {
    this.x = x;
    this.y = y;
    this.vx = vx; // velocity, world units per second
    this.vy = vy;
    this.damage = damage;
    this.radius = PROJECTILE_RADIUS;
    this.pierce = 1; // how many enemies it can hit before dying
    this.lifetime = PROJECTILE_LIFETIME;
    this.alive = true;
  }

  // Move and age. Off-screen culling happens in WeaponSystem (it has the camera).
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0) this.alive = false;
  }

  render(ctx, camera) {
    const sx = camera.worldToScreenX(this.x);
    const sy = camera.worldToScreenY(this.y);
    ctx.save();
    ctx.shadowColor = '#ffd966';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
