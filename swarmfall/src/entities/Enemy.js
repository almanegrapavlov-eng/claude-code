// Enemy skeleton.
//
// Spawning and "chase the player" movement are added in a later step
// (see DESIGN.md). This file exists now so the project structure is ready;
// the Game does not create enemies yet.
export class Enemy {
  constructor(x, y, type = 'crawler') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 50; // collision radius, smaller than the sprite
    this.hp = 10;
    this.speed = 100; // world units per second
    this.damage = 5;
    this.xpValue = 1;
    this.alive = true;
    this.spriteKey = 'enemy';
  }

  // TODO (later step): steer toward the player each frame.
  update(dt, target) {}

  // TODO (later step): draw the enemy sprite via the camera.
  render(ctx, camera, sprites) {}
}
