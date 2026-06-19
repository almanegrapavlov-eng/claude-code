// All sprites are drawn procedurally using Canvas 2D API.
// Every draw function receives a context already translated to the
// entity's screen position. The sprite is drawn centered at (0, 0)
// and fits inside a 182x182 bounding box.

export const ProceduralSprites = {

  // ---------- Player ----------
  // A teal circle with glowing eyes and a direction spike.
  drawPlayer(ctx, facingAngle) {
    const bodyRadius = 38;

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(0, 0, bodyRadius + 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(78, 205, 196, 0.15)';
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#4ecdc4';
    ctx.fill();
    ctx.strokeStyle = '#1a7a74';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(-10, -12, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fill();

    // Direction spike
    ctx.save();
    ctx.rotate(facingAngle);
    ctx.beginPath();
    ctx.moveTo(bodyRadius - 6, 0);
    ctx.lineTo(bodyRadius + 18, 0);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // Eyes — offset in the facing direction
    const eyeBase = 16;
    const eyeSpread = 0.45; // radians
    [facingAngle - eyeSpread, facingAngle + eyeSpread].forEach(angle => {
      const ex = Math.cos(angle) * eyeBase;
      const ey = Math.sin(angle) * eyeBase;

      // White of eye
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Pupil
      ctx.beginPath();
      ctx.arc(ex + Math.cos(facingAngle) * 2, ey + Math.sin(facingAngle) * 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#0d3b38';
      ctx.fill();
    });
  },

  // ---------- Background ----------
  // Infinite scrolling grid of faint lines and dots.
  drawBackground(ctx, camera) {
    const GRID = 80;
    const bounds = camera.getViewBounds(GRID);

    ctx.save();

    // Vertical lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const startX = Math.floor(bounds.left / GRID) * GRID;
    const startY = Math.floor(bounds.top  / GRID) * GRID;

    for (let wx = startX; wx <= bounds.right; wx += GRID) {
      const sx = wx - camera.x + 960;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, 1080);
      ctx.stroke();
    }

    // Horizontal lines
    for (let wy = startY; wy <= bounds.bottom; wy += GRID) {
      const sy = wy - camera.y + 540;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(1920, sy);
      ctx.stroke();
    }

    // Intersection dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    for (let wx = startX; wx <= bounds.right; wx += GRID) {
      for (let wy = startY; wy <= bounds.bottom; wy += GRID) {
        const sx = wx - camera.x + 960;
        const sy = wy - camera.y + 540;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Origin marker — small cross at world (0, 0)
    const origin = camera.worldToScreen(0, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(origin.x - 12, origin.y);
    ctx.lineTo(origin.x + 12, origin.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y - 12);
    ctx.lineTo(origin.x, origin.y + 12);
    ctx.stroke();

    ctx.restore();
  },

  // ---------- Shadow ----------
  // A soft ellipse drawn under any entity to ground it visually.
  drawShadow(ctx, radiusX, radiusY = radiusX * 0.35) {
    ctx.save();
    ctx.translate(0, radiusX * 0.55);
    ctx.scale(1, radiusY / radiusX);
    ctx.beginPath();
    ctx.arc(0, 0, radiusX * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();
    ctx.restore();
  },

};
