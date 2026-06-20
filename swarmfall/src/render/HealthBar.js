// Shared health-bar drawing, used by the player, enemies, and the HUD so the
// bar logic lives in exactly one place.

// Pick a fill color from a 0..1 health ratio: green -> yellow -> red.
export function healthColor(ratio) {
  if (ratio > 0.5) return '#5dd35d';
  if (ratio > 0.25) return '#e3c54a';
  return '#e8584a';
}

// Draw a horizontal bar centered on `centerX`, with its top at `topY`.
// `ratio` is clamped to 0..1. Coordinates are whatever space the caller is in
// (world-space for entities, screen-space for the HUD).
export function drawHealthBar(ctx, centerX, topY, width, height, ratio, opts = {}) {
  const {
    fg = healthColor(ratio),
    bg = 'rgba(0, 0, 0, 0.55)',
    border = 'rgba(0, 0, 0, 0.75)',
  } = opts;

  const r = Math.max(0, Math.min(1, ratio));
  const x = centerX - width / 2;

  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(x, topY, width, height);
  ctx.fillStyle = fg;
  ctx.fillRect(x, topY, width * r, height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = border;
  ctx.strokeRect(x, topY, width, height);
  ctx.restore();
}
