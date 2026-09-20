/**
 * MULTI-LEVEL SLICING — owned by the gameplay person.
 *
 * A whole object can be cut, and so can the pieces it falls apart into, down
 * to the depth this file defines. Every cut pays the ingredient's score times
 * the multiplier for the depth of the piece that was cut.
 */
export const SLICE_CONFIG = {
  /**
   * Multiplier per depth: index 0 is a whole object, 1 a half, 2 a quarter,
   * and so on.
   *
   * The LENGTH of this array is what decides how deep the cutting goes: with
   * four entries a piece can be cut four times, and what is left after the
   * fourth cut is debris that falls away. Add or remove an entry and the
   * whole chain follows — nothing in the code counts levels on its own.
   *
   * The numbers rise because cutting a piece is harder than cutting the whole
   * object it came from: it is smaller, it is already moving apart and there
   * is less time left before it drops off screen.
   */
  multipliers: [1, 1.2, 1.5, 2],

  /**
   * Radius of a piece relative to the piece it was cut from.
   *
   * Not 0.5: halving the radius every level would make a quarter a speck of
   * dust and its hitbox unhittable. This is a readability number, not a
   * physical one — the pieces are meant to stay aimable.
   */
  pieceScale: 0.74,

  /**
   * Share of the parent's separation impulse given to a piece. The impulse
   * itself is `separation` in tuning.js, so the two stay in one place: the
   * feel of a cut opening up is tuned there and applies to every level.
   */
  separationScale: 0.8,
};
