// A single projectile in the world.
// Projectiles are created by WeaponSystem and removed when they hit
// something or their lifetime expires.
export class Projectile {

  constructor(x, y, vx, vy, config = {}) {
    this.x  = x;
    this.y  = y;
    this.vx = vx; // world pixels per second
    this.vy = vy;

    this.damage          = config.damage          ?? 10;
    this.collisionRadius = config.collisionRadius ?? 8;
    this.color           = config.color           ?? '#ffd166';
    this.lifetime        = config.lifetime        ?? 3;   // seconds
    this.pierceCount     = config.pierceCount     ?? 0;   // extra enemies before removal

    this.active   = true;
    this._elapsed = 0;
  }

  // Placeholder — will be implemented alongside WeaponSystem.
  update(dt) {
    // TODO: move, check lifetime
  }

  draw(ctx, camera) {
    // TODO: implement in next step
  }

}
