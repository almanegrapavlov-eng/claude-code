import { ProceduralSprites } from '../assets/ProceduralSprites.js';

// The player entity. Controlled entirely by keyboard input — no manual shooting.
export class Player {

  constructor() {
    // World position
    this.x = 0;
    this.y = 0;

    // Movement
    this.speed     = 220; // pixels per second at base
    this.facingAngle = 0; // radians; updated whenever the player moves

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

    // Collision circle — intentionally smaller than the 182x182 sprite
    this.collisionRadius = 22;

    // Invincibility frames after being hit (seconds)
    this.iFrames   = 0;

    // Cosmetic flicker when damaged
    this._damagedTimer = 0;
  }

  // Call once per frame.
  update(dt, input) {
    const move = input.getMovementVector();

    this.x += move.x * this.speed * dt;
    this.y += move.y * this.speed * dt;

    // Update facing angle whenever the player is moving
    if (move.x !== 0 || move.y !== 0) {
      this.facingAngle = Math.atan2(move.y, move.x);
    }

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

    // Shadow beneath the sprite
    ProceduralSprites.drawShadow(ctx, 38);

    // Damage flash — briefly tint red
    if (this._damagedTimer > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(this._damagedTimer * 60) * 0.5;
    }

    // I-frame flicker
    if (this.iFrames > 0 && Math.floor(this.iFrames / 0.08) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }

    ProceduralSprites.drawPlayer(ctx, this.facingAngle);

    ctx.globalAlpha = 1;
    ctx.restore();
  }

}
