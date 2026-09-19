import { createEntity, KIND } from './entities.js';
import { launchSpeedForApex, timeToApex } from './physics.js';

/**
 * Wyrzut obiektow z dolu ekranu.
 *
 * Celujemy w apogeum, nie w predkosc poczatkowa. Powod jest czysto
 * projektowy: "obiekt ma doleciec do 42% wysokosci ekranu" to parametr,
 * ktory osoba od gameplayu rozumie i moze stroic, a "predkosc 14.7 u/s"
 * nie znaczy dla niej nic i zmienia sens przy kazdej zmianie grawitacji.
 */
export function createSpawner({ tuning, rng, paletteSize = 6 }) {
  let timer = 0.4;

  function spawnOne(bounds) {
    const e = createEntity({
      kind: KIND.INGREDIENT,
      radius: rng.range(0.55, 0.85),
      colorIndex: rng.int(0, paletteSize - 1),
    });

    const x0 = rng.range(-bounds.halfW * 0.72, bounds.halfW * 0.72);
    const y0 = bounds.killY + 0.6;
    e.pos.x = x0;
    e.pos.y = y0;
    e.pos.z = rng.range(-1.6, 1.6);
    e.rot.x = rng.range(0, Math.PI * 2);
    e.rot.y = rng.range(0, Math.PI * 2);
    e.rot.z = rng.range(0, Math.PI * 2);

    const apexY = bounds.halfH * tuning.apexRatio;
    const vy = launchSpeedForApex(tuning.gravity, y0, apexY);
    const tApex = timeToApex(tuning.gravity, vy);
    const targetX = rng.range(-bounds.halfW * 0.5, bounds.halfW * 0.5);

    e.vel.x = (targetX - x0) / tApex;
    e.vel.y = vy;
    e.vel.z = 0;
    e.spin.x = rng.range(-2.5, 2.5);
    e.spin.y = rng.range(-2.5, 2.5);
    e.spin.z = rng.range(-2.5, 2.5);

    return e;
  }

  return {
    /** Zwraca tablice nowych obiektow (moze byc pusta). */
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
