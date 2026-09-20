import { segmentPointDistance, strokeSpeed } from './geometry2d.js';
import { canSliceDepth } from './pieces.js';

/**
 * Slice detection.
 *
 * Why the test happens in SCREEN SPACE rather than as a 3D raycast:
 *  1. The player aims at what they see — a circle on the screen, not a sphere
 *     in space. A screen-space test therefore matches the player's intent,
 *     while a raycast can be "mathematically fair but unfair to the feel".
 *  2. It is an order of magnitude cheaper: one projection per object per
 *     frame instead of intersecting a ray with geometry.
 *  3. The hitbox multiplier can be tuned with a single number — and that is
 *     the main knob deciding whether the game "feels" fair.
 *
 * This function knows nothing about the camera or Three.js. The render layer
 * injects `project(entity) -> { x, y, r }` in CSS pixels.
 */

/**
 * @param {object}   segment  { ax, ay, bx, by, dtMs } pointer movement segment
 * @param {Iterable} entities live objects
 * @param {Function} project  (entity) => { x, y, r } in px
 * @param {object}   tuning   { minSwipeSpeed, hitScale }
 * @returns {Array<{ entity, x, y, dirX, dirY }>} hits, newest first
 */
export function findSliceHits(segment, entities, project, tuning) {
  const { ax, ay, bx, by, dtMs } = segment;
  const hits = [];

  if (strokeSpeed(ax, ay, bx, by, dtMs) < tuning.minSwipeSpeed) return hits;

  const dirX = bx - ax;
  const dirY = by - ay;

  for (const entity of entities) {
    if (!entity.alive) continue;
    // A piece at the depth limit is debris: it still falls, but a swipe
    // through it must not score, or the last level would pay for nothing.
    if (!canSliceDepth(entity.depth)) continue;
    // A piece that is not armed yet cannot be cut — without this, the same
    // swipe that created it shreds it on the very next movement sample.
    if (entity.arm > 0) continue;
    const p = project(entity);
    if (!p) continue;
    if (segmentPointDistance(ax, ay, bx, by, p.x, p.y) <= p.r * tuning.hitScale) {
      hits.push({ entity, x: p.x, y: p.y, dirX, dirY });
    }
  }
  return hits;
}
