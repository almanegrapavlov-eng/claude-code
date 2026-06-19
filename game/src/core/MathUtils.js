// Shared math helpers used throughout the game.
export const MathUtils = {

  distance(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Returns a unit vector {x, y}. Returns {0,0} for zero-length input.
  normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  },

  randomAngle() {
    return Math.random() * Math.PI * 2;
  },

  // Angle from point A toward point B, in radians.
  angleTo(ax, ay, bx, by) {
    return Math.atan2(by - ay, bx - ax);
  },

};
