// Small, dependency-free math helpers used across the game.

// Keep a value within the [min, max] range.
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Linearly interpolate from a to b by t (0..1).
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Straight-line distance between two points.
export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// Squared distance — cheaper than distance() when you only need to compare
// lengths (e.g. finding the nearest enemy or testing an overlap).
export function distanceSq(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

// True if two circles overlap. Used for all collision in the game.
export function circleOverlap(ax, ay, ar, bx, by, br) {
  const r = ar + br;
  return distanceSq(ax, ay, bx, by) <= r * r;
}

// Length of a vector.
export function length(x, y) {
  return Math.hypot(x, y);
}

// Return a unit-length copy of a vector as { x, y }. A zero vector stays zero.
export function normalize(x, y) {
  const len = Math.hypot(x, y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

// Random float in [min, max).
export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}
