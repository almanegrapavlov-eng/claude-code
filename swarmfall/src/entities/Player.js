import {
  SPRITE_SIZE,
  PLAYER_SPEED,
  PLAYER_RADIUS,
  PLAYER_MAX_HP,
  PLAYER_IFRAMES,
  PLAYER_BAR_WIDTH,
  PLAYER_BAR_HEIGHT,
  HERO_DIRECTIONS,
  HERO_FRAMES,
  HERO_FRAME_TIME,
} from '../core/Constants.js';
import { drawHealthBar } from '../render/HealthBar.js';

// The player character. Moves with input, faces its movement direction, and
// animates a walk cycle from the hero sprite sheet (idle = first frame).
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = PLAYER_SPEED;
    this.radius = PLAYER_RADIUS; // collision radius, smaller than the sprite
    this.maxHp = PLAYER_MAX_HP;
    this.hp = PLAYER_MAX_HP;
    this.spriteKey = 'player'; // fallback sprite if the sheet hasn't loaded

    this.iTimer = 0; // invulnerability remaining, in seconds

    // Animation state.
    this.facing = 'down';
    this.animTime = 0;
    this.frame = 0;
  }

  update(dt, input) {
    const dir = input.getMoveVector();
    this.x += dir.x * this.speed * dt;
    this.y += dir.y * this.speed * dt;

    if (dir.x !== 0 || dir.y !== 0) {
      // Face the dominant axis of movement.
      if (Math.abs(dir.x) >= Math.abs(dir.y)) this.facing = dir.x < 0 ? 'left' : 'right';
      else this.facing = dir.y < 0 ? 'up' : 'down';
      // Advance the walk cycle.
      this.animTime += dt;
      this.frame = Math.floor(this.animTime / HERO_FRAME_TIME) % HERO_FRAMES;
    } else {
      // Idle: hold the first (neutral) frame.
      this.animTime = 0;
      this.frame = 0;
    }

    if (this.iTimer > 0) this.iTimer -= dt;
  }

  // Apply contact damage unless still invulnerable. Returns true if it landed.
  takeDamage(amount) {
    if (this.iTimer > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.iTimer = PLAYER_IFRAMES;
    return true;
  }

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

    // Character. Blink while invulnerable so hits read clearly.
    ctx.save();
    if (this.iTimer > 0 && Math.floor(this.iTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }
    const sheet = sprites.heroSheet;
    if (sheet) {
      const row = Math.max(0, HERO_DIRECTIONS.indexOf(this.facing));
      sheet.draw(ctx, this.frame, row, screenX, screenY, SPRITE_SIZE, SPRITE_SIZE);
    } else {
      // Fallback until the sheet image loads.
      const sprite = sprites.get(this.spriteKey);
      ctx.drawImage(sprite, screenX - SPRITE_SIZE / 2, screenY - SPRITE_SIZE / 2);
    }
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
