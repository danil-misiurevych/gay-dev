import { createEmitter } from './events.js';
import { createRng } from './rng.js';
import { createSpawner } from './spawner.js';
import { createScoring } from './scoring.js';
import { createOrders } from './orders.js';
import { computeBounds } from './bounds.js';
import { integrate } from './physics.js';
import { findSliceHits } from './slicing.js';
import { mergeTuning } from './config.js';

/**
 * Rdzen gry. NIE importuje Three.js ani niczego z DOM.
 *
 * Kontrakt z reszta aplikacji:
 *  - `update(dt)` posuwa symulacje i emituje zdarzenia,
 *  - `trySlice(segment, project)` przyjmuje odcinek ruchu w px i funkcje
 *    rzutujaca obiekt na ekran; obie dostarcza warstwa renderowania,
 *  - warstwa renderowania i UI subskrybuja zdarzenia i NIGDY nie mutuja
 *    stanu rdzenia bezposrednio.
 *
 * Zdarzenia:
 *  'spawn'  { entity }
 *  'slice'  { entity, x, y, dirX, dirY, gain, combo }
 *  'miss'   { entity, misses }
 *  'reset'  {}
 */
export function createGame({ tuning = {}, seed, paletteSize = 6 } = {}) {
  const emitter = createEmitter();
  const cfg = mergeTuning(tuning);
  const rng = createRng(seed);

  const spawner = createSpawner({ tuning: cfg, rng, paletteSize });
  const scoring = createScoring({ tuning: cfg });
  const orders = createOrders({ tuning: cfg, rng });

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
      integrate(e, cfg.gravity, dt);
      if (e.pos.y < bounds.killY) {
        e.alive = false;
        entities.delete(e.id);
        emitter.emit('miss', { entity: e, misses: scoring.registerMiss() });
      }
    }

    if (orders.enabled) orders.update(dt);
  }

  /**
   * @param {object}   segment { ax, ay, bx, by, dtMs }
   * @param {Function} project (entity) => { x, y, r } w px
   * @returns {number} liczba przecietych obiektow
   */
  function trySlice(segment, project) {
    if (paused) return 0;
    const hits = findSliceHits(segment, entities.values(), project, cfg);
    for (const hit of hits) {
      hit.entity.alive = false;
      entities.delete(hit.entity.id);
      const { gain, combo } = scoring.registerSlice();
      if (orders.enabled) orders.onIngredientSliced(hit.entity.kind);
      emitter.emit('slice', { ...hit, gain, combo });
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
    reset() {
      entities.clear();
      spawner.reset();
      scoring.reset();
      orders.reset();
      emitter.emit('reset', {});
    },
  };
}
