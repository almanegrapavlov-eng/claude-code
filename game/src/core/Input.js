// Tracks which keyboard keys are currently held down.
// Call getMovementVector() each frame to get a normalized direction.
export class Input {

  constructor() {
    this._held = new Set();

    window.addEventListener('keydown', e => {
      this._held.add(e.code);
      // Prevent arrow keys from scrolling the page
      if (e.code.startsWith('Arrow')) e.preventDefault();
    });

    window.addEventListener('keyup', e => {
      this._held.delete(e.code);
    });

    // Clear all held keys when the window loses focus
    window.addEventListener('blur', () => this._held.clear());
  }

  isDown(code) {
    return this._held.has(code);
  }

  // Returns {x, y} where each axis is -1, 0, or 1.
  // Diagonal movement is normalized so the player moves at a constant speed.
  getMovementVector() {
    let x = 0;
    let y = 0;

    if (this.isDown('KeyW') || this.isDown('ArrowUp'))    y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown'))  y += 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft'))  x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;

    // Normalize diagonal so speed is the same in all directions
    if (x !== 0 && y !== 0) {
      x *= 0.7071; // 1 / sqrt(2)
      y *= 0.7071;
    }

    return { x, y };
  }

}
