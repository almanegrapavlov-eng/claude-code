import { VIEW_WIDTH, VIEW_HEIGHT, GRID_SIZE } from '../core/Constants.js';

// Handles clearing the frame and drawing the world background.
// Entities draw themselves; the HUD lives in UISystem.
export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  // Fill the whole frame with the base world color.
  clear() {
    const ctx = this.ctx;
    ctx.fillStyle = '#11131a';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  // Draw a grid anchored to world coordinates. As the camera moves, the grid
  // scrolls, which makes the player's movement obvious even though the player
  // stays centered on screen.
  drawBackground(camera) {
    const ctx = this.ctx;

    // Screen position of the nearest world grid line, wrapped to one cell.
    const offsetX =
      (((VIEW_WIDTH / 2 - camera.x) % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
    const offsetY =
      (((VIEW_HEIGHT / 2 - camera.y) % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = offsetX; x <= VIEW_WIDTH; x += GRID_SIZE) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIEW_HEIGHT);
    }
    for (let y = offsetY; y <= VIEW_HEIGHT; y += GRID_SIZE) {
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW_WIDTH, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}
