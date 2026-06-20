import {
  SPRITE_SIZE,
  PLAYER_SPEED,
  PLAYER_RADIUS,
  PLAYER_MAX_HP,
} from '../core/Constants.js';

// The player character. For this step it only moves; weapons, leveling, and
// taking damage arrive in later steps (see DESIGN.md).
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = PLAYER_SPEED;
    this.radius = PLAYER_RADIUS; // collision radius, smaller than the sprite
    this.maxHp = PLAYER_MAX_HP;
    this.hp = PLAYER_MAX_HP;
    this.spriteKey = 'player';
  }

  // Move based on the current input direction.
  update(dt, input) {
    const dir = input.getMoveVector();
    this.x += dir.x * this.speed * dt;
    this.y += dir.y * this.speed * dt;
  }

  // Draw the player centered on its screen position.
  render(ctx, camera, sprites) {
    const screenX = camera.worldToScreenX(this.x);
    const screenY = camera.worldToScreenY(this.y);

    // Soft ground shadow for a little sense of depth.
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

    // The 182x182 source sprite, centered on the player's position.
    const sprite = sprites.get(this.spriteKey);
    ctx.drawImage(sprite, screenX - SPRITE_SIZE / 2, screenY - SPRITE_SIZE / 2);
  }
}
