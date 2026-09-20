import { INGREDIENTS } from '../../config/ingredients.js';
import { scoreKey } from '../../config/tuning.js';

/**
 * Ingredient types as the core sees them.
 *
 * The core knows nothing about geometry or color hexes — it only carries
 * identifiers. `shape` and `colorIndex` are passed straight through to the
 * render layer, which is what gives them meaning. That is why swapping the
 * primitive solids for real models in M4 will not touch a single line of
 * game logic.
 *
 * The catalog is validated once, at import time. A bad entry must blow up
 * at startup rather than show up an hour into a play session as an object
 * with no shape or one worth zero points.
 */

/** Shapes that src/render/geometry.js knows how to build. */
export const SHAPES = ['sphere', 'box', 'cone'];

function normalize(raw, index) {
  const where = `config/ingredients.js[${index}]`;

  if (!raw?.id || typeof raw.id !== 'string') throw new Error(`${where}: missing id`);
  if (!SHAPES.includes(raw.shape)) {
    throw new Error(`${where} (${raw.id}): unknown shape "${raw.shape}", allowed: ${SHAPES.join(', ')}`);
  }

  const [rMin, rMax] = Array.isArray(raw.radius) ? raw.radius : [0.7, 0.7];

  return Object.freeze({
    id: raw.id,
    name: typeof raw.name === 'string' && raw.name ? raw.name : raw.id,
    shape: raw.shape,
    colorIndex: Math.max(0, Math.round(raw.colorIndex ?? 0)),
    score: Math.max(0, Math.round(raw.score ?? 0)),
    weight: Math.max(0, Number(raw.weight ?? 1)),
    radius: Object.freeze([Math.max(0.05, rMin), Math.max(0.05, rMax)]),
    fake: raw.fake === true,
  });
}

/** @type {ReadonlyArray<object>} */
export const INGREDIENT_TYPES = Object.freeze(INGREDIENTS.map(normalize));

/**
 * What recipes may ask for, and what only ever flies as a decoy.
 *
 * The split lives here rather than at every call site so that "a recipe never
 * asks for a fake" is one fact in one place. Everything that launches objects
 * uses the full list; everything that builds an order uses REAL_TYPES.
 */
export const REAL_TYPES = Object.freeze(INGREDIENT_TYPES.filter((t) => !t.fake));
export const FAKE_TYPES = Object.freeze(INGREDIENT_TYPES.filter((t) => t.fake));

if (!REAL_TYPES.length) {
  throw new Error('config/ingredients.js: every ingredient is marked fake, so no recipe can exist');
}

const byId = new Map();
for (const type of INGREDIENT_TYPES) {
  if (byId.has(type.id)) throw new Error(`config/ingredients.js: duplicate id "${type.id}"`);
  byId.set(type.id, type);
}

const TOTAL_WEIGHT = INGREDIENT_TYPES.reduce((sum, t) => sum + t.weight, 0);
if (!INGREDIENT_TYPES.length || TOTAL_WEIGHT <= 0) {
  throw new Error('config/ingredients.js: catalog is empty or every weight is 0');
}

/** @returns {object|undefined} */
export const ingredientById = (id) => byId.get(id);

/**
 * Picks a type by weight.
 *
 * Weighted rather than uniform because the distractors have to fly more often
 * than the rare ingredients — and that has to be settable in configuration,
 * not in code.
 *
 * `modifier(type)` scales a type's weight for this draw only; it is how the
 * spawner biases the launches towards what the current recipe still needs
 * (see src/core/spawner.js). If it silences everything — every weight at zero
 * — the draw falls back to the plain catalog weights rather than returning
 * nothing: a spawner that stops spawning is a far worse failure than a badly
 * biased one.
 */
export function pickIngredient(rng, modifier = null) {
  if (!modifier) return pickByWeight(rng, INGREDIENT_TYPES.map((t) => t.weight), TOTAL_WEIGHT);

  const weights = INGREDIENT_TYPES.map((t) => Math.max(0, t.weight * modifier(t)));
  const total = weights.reduce((n, w) => n + w, 0);
  if (total <= 0) return pickByWeight(rng, INGREDIENT_TYPES.map((t) => t.weight), TOTAL_WEIGHT);
  return pickByWeight(rng, weights, total);
}

function pickByWeight(rng, weights, total) {
  let ticket = rng.next() * total;
  for (let i = 0; i < weights.length; i++) {
    ticket -= weights[i];
    if (ticket <= 0) return INGREDIENT_TYPES[i];
  }
  return INGREDIENT_TYPES[INGREDIENT_TYPES.length - 1];
}

/**
 * The live score of an ingredient.
 *
 * The catalog entry holds the default; the tuning holds what the gameplay
 * person has dialled in, so this is the only function allowed to answer
 * "what is one of these worth". Reading `type.score` directly anywhere else
 * would quietly ignore the panel.
 */
export function scoreOf(type, tuning) {
  const tuned = tuning?.[scoreKey(type.id)];
  return Number.isFinite(tuned) ? tuned : type.score;
}
