import { VIEW_WIDTH, VIEW_HEIGHT } from './Constants.js';

// The camera centers on a target (the player) and converts world
// coordinates into screen coordinates for rendering. Because it stays
// centered on the player, the player appears fixed while the world scrolls.
export class Camera {
  constructor() {
    this.x = 0; // world position the camera is centered on
    this.y = 0;
  }

  // Snap the camera to a target so that target sits at screen center.
  follow(target) {
    this.x = target.x;
    this.y = target.y;
  }

  worldToScreenX(worldX) {
    return worldX - this.x + VIEW_WIDTH / 2;
  }

  worldToScreenY(worldY) {
    return worldY - this.y + VIEW_HEIGHT / 2;
  }
}
