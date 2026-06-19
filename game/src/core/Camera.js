// The camera tracks a target (the player) and converts world coordinates
// to screen coordinates for rendering.
//
// The game world is infinite. The screen is always 1920x1080.
// The camera position is the world-space point at the center of the screen.

export class Camera {

  constructor() {
    this.x = 0; // world X at screen center
    this.y = 0; // world Y at screen center
    this.smoothSpeed = 10; // higher = snappier follow
  }

  // Smoothly move the camera toward the target position.
  update(targetX, targetY, dt) {
    const t = Math.min(1, this.smoothSpeed * dt);
    this.x += (targetX - this.x) * t;
    this.y += (targetY - this.y) * t;
  }

  // Snap instantly to a position, no smoothing.
  snapTo(x, y) {
    this.x = x;
    this.y = y;
  }

  // Convert a world position to a pixel position on the 1920x1080 canvas.
  worldToScreen(wx, wy) {
    return {
      x: wx - this.x + 960,  // 960 = 1920 / 2
      y: wy - this.y + 540,  // 540 = 1080 / 2
    };
  }

  // Convert a screen pixel position back into world space.
  screenToWorld(sx, sy) {
    return {
      x: sx + this.x - 960,
      y: sy + this.y - 540,
    };
  }

  // Returns the world-space rectangle currently visible on screen.
  // Useful for culling objects that are off screen.
  getViewBounds(margin = 0) {
    return {
      left:   this.x - 960  - margin,
      right:  this.x + 960  + margin,
      top:    this.y - 540  - margin,
      bottom: this.y + 540  + margin,
    };
  }

}
