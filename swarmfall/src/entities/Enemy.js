import {
  SPRITE_SIZE,
  ENEMY_TYPES,
  HIT_FLASH_TIME,
  KNOCKBACK_DAMP,
  ENEMY_BAR_WIDTH,
  ENEMY_BAR_HEIGHT,
} from '../core/Constants.js';
import { normalize } from '../core/MathUtils.js';
import { drawHealthBar } from '../render/HealthBar.js';

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
    this.hitFlash = 0; // brief flash/pop timer after being hit
    this.knockX = 0; // current knockback velocity (decays each frame)
    this.knockY = 0;
  }

  // Steer toward the target (the player), then apply any decaying knockback.
  update(dt, target) {
    const dir = normalize(target.x - this.x, target.y - this.y);
    this.x += dir.x * this.speed * dt;
    this.y += dir.y * this.speed * dt;

    this.x += this.knockX * dt;
    this.y += this.knockY * dt;
    const damp = Math.exp(-KNOCKBACK_DAMP * dt);
    this.knockX *= damp;
    this.knockY *= damp;

    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = HIT_FLASH_TIME;
    if (this.hp <= 0) this.alive = false;
  }

  // Add an outward shove (called when a projectile lands).
  applyKnockback(dirX, dirY, strength) {
    this.knockX += dirX * strength;
    this.knockY += dirY * strength;
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

    // Briefly scale up ("pop") right after a hit.
    const t = this.hitFlash > 0 ? this.hitFlash / HIT_FLASH_TIME : 0;
    const size = SPRITE_SIZE * (1 + 0.12 * t);
    const sprite = sprites.get(this.spriteKey);
    ctx.drawImage(sprite, screenX - size / 2, screenY - size / 2, size, size);

    // White flash overlay on top of the sprite while recently hit.
    if (this.hitFlash > 0) {
      const flash = sprites.getFlash(this.spriteKey);
      ctx.save();
      ctx.globalAlpha = 0.85 * t;
      ctx.drawImage(flash, screenX - size / 2, screenY - size / 2, size, size);
      ctx.restore();
    }

    // Health bar — only shown once the enemy has taken damage, to keep the
    // screen clean (and cheaper) when the swarm is at full health.
    if (this.hp < this.maxHp) {
      drawHealthBar(
        ctx,
        screenX,
        screenY - this.radius - 22,
        ENEMY_BAR_WIDTH,
        ENEMY_BAR_HEIGHT,
        this.hp / this.maxHp
      );
    }
  }
}
