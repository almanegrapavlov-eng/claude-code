import { normalize } from './MathUtils.js';

// Tracks which movement keys are held and turns them into a direction vector.
// Supports both WASD and the arrow keys.
export class Input {
  constructor() {
    // Set of currently pressed key codes (e.g. "KeyW", "ArrowUp").
    this.keys = new Set();

    // Map logical directions to the key codes that trigger them.
    this._bindings = {
      up: ['KeyW', 'ArrowUp'],
      down: ['KeyS', 'ArrowDown'],
      left: ['KeyA', 'ArrowLeft'],
      right: ['KeyD', 'ArrowRight'],
    };

    // Arrow keys scroll the page by default — stop that while playing.
    this._preventDefaults = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ]);

    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._onKeyUp(e));
  }

  _onKeyDown(e) {
    if (this._preventDefaults.has(e.code)) e.preventDefault();
    this.keys.add(e.code);
  }

  _onKeyUp(e) {
    this.keys.delete(e.code);
  }

  // True if any key bound to the given direction is held.
  _isActive(direction) {
    return this._bindings[direction].some((code) => this.keys.has(code));
  }

  // Current movement direction as a normalized { x, y } vector.
  // Diagonals are normalized so they aren't faster than straight moves.
  getMoveVector() {
    let x = 0;
    let y = 0;
    if (this._isActive('left')) x -= 1;
    if (this._isActive('right')) x += 1;
    if (this._isActive('up')) y -= 1;
    if (this._isActive('down')) y += 1;
    return normalize(x, y);
  }
}
