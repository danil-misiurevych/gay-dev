import { createEmitter } from './events.js';
import { createRng } from './rng.js';
import { createSpawner } from './spawner.js';
import { createScoring } from './scoring.js';
import { createOrders, SLICE_RESULT } from './orders.js';
import { computeBounds } from './bounds.js';
import { integrate } from './physics.js';
import { findSliceHits } from './slicing.js';
import { splitEntity, multiplierFor, screenCutNormal } from './pieces.js';
import { mergeTuning } from './config.js';
import { scoreOf } from './ingredients.js';

/**
 * The game core. It does NOT import Three.js or anything from the DOM.
 *
 * The contract with the rest of the application:
 *  - `update(dt)` advances the simulation and emits events,
 *  - `trySlice(segment, project)` takes a movement segment in px and a
 *    function projecting an object onto the screen; the render layer
 *    supplies both,
 *  - the render and UI layers subscribe to events and NEVER mutate core
 *    state directly.
 *
 * Events:
 *  'spawn'  { entity }
 *  'slice'  { entity, x, y, dirX, dirY, gain, combo, multiplier, depth, normal, pieces }
 *           gain = type score x depth multiplier + combo bonus
 *  'miss'   { entity, misses }                          whole objects only
 *  'gone'   { entity }                                  a piece left the screen
 *  'recipe' { recipe, result, item, gain }              result: see SLICE_RESULT,
 *                                                       or 'new' when a recipe is drawn;
 *                                                       gain is signed: + on completion,
 *                                                       - when the timer runs out
 *  'reset'  {}
 */
export function createGame({ tuning = {}, seed } = {}) {
  const emitter = createEmitter();
  const cfg = mergeTuning(tuning);
  const rng = createRng(seed);

  const scoring = createScoring({ tuning: cfg });
  const orders = createOrders({ rng, tuning: cfg });
  // The spawner leans towards what the recipe still needs. It asks the orders
  // layer rather than holding a copy of the recipe, so there is still exactly
  // one place that knows what the customer wants. With the orders layer off,
  // everything is equally wanted and the catalog weights stand.
  const spawner = createSpawner({
    tuning: cfg,
    rng,
    recipeProgress: (typeId) => (orders.enabled ? orders.wantedShare(typeId) : 0.5),
  });

  /** @type {Map<number, object>} */
  const entities = new Map();
  let bounds = computeBounds(1);
  let paused = false;

  function setTuning(patch) {
    Object.assign(cfg, mergeTuning({ ...cfg, ...patch }));
  }

  function update(dt) {
    if (paused) return;

    for (const e of spawner.update(dt, bounds)) {
      entities.set(e.id, e);
      emitter.emit('spawn', { entity: e });
    }

    for (const e of entities.values()) {
      if (e.arm > 0) e.arm -= dt;
      integrate(e, cfg.gravity, dt);
      if (e.pos.y >= bounds.killY) continue;

      e.alive = false;
      entities.delete(e.id);
      // Only a whole object that was never touched is a miss. Pieces drop off
      // screen constantly and by design — counting them would turn the miss
      // counter into a counter of how much the player cut.
      if (e.depth === 0) emitter.emit('miss', { entity: e, misses: scoring.registerMiss() });
      else emitter.emit('gone', { entity: e });
    }

    if (orders.enabled) {
      const expiry = orders.update(dt);
      if (expiry) {
        const lost = -scoring.applyPenalty(expiry.finished.penalty);
        scoring.resetCutBonus();
        emitter.emit('recipe', { ...expiry, gain: lost, cutBonus: 0 });
      }
    }
  }

  /**
   * @param {object}   segment   { ax, ay, bx, by, dtMs }
   * @param {Function} project   (entity) => { x, y, r } in px
   * @param {Function} [cutNormal] (dirX, dirY) => { x, y, z } world-space normal
   *                  of the cut plane. Supplied by the render layer, which is
   *                  the only thing that knows where the camera is; without it
   *                  the core falls back to a straight-on camera.
   * @returns {number} how many objects were sliced
   */
  function trySlice(segment, project, cutNormal) {
    if (paused) return 0;
    const hits = findSliceHits(segment, entities.values(), project, cfg);
    for (const hit of hits) {
      const entity = hit.entity;
      entity.alive = false;
      entities.delete(entity.id);

      // Cutting a piece pays more than cutting the object it came from: it is
      // smaller, already moving apart and closer to falling off screen.
      const multiplier = multiplierFor(entity.depth);
      const { gain, combo } = scoring.registerSlice(scoreOf(entity.type, cfg) * multiplier);
      // Cutting a piece is the extra cutting the recipe card counts separately.
      if (entity.depth > 0) scoring.trackCutBonus(gain);

      const normal = (cutNormal ?? screenCutNormal)(hit.dirX, hit.dirY);
      const pieces = splitEntity(entity, normal, cfg, rng);
      for (const piece of pieces) {
        entities.set(piece.id, piece);
        emitter.emit('spawn', { entity: piece });
      }

      emitter.emit('slice', {
        ...hit, gain, combo, multiplier, depth: entity.depth, normal, pieces,
        cutBonus: scoring.cutBonus,
      });

      // Only the first cut of a whole object speaks to the orders layer. If
      // pieces counted, one orb could fill an order for three of them — and
      // the order is the game.
      if (orders.enabled && entity.depth === 0) {
        const outcome = orders.onIngredientSliced(entity.type.id);
        // Score is moved by the core, not by the orders layer: scoring has
        // exactly one owner, and the orders layer must stay free of any
        // knowledge of how points are counted.
        // A recipe that is lost costs what it would have paid — the same
        // number whether it was lost to the clock or to a wrong cut. The
        // score floors at zero, so a mistake can empty the balance but never
        // put the player in debt.
        let recipeGain = 0;
        if (outcome.result === SLICE_RESULT.COMPLETE) {
          recipeGain = scoring.addBonus(outcome.finished.reward);
        } else if (outcome.result === SLICE_RESULT.WRONG && outcome.finished) {
          recipeGain = -scoring.applyPenalty(outcome.finished.penalty);
        }
        // A new recipe starts the extra-cut tally from zero: the number on
        // the card belongs to the order in front of the player, not to the
        // whole session.
        if (outcome.finished) scoring.resetCutBonus();
        emitter.emit('recipe', {
          ...outcome, gain: recipeGain, cutBonus: scoring.cutBonus, x: hit.x, y: hit.y,
        });
      }
    }
    return hits.length;
  }

  return {
    get tuning() { return cfg; },
    get bounds() { return bounds; },
    get entities() { return entities; },
    get scoring() { return scoring; },
    get orders() { return orders; },
    get seed() { return rng.seed; },
    get paused() { return paused; },

    on: emitter.on,
    setTuning,
    setPaused(v) { paused = !!v; },
    setAspect(aspect) { bounds = computeBounds(aspect); return bounds; },
    beginStroke: () => scoring.beginStroke(),
    endStroke: () => scoring.endStroke(),
    update,
    trySlice,
    /** Draws the first recipe and announces it. Called once after wiring up. */
    start() {
      if (!orders.enabled) return null;
      const recipe = orders.start();
      scoring.resetCutBonus();
      emitter.emit('recipe', { result: 'new', recipe, item: null, gain: 0, cutBonus: 0 });
      return recipe;
    },
    reset() {
      entities.clear();
      spawner.reset();
      scoring.reset();
      orders.reset();
      emitter.emit('reset', {});
      if (orders.enabled) {
        emitter.emit('recipe', { result: 'new', recipe: orders.recipe, item: null, gain: 0, cutBonus: 0 });
      }
    },
  };
}
