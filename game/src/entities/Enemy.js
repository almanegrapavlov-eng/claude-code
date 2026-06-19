// Base enemy entity. Specific variants (Shambler, Dasher, Brute…)
// will extend or configure this class in a later step.
export class Enemy {

  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;

    this.hp        = config.hp        ?? 40;
    this.maxHp     = this.hp;
    this.speed     = config.speed     ?? 80;
    this.damage    = config.damage    ?? 8;
    this.xpValue   = config.xpValue   ?? 1;
    this.color     = config.color     ?? '#e63946';

    this.collisionRadius = config.collisionRadius ?? 20;

    // Set to false when the enemy dies so systems can remove it.
    this.active = true;

    // Visual hit flash timer
    this._hitTimer = 0;
  }

  // Placeholder — will be fleshed out in the next step.
  update(dt, player) {
    // TODO: move toward player, apply knockback, etc.
  }

  takeDamage(amount) {
    this.hp -= amount;
    this._hitTimer = 0.1;
    if (this.hp <= 0) {
      this.active = false;
    }
  }

  // Placeholder draw — will be replaced with procedural sprites.
  draw(ctx, camera) {
    // TODO: implement in next step
  }

}
