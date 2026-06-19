// An XP gem dropped by a killed enemy.
// Sits in the world until the player walks close enough to collect it.
export class XPGem {

  constructor(x, y, value = 1) {
    this.x     = x;
    this.y     = y;
    this.value = value; // XP awarded on collection

    this.collisionRadius = 12;
    this.active = true;

    // Color tier based on value
    if (value >= 20)     this.color = '#ffd166'; // gold
    else if (value >= 5) this.color = '#6a9fff'; // blue
    else                 this.color = '#06d6a0'; // green
  }

  // Placeholder — magnet + collect logic added in the next step.
  update(dt, player) {
    // TODO: magnet pull, collect on overlap
  }

  draw(ctx, camera) {
    // TODO: implement in next step
  }

}
