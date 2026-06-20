import { SPRITE_SIZE, ENEMY_TYPES, HIT_FLASH_TIME } from '../core/Constants.js';
import { normalize } from '../core/MathUtils.js';

// A monster that walks straight toward the player. All per-type stats come from
// ENEMY_TYPES so adding a new enemy is just adding a config entry + a sprite.
export class Enemy {
  constructor(x, y, typeKey = 'slime') {
    const cfg = ENEMY_TYPES[typeKey] || ENEMY_TYPES.slime;
    this.type = typeKey;
    this.x = x;
    this.y = y;
    this.maxHp = cfg.maxHp;
    this.hp = cfg.maxHp;
    this.speed = cfg.speed;
    this.radius = cfg.radius; // collision radius, smaller than the sprite
    this.damage = cfg.damage;
    this.spriteKey = cfg.spriteKey;
    this.alive = true;
    this.hitFlash = 0; // brief "pop" timer after being hit
  }

  // Steer straight toward the target (the player).
  update(dt, target) {
    const dir = normalize(target.x - this.x, target.y - this.y);
    this.x += dir.x * this.speed * dt;
    this.y += dir.y * this.speed * dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = HIT_FLASH_TIME;
    if (this.hp <= 0) this.alive = false;
  }

  render(ctx, camera, sprites) {
    const screenX = camera.worldToScreenX(this.x);
    const screenY = camera.worldToScreenY(this.y);

    // Ground shadow.
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(
      screenX,
      screenY + SPRITE_SIZE * 0.3,
      SPRITE_SIZE * 0.26,
      SPRITE_SIZE * 0.11,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // Briefly scale up ("pop") right after a hit, for satisfying feedback.
    const t = this.hitFlash > 0 ? this.hitFlash / HIT_FLASH_TIME : 0;
    const size = SPRITE_SIZE * (1 + 0.12 * t);
    const sprite = sprites.get(this.spriteKey);
    ctx.drawImage(sprite, screenX - size / 2, screenY - size / 2, size, size);
  }
}
