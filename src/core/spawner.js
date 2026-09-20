import { createEntity, KIND } from './entities.js';
import { pickIngredient } from './ingredients.js';
import { launchSpeedForApex, timeToApex } from './physics.js';

/**
 * Launching objects from the bottom of the screen.
 *
 * We aim at the apex, not at the launch speed. The reason is purely a design
 * one: "the object should reach 42% of the screen height" is a parameter the
 * gameplay person understands and can tune, while "speed 14.7 u/s" means
 * nothing to them and changes meaning with every change of gravity.
 *
 * The ingredient type is drawn by weight from config/ingredients.js, and the
 * radius comes from that type's range: silhouette is what tells ingredients
 * apart in flight, so a spike has to be consistently smaller than an orb
 * rather than randomly either way.
 */
export function createSpawner({ tuning, rng, recipeProgress = null }) {
  let timer = 0.4;

  /**
   * How much the flow leans towards what the recipe still needs.
   *
   *     wanted   = (need - done) / need     1 = none of it cut yet, 0 = stocked
   *     unwanted = 1 - wanted
   *     weight   = catalog weight x (2 x bias x wanted + 2 x (1 - bias) x unwanted)
   *
   * where bias is `recipeBias` in tuning.js. The two ends are the point:
   *
   *   1.0  only ingredients the recipe still needs are launched,
   *   0.5  no influence at all — the doubling is what makes this exactly the
   *        catalog weights, which is why the factor is 2 and not 1,
   *   0.0  only ingredients the player must NOT cut are launched.
   *
   * Everything between is a blend, moving smoothly as the recipe fills up:
   * an ingredient gets gradually rarer as it is stocked rather than vanishing
   * the moment the last one is cut. A cliff would be visible as the flow
   * changing character mid-recipe and would make the last ingredient of an
   * order feel scripted.
   *
   * An ingredient the recipe never asked for counts as fully unwanted, not as
   * neutral. It belongs with the stocked ones: both are things cutting which
   * costs the player the recipe, and the slider is really asking "how much of
   * what flies should be stuff you want" — a question a distractor has to be
   * part of, or the two ends would not mean what they say.
   */
  function demandFor(type) {
    if (!recipeProgress) return 1;
    const bias = Math.min(1, Math.max(0, tuning.recipeBias ?? 0.5));
    const wanted = recipeProgress(type.id);
    return Math.max(0, 2 * bias * wanted + 2 * (1 - bias) * (1 - wanted));
  }

  /**
   * Gives an object the arc that peaks at `apexRatio` of the screen height.
   * Shared by every launch edge: the apex is the parameter the gameplay
   * person tunes, so it must not depend on where the object entered from.
   */
  function aimAtApex(e, bounds, x0, y0, targetX) {
    const apexY = bounds.halfH * tuning.apexRatio;
    const vy = launchSpeedForApex(tuning.gravity, y0, apexY);
    const tApex = timeToApex(tuning.gravity, vy);

    e.pos.x = x0;
    e.pos.y = y0;
    e.pos.z = rng.range(-1.6, 1.6);
    e.vel.x = (targetX - x0) / tApex;
    e.vel.y = vy;
    e.vel.z = 0;
  }

  /** Straight up from below, the original launch. */
  function fromBottom(e, bounds) {
    const x0 = rng.range(-bounds.halfW * 0.72, bounds.halfW * 0.72);
    const y0 = bounds.killY + 0.6;
    aimAtApex(e, bounds, x0, y0, rng.range(-bounds.halfW * 0.5, bounds.halfW * 0.5));
  }

  /**
   * In from the left or right edge, crossing the screen.
   *
   * It starts OUTSIDE the visible area and low, so the object enters already
   * moving instead of appearing in mid-air, and it is aimed past the centre
   * so the arc actually crosses the playfield rather than clipping a corner.
   * Same apex as a launch from below, so the two mix without one of them
   * feeling faster.
   */
  function fromSide(e, bounds) {
    const side = rng.next() < 0.5 ? -1 : 1;
    const x0 = side * (bounds.halfW + 0.9);
    const y0 = rng.range(bounds.killY + 1.4, -bounds.halfH * 0.3);
    const targetX = -side * rng.range(bounds.halfW * 0.1, bounds.halfW * 0.6);
    aimAtApex(e, bounds, x0, y0, targetX);
  }

  function spawnOne(bounds) {
    const type = pickIngredient(rng, demandFor);
    const e = createEntity({
      kind: KIND.INGREDIENT,
      type,
      radius: rng.range(type.radius[0], type.radius[1]),
    });

    e.rot.x = rng.range(0, Math.PI * 2);
    e.rot.y = rng.range(0, Math.PI * 2);
    e.rot.z = rng.range(0, Math.PI * 2);

    if (rng.next() < tuning.sideSpawnRatio) fromSide(e, bounds);
    else fromBottom(e, bounds);

    e.spin.x = rng.range(-2.5, 2.5);
    e.spin.y = rng.range(-2.5, 2.5);
    e.spin.z = rng.range(-2.5, 2.5);

    return e;
  }

  return {
    /** Returns an array of new objects (possibly empty). */
    update(dt, bounds) {
      timer -= dt;
      if (timer > 0) return [];
      const jitter = 1 + rng.range(-tuning.spawnJitter, tuning.spawnJitter);
      timer = tuning.spawnEvery * jitter;
      const out = [];
      for (let i = 0; i < tuning.perSpawn; i++) out.push(spawnOne(bounds));
      return out;
    },
    reset() { timer = 0.4; },
  };
}
