import { VIEW_WIDTH, VIEW_HEIGHT } from './Constants.js';

// The camera centers on a target (the player) and converts world coordinates
// into screen coordinates for rendering. It also produces a small shake offset
// that the renderer applies to the whole world (but not the UI).
export class Camera {
  constructor() {
    this.x = 0; // world position the camera is centered on
    this.y = 0;

    // Shake offset applied by the renderer this frame.
    this.shakeX = 0;
    this.shakeY = 0;
    this._shakeTime = 0;
    this._shakeDuration = 0;
    this._shakeMag = 0;
  }

  // Snap the camera to a target so that target sits at screen center.
  follow(target) {
    this.x = target.x;
    this.y = target.y;
  }

  // Kick off a screen shake of the given magnitude (pixels) and duration (s).
  addShake(magnitude, duration) {
    this._shakeMag = magnitude;
    this._shakeDuration = duration;
    this._shakeTime = duration;
  }

  resetShake() {
    this._shakeTime = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  // Advance the shake; the offset shrinks to zero over the duration.
  update(dt) {
    if (this._shakeTime > 0) {
      this._shakeTime -= dt;
      const t = Math.max(0, this._shakeTime / this._shakeDuration);
      const mag = this._shakeMag * t;
      this.shakeX = (Math.random() * 2 - 1) * mag;
      this.shakeY = (Math.random() * 2 - 1) * mag;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  worldToScreenX(worldX) {
    return worldX - this.x + VIEW_WIDTH / 2;
  }

  worldToScreenY(worldY) {
    return worldY - this.y + VIEW_HEIGHT / 2;
  }
}
