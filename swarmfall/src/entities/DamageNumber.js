import { DAMAGE_NUMBER_LIFETIME } from '../core/Constants.js';

// A small number that pops up where an enemy was hit, floats upward, and fades.
// Purely cosmetic — it has no effect on gameplay.
export class DamageNumber {
  constructor(x, y, value) {
    this.x = x + (Math.random() * 20 - 10); // slight horizontal scatter
    this.y = y;
    this.value = Math.round(value);
    this.life = DAMAGE_NUMBER_LIFETIME;
    this.vy = -90; // float up, world units per second
    this.alive = true;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.vy *= Math.exp(-2.5 * dt); // ease the upward drift to a stop
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  render(ctx, camera) {
    const sx = camera.worldToScreenX(this.x);
    const sy = camera.worldToScreenY(this.y);
    const t = this.life / DAMAGE_NUMBER_LIFETIME; // 1 -> 0

    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 1.6);
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillStyle = '#fff4c2';
    const text = String(this.value);
    ctx.strokeText(text, sx, sy); // dark outline for readability
    ctx.fillText(text, sx, sy);
    ctx.restore();
  }
}
