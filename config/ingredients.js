/**
 * INGREDIENT CATALOG — the single source of truth for what flies on screen.
 *
 * Owned by the gameplay person, same as tuning.js. Adding a new ingredient
 * means adding one record here: no change in the core and no change in the
 * render layer, as long as `shape` is one of the shapes known to
 * src/render/geometry.js.
 *
 * Why a separate file instead of tuning.js: tuning.js is a flat list of
 * numbers that the tuning panel exposes as sliders and exports as JSON.
 * A catalog is a list of records and does not map onto a slider. Mixing
 * the two would break both the panel and the export.
 *
 * `shape` is a TEMPORARY visual stand-in — a primitive solid, not a model.
 * Real models land in M4, after the M2 gate (docs/ROADMAP.md, D-008).
 *
 * @typedef {Object} IngredientType
 * @property {string} id          identifier used by the orders layer (M2)
 * @property {string} name        name shown to the player
 * @property {string} shape       'sphere' | 'box' | 'cone' — see src/render/geometry.js
 * @property {number} colorIndex  index into PALETTE (src/render/palette.js)
 * @property {number} score       points for slicing it, before the combo bonus
 * @property {number} weight      spawn weight relative to the other types
 * @property {[number, number]} radius  radius range in world units
 * @property {boolean} [fake]     a decoy: never appears on a recipe, and
 *                                cutting one is always a mistake
 */

/**
 * Real ingredients are what recipes ask for. Fakes are decoys: they fly, they
 * can be cut, and cutting one is always wrong. They exist because an order
 * the player cannot fail is not an order — see docs/ROADMAP.md, the M2 gate.
 *
 * A fake repeats the SHAPE of a real ingredient and drops the color. Shape is
 * what the eye tracks in flight, so a decoy that looked nothing like anything
 * would be ignored rather than mistaken; grey is the signal that carries the
 * warning without a second shape to learn.
 *
 * @type {IngredientType[]}
 */
export const INGREDIENTS = [
  {
    id: 'orb',
    name: 'Plasma orb',
    shape: 'sphere',
    colorIndex: 2,   // teal
    // Easiest target: large and round, so it is the cheapest one in points.
    score: 10,
    weight: 3,
    radius: [0.58, 0.80],
  },
  {
    id: 'cube',
    name: 'Ice cube',
    shape: 'box',
    colorIndex: 5,   // blue
    score: 15,
    weight: 2,
    radius: [0.52, 0.70],
  },
  {
    id: 'chili',
    name: 'Chili spike',
    shape: 'cone',
    colorIndex: 3,   // pink
    // Smallest and narrowest silhouette — hardest to hit, so it pays the most.
    score: 20,
    weight: 1,
    radius: [0.48, 0.64],
  },

  // --- decoys ------------------------------------------------------------
  // Same shapes, no color, and worth nothing. The points are deliberately 0:
  // the cost of cutting one is the recipe progress it wipes, and paying for
  // the mistake as well would blunt that. Raise it here (or on the slider) if
  // playtests say the risk needs to be softer.
  {
    id: 'ash_orb',
    name: 'Ash orb',
    shape: 'sphere',
    colorIndex: 6,   // neutral grey
    score: 0,
    weight: 2,
    radius: [0.58, 0.80],
    fake: true,
  },
  {
    id: 'ash_cube',
    name: 'Ash cube',
    shape: 'box',
    colorIndex: 6,
    score: 0,
    weight: 1.5,
    radius: [0.52, 0.70],
    fake: true,
  },
  {
    id: 'ash_spike',
    name: 'Ash spike',
    shape: 'cone',
    colorIndex: 6,
    score: 0,
    weight: 1,
    radius: [0.48, 0.64],
    fake: true,
  },
];
