// XP gem skeleton.
//
// Dropped by enemies on death and collected by the player within a pickup
// radius (see DESIGN.md). No gems exist in the world yet.
export class XPGem {
  constructor(x, y, value = 1) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 18; // generous pickup hit-box so collecting feels good
    this.collected = false;
  }

  // TODO (later step): drift toward the player when within pickup range.
  update(dt, player) {}

  // TODO (later step): draw the gem.
  render(ctx, camera, sprites) {}
}
