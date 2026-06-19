// A single auto-attack projectile.
// Created by WeaponSystem, removed when it hits an enemy or leaves the screen.
export class Projectile {

  constructor(x, y, vx, vy, config = {}) {
    this.x  = x;
    this.y  = y;
    this.vx = vx;
    this.vy = vy;

    this.damage          = config.damage          ?? 15;
    this.collisionRadius = config.collisionRadius ?? 7;
    this.color           = config.color           ?? '#ffd166';
    this.glowColor       = config.glowColor       ?? 'rgba(255, 200, 50, 0.6)';

    this.active = true;
  }

  update(dt, camera) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Deactivate if it travels beyond the visible area with a margin.
    const b = camera.getViewBounds(300);
    if (this.x < b.left || this.x > b.right || this.y < b.top || this.y > b.bottom) {
      this.active = false;
    }
  }

  draw(ctx, camera) {
    const { x: sx, y: sy } = camera.worldToScreen(this.x, this.y);
    const r = this.collisionRadius;

    ctx.save();

    // Outer glow
    ctx.beginPath();
    ctx.arc(sx, sy, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = this.glowColor;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Bright center
    ctx.beginPath();
    ctx.arc(sx - r * 0.3, sy - r * 0.3, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();

    ctx.restore();
  }

}
