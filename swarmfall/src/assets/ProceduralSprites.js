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
      case 'slime':
        return this._drawSlime();
      case 'bat':
        return this._drawBat();
      default:
        return this._drawPlaceholder();
    }
  }

  // Shared helper: two eyes with pupils. Keeps the characters consistent and
  // avoids repeating the same drawing code in every sprite.
  _eyes(ctx, cx, cy, spread, eyeR, pupil = '#0e3b38', sclera = '#ffffff') {
    for (const sign of [-1, 1]) {
      ctx.fillStyle = sclera;
      ctx.beginPath();
      ctx.arc(cx + sign * spread, cy, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pupil;
      ctx.beginPath();
      ctx.arc(cx + sign * spread, cy, eyeR * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // The hero: a friendly teal "wanderer".
  _drawPlayer() {
    const canvas = this._createCanvas();
    const ctx = canvas.getContext('2d');
    const c = SPRITE_SIZE / 2;
    const r = SPRITE_SIZE * 0.34;

    ctx.fillStyle = '#37d1c4';
    ctx.strokeStyle = '#0e3b38';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Soft highlight, top-left.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(c - r * 0.3, c - r * 0.35, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    this._eyes(ctx, c, c - r * 0.05, r * 0.38, r * 0.22, '#0e3b38');
    return canvas;
  }

  // Slime: a squat green blob. Slow and sturdy.
  _drawSlime() {
    const canvas = this._createCanvas();
    const ctx = canvas.getContext('2d');
    const c = SPRITE_SIZE / 2;
    const w = SPRITE_SIZE * 0.4;
    const h = SPRITE_SIZE * 0.32;

    ctx.fillStyle = '#7ec850';
    ctx.strokeStyle = '#2f5b22';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(c, c + h * 0.25, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glossy highlight.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(c - w * 0.3, c - h * 0.05, w * 0.32, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    this._eyes(ctx, c, c + h * 0.1, w * 0.3, w * 0.16, '#2f5b22');
    return canvas;
  }

  // Bat: a purple flyer with wings. Fast and fragile.
  _drawBat() {
    const canvas = this._createCanvas();
    const ctx = canvas.getContext('2d');
    const c = SPRITE_SIZE / 2;
    const r = SPRITE_SIZE * 0.2;

    ctx.strokeStyle = '#33184f';
    ctx.lineWidth = 6;

    // Wings (mirrored), drawn behind the body.
    ctx.fillStyle = '#7b46b0';
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(c + sign * r * 0.5, c - r * 0.2);
      ctx.lineTo(c + sign * r * 2.1, c - r * 1.0);
      ctx.lineTo(c + sign * r * 1.7, c);
      ctx.lineTo(c + sign * r * 2.1, c + r * 1.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Body.
    ctx.fillStyle = '#a06cd5';
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Menacing yellow eyes.
    this._eyes(ctx, c, c - r * 0.1, r * 0.45, r * 0.28, '#33184f', '#ffe066');
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
