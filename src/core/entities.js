import { v3 } from './vec3.js';
import { INGREDIENT_TYPES } from './ingredients.js';

/** Object kinds. BOMB and the rest land here once they exist — see docs/ROADMAP.md. */
export const KIND = {
  INGREDIENT: 'ingredient',
};

let nextId = 1;
export const resetIds = () => { nextId = 1; };

/**
 * The single factory for everything that flies across the screen. Every
 * object — orb, cube or spike alike — is created here and differs only by
 * the type assigned to it (`type`, see config/ingredients.js).
 *
 * The type is a reference to a frozen catalog entry rather than a copy of
 * its fields: name, shape, color and score have exactly one source of
 * truth. Adding a fourth ingredient requires no change in this file.
 */
export function createEntity({
  kind = KIND.INGREDIENT,
  type = INGREDIENT_TYPES[0],
  radius = 0.7,
  depth = 0,
} = {}) {
  return {
    id: nextId++,
    kind,
    type,
    radius,
    /** 0 = a whole object, 1 = a half, 2 = a quarter… see src/core/pieces.js. */
    depth,
    /** Cut normal that produced this piece; null for a whole object. */
    cut: null,
    /** Which side of that cut it is, +1 or -1; drives which half is drawn. */
    side: 0,
    /** Seconds left before this piece may be cut. See config/tuning.js. */
    arm: 0,
    pos: v3(),
    vel: v3(),
    rot: v3(),
    spin: v3(),
    alive: true,
  };
}
