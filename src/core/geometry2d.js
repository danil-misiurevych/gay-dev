/**
 * 2D geometry used by slice detection.
 *
 * The key decision: the test uses a SEGMENT, not a point. During a fast
 * swipe at 60 Hz the finger jumps tens of pixels between frames, and a point
 * test would miss an object sitting right on the path of the movement.
 */

/** Shortest distance from point (px, py) to segment (ax,ay)-(bx,by). */
export function segmentPointDistance(ax, ay, bx, by, px, py) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

/** Whether the segment crosses the circle centred at (cx, cy) with radius r. */
export function segmentIntersectsCircle(ax, ay, bx, by, cx, cy, r) {
  return segmentPointDistance(ax, ay, bx, by, cx, cy) <= r;
}

/** Movement speed in px/ms. dtMs is clamped to >= 1 to avoid dividing by zero. */
export function strokeSpeed(ax, ay, bx, by, dtMs) {
  return Math.hypot(bx - ax, by - ay) / Math.max(1, dtMs);
}
