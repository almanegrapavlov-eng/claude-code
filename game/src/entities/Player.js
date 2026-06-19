import { ProceduralSprites } from '../assets/ProceduralSprites.js';

// Loads one image and makes it available synchronously once ready.
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// The player entity. Controlled entirely by keyboard input — no manual shooting.
export class Player {

  constructor() {
    // World position
    this.x = 0;
    this.y = 0;

    // Movement
    this.speed       = 220; // top speed in pixels per second
    this.accel       = 18;  // how quickly velocity reaches top speed (multiplier)
    this.friction    = 14;  // how quickly velocity bleeds off when no key is held
    this.vx          = 0;   // current velocity X
    this.vy          = 0;   // current velocity Y
    this.facingAngle = 0;   // radians; updated whenever the player moves

    // Vitals
    this.hp        = 100;
    this.maxHp     = 100;
    this.armor     = 0;   // damage reduction (flat)
    this.regenRate = 0;   // HP per second

    // Progression
    this.level     = 1;
    this.xp        = 0;
    this.xpToNext  = 10;  // scales each level

    // Pickup range for XP gems (world pixels)
    this.magnetRadius = 120;

    // Collision circle — intentionally smaller than the sprite visual
    this.collisionRadius = 22;

    // Sprite sheet — single frame for now, directional sheet added later.
    // The image is 69x44 with the character occupying a 20x29 area inside it.
    // We draw the full canvas at SPRITE_SCALE so the character looks crisp.
    this._sprite      = loadImage('./assets/warrior.png');
    this._spriteScale = 3.5; // 69*3.5=241px wide in game units — stays proportional
    this._facingLeft  = false; // flipped when moving left

    // Invincibility frames after being hit (seconds)
    this.iFrames   = 0;

    // Cosmetic flicker when damaged
    this._damagedTimer = 0;
  }

  // Call once per frame.
  update(dt, input) {
    const move = input.getMovementVector();

    // Accelerate toward the target velocity, or friction-brake to zero.
    if (move.x !== 0 || move.y !== 0) {
      this.vx += (move.x * this.speed - this.vx) * Math.min(1, this.accel * dt);
      this.vy += (move.y * this.speed - this.vy) * Math.min(1, this.accel * dt);
      this.facingAngle = Math.atan2(move.y, move.x);
      if (move.x < 0) this._facingLeft = true;
      if (move.x > 0) this._facingLeft = false;
    } else {
      const brake = Math.min(1, this.friction * dt);
      this.vx -= this.vx * brake;
      this.vy -= this.vy * brake;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Tick HP regen
    if (this.regenRate > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
    }

    // Tick i-frames
    if (this.iFrames > 0) this.iFrames = Math.max(0, this.iFrames - dt);

    // Tick damage flash
    if (this._damagedTimer > 0) this._damagedTimer = Math.max(0, this._damagedTimer - dt);
  }

  // Returns true if the player was actually damaged.
  takeDamage(amount) {
    if (this.iFrames > 0) return false;

    const effective = Math.max(1, amount - this.armor);
    this.hp -= effective;
    this.iFrames = 0.6;
    this._damagedTimer = 0.15;
    return true;
  }

  isAlive() {
    return this.hp > 0;
  }

  // Gain XP; returns true if a level-up occurred.
  gainXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.35 + 5);
      return true;
    }
    return false;
  }

  draw(ctx, camera) {
    const { x: sx, y: sy } = camera.worldToScreen(this.x, this.y);

    ctx.save();
    ctx.translate(sx, sy);

    // Shadow
    ProceduralSprites.drawShadow(ctx, 30);

    // I-frame flicker
    if (this.iFrames > 0 && Math.floor(this.iFrames / 0.08) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }

    // Damage flash
    if (this._damagedTimer > 0) {
      ctx.globalAlpha = 0.5;
    }

    if (this._sprite.complete && this._sprite.naturalWidth > 0) {
      this._drawSprite(ctx);
    } else {
      // Fallback while image loads
      ProceduralSprites.drawPlayer(ctx, this.facingAngle);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _drawSprite(ctx) {
    const sw = this._sprite.naturalWidth;
    const sh = this._sprite.naturalHeight;
    const dw = sw * this._spriteScale;
    const dh = sh * this._spriteScale;

    ctx.save();

    // Flip horizontally when moving left
    if (this._facingLeft) ctx.scale(-1, 1);

    // Pixel art — disable smoothing so pixels stay sharp
    ctx.imageSmoothingEnabled = false;

    // Draw centered, with feet near the entity's world position
    ctx.drawImage(this._sprite, -dw / 2, -dh * 0.75, dw, dh);

    ctx.restore();
  }

}
