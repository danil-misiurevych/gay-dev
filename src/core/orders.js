import { REAL_TYPES, scoreOf } from './ingredients.js';
import { RECIPE_CONFIG } from '../../config/recipes.js';

/**
 * ORDERS LAYER — recipes.
 *
 * This is the thing meant to set the game apart from the dozens of Fruit
 * Ninja clones: slicing on its own is a widely known mechanic and
 * distinguishes nothing. What distinguishes is the pressure of picking the
 * RIGHT ingredient in time — see docs/ROADMAP.md, milestone M2.
 *
 * The rules, deliberately as simple as they can be at this stage:
 *  - a recipe asks for a few ingredients, each in some count, within a time
 *    limit that scales with its size,
 *  - slicing a required ingredient advances it,
 *  - slicing anything else resets the recipe's progress to zero,
 *  - completing it pays the recipe's value; running out of time costs the
 *    same value. Value = sum of (ingredient score × count required).
 *
 * This module knows nothing about rendering, the HUD or how points are
 * stored. It returns the outcome of a slice or of a tick, and the core turns
 * that into an event and into score.
 *
 * @typedef {Object} RecipeItem
 * @property {string} typeId
 * @property {string} name
 * @property {number} score  points per single piece of this ingredient
 * @property {number} need   how many are required
 * @property {number} done   how many have been sliced so far
 *
 * @typedef {Object} Recipe
 * @property {number} id
 * @property {RecipeItem[]} items
 * @property {number} need      total pieces required across all items
 * @property {number} done      total pieces sliced so far
 * @property {number} value     Σ (score × need) — what it pays and what it costs
 * @property {number} reward    points added on completion
 * @property {number} penalty   points removed when the timer runs out
 * @property {number} patience  seconds allowed
 * @property {number} elapsed   seconds since the recipe was drawn
 */

/** Outcomes of a slice or of a tick, as seen by the orders layer. */
export const SLICE_RESULT = {
  /** The ingredient was on the recipe and moved it forward. */
  PROGRESS: 'progress',
  /** The ingredient was not required (or was already complete) — progress reset. */
  WRONG: 'wrong',
  /** That slice finished the recipe; a new one has been drawn. */
  COMPLETE: 'complete',
  /** The timer ran out; the recipe was lost and a new one has been drawn. */
  EXPIRED: 'expired',
};

/**
 * @param {object} deps
 * @param {object} deps.tuning  live tuning object; read on every tick, so the
 *                              timer switch in the panel takes effect at once
 */
