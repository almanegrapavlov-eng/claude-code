// Wraps a grid sprite sheet and draws individual frames from it. The sheet is
// laid out as `rows` directions x `cols` animation frames.
export class SpriteSheet {
  constructor(image, cols, rows) {
    this.image = image;
    this.cols = cols;
    this.rows = rows;
    this.frameW = image.width / cols;
    this.frameH = image.height / rows;
  }

  // Draw frame (col, row) centered on (x, y), scaled to dw x dh.
  draw(ctx, col, row, x, y, dw, dh) {
    ctx.drawImage(
      this.image,
      col * this.frameW,
      row * this.frameH,
      this.frameW,
      this.frameH,
      x - dw / 2,
      y - dh / 2,
      dw,
      dh
    );
  }
}

// Load an image sprite sheet. Resolves to a SpriteSheet, or null if the image
// fails to load or there is no browser image support (e.g. headless tests) — so
// callers can fall back to a procedural sprite.
export function loadSpriteSheet(src, cols, rows) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(new SpriteSheet(img, cols, rows));
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
