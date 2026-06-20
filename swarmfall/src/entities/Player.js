import {
  SPRITE_SIZE,
  PLAYER_SPEED,
  PLAYER_RADIUS,
  PLAYER_MAX_HP,
  PLAYER_IFRAMES,
  PLAYER_BAR_WIDTH,
  PLAYER_BAR_HEIGHT,
} from '../core/Constants.js';
import { drawHealthBar } from '../render/HealthBar.js';

// The player character. It moves with input and takes contact damage from
// enemies, with a brief invulnerability window after each hit.
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = PLAYER_SPEED;
    this.radius = PLAYER_RADIUS; // collision radius, smaller than the sprite
    this.maxHp = PLAYER_MAX_HP;
    this.hp = PLAYER_MAX_HP;
    this.spriteKey = 'player';
    this.iTimer = 0; // invulnerability remaining, in seconds
  }

  // Move based on the current input direction, and tick down i-frames.
  update(dt, input) {
    const dir = input.getMoveVector();
    this.x += dir.x * this.speed * dt;
    this.y += dir.y * this.speed * dt;
    if (this.iTimer > 0) this.iTimer -= dt;
  }

  // Apply contact damage unless still invulnerable. Returns true if it landed,
  // so callers can react (e.g. trigger screen shake).
  takeDamage(amount) {
    if (this.iTimer > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.iTimer = PLAYER_IFRAMES;
    return true;
  }

  // Draw the player centered on its screen position, plus a small health bar.
  render(ctx, camera, sprites) {
    const screenX = camera.worldToScreenX(this.x);
    const screenY = camera.worldToScreenY(this.y);

    // Soft ground shadow for a sense of depth.
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(
      screenX,
      screenY + SPRITE_SIZE * 0.32,
      SPRITE_SIZE * 0.28,
      SPRITE_SIZE * 0.12,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // The 182x182 source sprite. Blink while invulnerable so hits read clearly.
    const sprite = sprites.get(this.spriteKey);
    ctx.save();
    if (this.iTimer > 0 && Math.floor(this.iTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }
    ctx.drawImage(sprite, screenX - SPRITE_SIZE / 2, screenY - SPRITE_SIZE / 2);
    ctx.restore();

    // Health bar floating just above the head.
    drawHealthBar(
      ctx,
      screenX,
      screenY - this.radius - 34,
      PLAYER_BAR_WIDTH,
      PLAYER_BAR_HEIGHT,
      this.hp / this.maxHp
    );
  }
}