/** `types` defaults to the real ingredients: a recipe never asks for a decoy. */
export function createOrders({ rng, tuning = {}, config = RECIPE_CONFIG, types = REAL_TYPES } = {}) {
  let nextId = 1;
  let recipe = null;
  let served = 0;
  let expired = 0;
  let mistakes = 0;

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  /** Read live, never cached: the panel can flip this mid-recipe. */
  const timerOn = () => tuning.recipeTimer !== false;
  const positive = (v, fallback) => (Number.isFinite(v) && v >= 0 ? v : fallback);

  /**
   * Draws a recipe. Types are drawn WITHOUT repetition, so one recipe never
   * lists the same ingredient twice — two lines asking for the same thing
   * would be unreadable in the HUD and would mean nothing different in play.
   */
  function roll() {
    const pool = [...types];
    const maxTypes = clamp(Math.round(config.maxTypes), 1, pool.length);
    const minTypes = clamp(Math.round(config.minTypes), 1, maxTypes);
    const count = rng.int(minTypes, maxTypes);

    const items = [];
    for (let i = 0; i < count && pool.length; i++) {
      const [type] = pool.splice(rng.int(0, pool.length - 1), 1);
      const maxPer = Math.max(1, Math.round(config.maxPerType));
      const minPer = clamp(Math.round(config.minPerType), 1, maxPer);
      items.push({
        typeId: type.id,
        name: type.name,
        // Taken at the moment the recipe is drawn, so retuning a score never
        // changes what the order in front of the player is already worth.
        score: scoreOf(type, tuning),
        need: rng.int(minPer, maxPer),
        done: 0,
      });
    }

    const need = items.reduce((n, it) => n + it.need, 0);
    const value = items.reduce((n, it) => n + it.score * it.need, 0);

    return {
      id: nextId++,
      items,
      need,
      done: 0,
      value,
      reward: Math.max(0, Math.round(value * positive(config.rewardMultiplier, 1))),
      penalty: Math.max(0, Math.round(value * positive(config.penaltyMultiplier, 1))),
      patience: positive(config.baseSeconds, 6) + positive(config.secondsPerPiece, 3.5) * need,
      elapsed: 0,
    };
  }

  function clearProgress() {
    for (const item of recipe.items) item.done = 0;
    recipe.done = 0;
  }

  /** Hands the current recipe back and puts a fresh one on the counter. */
  function replace() {
    const finished = recipe;
    recipe = roll();
    return finished;
  }

  return {
    enabled: true,

    /** The recipe currently being filled. Read-only for the rest of the app. */
    get recipe() { return recipe; },
    /** Seconds left on the current recipe, never below 0. */
    get remaining() { return recipe ? Math.max(0, recipe.patience - recipe.elapsed) : 0; },
    /**
     * How much of this ingredient the recipe still wants, 0..1.
     *
     * 1 = asked for and none of it cut yet, 0 = stocked, or never asked for
     * at all. An ingredient off the recipe reads the same as a finished one
     * on purpose: cutting either costs the player the recipe, so as far as
     * "should this fly" is concerned they are the same thing.
     *
     * Used by the spawner, see `recipeBias` in tuning.js.
     */
    wantedShare(typeId) {
      const item = recipe?.items.find((it) => it.typeId === typeId);
      if (!item || item.need <= 0) return 0;
      return Math.min(1, Math.max(0, (item.need - item.done) / item.need));
    },

    /** Whether recipes are on a clock right now. Read live from the tuning. */
    get timerEnabled() { return timerOn(); },
    get state() { return { recipe, served, expired, mistakes }; },

    /** Draws the first recipe. Called by the core on start and on reset. */
    start() {
      recipe = roll();
      return recipe;
    },

    /**
     * Reports a sliced ingredient.
     * @param {string} typeId
     * @returns {{ result: string, recipe: Recipe, item: RecipeItem|null, finished?: Recipe }}
     */
    onIngredientSliced(typeId) {
      if (!recipe) this.start();

      const item = recipe.items.find((it) => it.typeId === typeId && it.done < it.need);

      if (!item) {
        // Not on the recipe at all, already fully stocked, or a decoy — all
        // three are "not what the customer asked for" and cost the same. The
        // player has to keep track of what is still missing, not just of what
        // is listed.
        mistakes += 1;
        if (!config.failOnWrong) {
          clearProgress();
          return { result: SLICE_RESULT.WRONG, recipe, finished: null, item: null };
        }
        // The order is lost, exactly as if the clock had run out: the core
        // takes the recipe's penalty off the score and a new one is drawn.
        const finished = replace();
        return { result: SLICE_RESULT.WRONG, recipe, finished, item: null };
      }

      item.done += 1;
      recipe.done += 1;

      if (recipe.done < recipe.need) {
        return { result: SLICE_RESULT.PROGRESS, recipe, item };
      }

      served += 1;
      const finished = replace();
      return { result: SLICE_RESULT.COMPLETE, recipe, finished, item };
    },

    /**
     * Advances the timer.
     *
     * Does nothing while `recipeTimer` is off in the tuning: the elapsed time
     * simply stops accumulating, so switching the timer back on mid-recipe
     * continues the window rather than restarting it.
     *
     * @returns {null|{ result: string, recipe: Recipe, finished: Recipe }}
     *          non-null only on the tick where the recipe expires
     */
    update(dt) {
      if (!recipe || !timerOn()) return null;
      recipe.elapsed += dt;
      if (recipe.elapsed < recipe.patience) return null;

      expired += 1;
      const finished = replace();
      return { result: SLICE_RESULT.EXPIRED, recipe, finished, item: null };
    },

    reset() {
      served = 0;
      expired = 0;
      mistakes = 0;
      recipe = roll();
    },
  };
}
