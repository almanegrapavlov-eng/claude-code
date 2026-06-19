import { ProceduralSprites } from '../assets/ProceduralSprites.js';

// Stat definitions for each enemy type.
const TYPES = {
  slime: {
    hp: 60,
    speed: 70,
    damage: 8,
    collisionRadius: 22,
    xpValue: 2,
  },
  bat: {
    hp: 25,
    speed: 155,
    damage: 5,
    collisionRadius: 16,
    xpValue: 1,
  },
};

export class Enemy {

  constructor(x, y, type = 'slime') {
    const cfg = TYPES[type] ?? TYPES.slime;

    this.x    = x;
    this.y    = y;
    this.type = type;

    this.hp              = cfg.hp;
    this.maxHp           = cfg.hp;
    this.speed           = cfg.speed;
    this.damage          = cfg.damage;
    this.collisionRadius = cfg.collisionRadius;
    this.xpValue         = cfg.xpValue;

    this.active      = true;
    this.justDied    = false; // flipped true for one frame when hp hits 0
    this.facingAngle = 0;
    this._hitTimer   = 0;
  }

  static create(type, x, y) {
    return new Enemy(x, y, type);
  }

  update(dt, player) {
    const dx   = player.x - this.x;
    const dy   = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.facingAngle = Math.atan2(dy, dx);
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }

    if (this._hitTimer > 0) this._hitTimer = Math.max(0, this._hitTimer - dt);
  }

  takeDamage(amount) {
    this.hp -= amount;
    this._hitTimer = 0.12;
    if (this.hp <= 0 && this.active) {
      this.active   = false;
      this.justDied = true;
    }
  }

  draw(ctx, camera, time) {
    const { x: sx, y: sy } = camera.worldToScreen(this.x, this.y);

    ctx.save();
    ctx.translate(sx, sy);

    // White flash on hit
    if (this._hitTimer > 0) {
      ctx.filter = 'brightness(3)';
    }

    if (this.type === 'slime') {
      ProceduralSprites.drawSlime(ctx);
    } else if (this.type === 'bat') {
      ProceduralSprites.drawBat(ctx, this.facingAngle, time);
    }

    ctx.filter = 'none';
    ctx.restore();
  }

}
