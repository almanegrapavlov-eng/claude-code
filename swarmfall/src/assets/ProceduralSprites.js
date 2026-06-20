import { SPRITE_SIZE } from '../core/Constants.js';

// Generates simple, original placeholder sprites on offscreen canvases so the
// game runs with zero image files. Every sprite is SPRITE_SIZE x SPRITE_SIZE.
//
// Sprites are drawn once and cached, then blitted each frame. Later you can
// swap get() to return loaded <img> assets without touching gameplay code.
export class ProceduralSprites {
  constructor() {
    this.cache = new Map();
  }

  // Return a drawable canvas for the given key, generating it on first use.
  get(key) {
    if (!this.cache.has(key)) {
      this.cache.set(key, this._generate(key));
    }
    return this.cache.get(key);
  }

  _createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = SPRITE_SIZE;
    canvas.height = SPRITE_SIZE;
    return canvas;
  }

  _generate(key) {
    switch (key) {
      case 'player':
        return this._drawPlayer();
      default:
        return this._drawPlaceholder();
    }
  }

  // A friendly round "wanderer" — clearly readable as the hero.
  _drawPlayer() {
    const canvas = this._createCanvas();
    const ctx = canvas.getContext('2d');
    const c = SPRITE_SIZE / 2; // center of the sprite
    const bodyRadius = SPRITE_SIZE * 0.34;

    // Body.
    ctx.fillStyle = '#37d1c4';
    ctx.strokeStyle = '#0e3b38';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(c, c, bodyRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Soft highlight, top-left.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(
      c - bodyRadius * 0.3,
      c - bodyRadius * 0.35,
      bodyRadius * 0.45,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Eyes (white with a dark pupil), one on each side.
    const eyeOffsetX = bodyRadius * 0.38;
    const eyeOffsetY = -bodyRadius * 0.05;
    const eyeR = bodyRadius * 0.22;
    for (const sign of [-1, 1]) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(c + sign * eyeOffsetX, c + eyeOffsetY, eyeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0e3b38';
      ctx.beginPath();
      ctx.arc(c + sign * eyeOffsetX, c + eyeOffsetY, eyeR * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas;
  }

  // Fallback used for any key we haven't drawn yet: a bright bordered square.
  _drawPlaceholder() {
    const canvas = this._createCanvas();
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff5577';
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, SPRITE_SIZE - 6, SPRITE_SIZE - 6);
    return canvas;
  }
}
