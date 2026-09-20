import { SLICE_CONFIG } from '../../config/slicing.js';
import { createEntity } from './entities.js';

/**
 * Cutting a piece into two pieces.
 *
 * Halves used to be a purely visual affair living in the render layer: they
 * looked right and the core never knew about them. They cannot stay that way
 * once the player is allowed to cut them, because anything that can be hit
 * needs a hitbox, physics and a score — all of which live in the core.
 *
 * So a piece is an ordinary entity that happens to carry a `depth` and the
 * normal of the cut that produced it. Everything else — ballistics, slice
 * detection, removal at the kill line — is the machinery that was already
 * there, which is the whole reason this is a small file.
 *
 * What a piece is NOT allowed to do is documented in DECISIONS.md, D-015:
 * it never advances a recipe and never counts as a miss. Both would let one
 * lucky object fill an order, and the orders layer is the point of the game.
 */

export const MULTIPLIERS = SLICE_CONFIG.multipliers;

/** How many times a piece can be cut. Derived from the multiplier table. */
export const MAX_DEPTH = MULTIPLIERS.length;

/** Score multiplier for cutting a piece at this depth. */
export function multiplierFor(depth) {
  return MULTIPLIERS[Math.min(depth, MULTIPLIERS.length - 1)] ?? 1;
}

/** Whether a piece at this depth may still be cut. */
export const canSliceDepth = (depth) => depth < MAX_DEPTH;

/**
 * The normal of the cut plane in world space, for a camera looking straight
 * down −Z. The render layer injects the exact one (`scene.cutNormal`); this
 * is the fallback, and it is also what core tests run against, so they stay
 * honest without a renderer.
 */
export function screenCutNormal(dirX, dirY) {
  const len = Math.hypot(dirY, dirX);
  if (len < 1e-6) return { x: 1, y: 0, z: 0 };
  return { x: dirY / len, y: dirX / len, z: 0 };
}

/**
 * Splits an entity into two pieces flying apart along the cut normal.
 * Returns an empty array once the depth limit is reached — what is left then
 * is debris, and debris belongs to the render layer, not to the simulation.
 *
 * @param {object} entity  the piece that was cut
 * @param {object} normal  world-space cut normal, {x, y, z}
 * @param {object} tuning  live tuning (separation, halfSpin)
 * @param {object} rng
 */
export function splitEntity(entity, normal, tuning, rng) {
  const childDepth = entity.depth + 1;
  if (!canSliceDepth(entity.depth)) return [];

  const push = (tuning.separation ?? 3) * SLICE_CONFIG.separationScale;
  const spin = tuning.halfSpin ?? 6.5;
  const out = [];

  for (const side of [1, -1]) {
    const piece = createEntity({
      kind: entity.kind,
      type: entity.type,
      radius: entity.radius * SLICE_CONFIG.pieceScale,
      depth: childDepth,
    });

    piece.pos.x = entity.pos.x + normal.x * side * entity.radius * 0.3;
    piece.pos.y = entity.pos.y + normal.y * side * entity.radius * 0.3;
    piece.pos.z = entity.pos.z + normal.z * side * entity.radius * 0.3;

    // The parent's velocity plus a push along the cut normal, so the two
    // pieces open up along the line the finger drew rather than scattering.
    piece.vel.x = entity.vel.x + normal.x * side * push;
    piece.vel.y = entity.vel.y + normal.y * side * push;
    piece.vel.z = entity.vel.z + normal.z * side * push;

    piece.rot.x = entity.rot.x;
    piece.rot.y = entity.rot.y;
    piece.rot.z = entity.rot.z;
    piece.spin.x = rng.range(-1, 1) * spin * 0.35;
    piece.spin.y = rng.range(-1, 1) * spin * 0.35;
    piece.spin.z = rng.range(0.4, 1) * spin * side * 0.5;

    // A piece is born under the pointer that just cut its parent, so it
    // spends its first moments un-cuttable. See tuning.pieceArmTime.
    piece.arm = Math.max(0, tuning.pieceArmTime ?? 0.12);
    piece.cut = { x: normal.x, y: normal.y, z: normal.z };
    piece.side = side;
    out.push(piece);
  }

  return out;
}
