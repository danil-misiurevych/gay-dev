import { segmentPointDistance, strokeSpeed } from './geometry2d.js';

/**
 * Detekcja ciecia.
 *
 * Dlaczego test odbywa sie w PRZESTRZENI EKRANU, a nie w 3D raycastem:
 *  1. Gracz celuje w to, co widzi — kolo na ekranie, nie kule w przestrzeni.
 *     Test ekranowy jest wiec zgodny z intencja gracza, a raycast bywa
 *     "sprawiedliwy matematycznie, ale niesprawiedliwy w odczuciu".
 *  2. Jest o rzad wielkosci tanszy: jedna projekcja na obiekt na klatke
 *     zamiast przeciecia promienia z geometria.
 *  3. Mnoznik hitboxa daje sie stroic jedna liczba — a to jest glowna
 *     galka odpowiadajaca za to, czy gra "czuje sie" uczciwie.
 *
 * Funkcja nie wie nic o kamerze ani o Three.js. Warstwa renderowania
 * wstrzykuje `project(entity) -> { x, y, r }` w pikselach CSS.
 */

/**
 * @param {object}   segment  { ax, ay, bx, by, dtMs } odcinek ruchu wskaznika
 * @param {Iterable} entities zywe obiekty
 * @param {Function} project  (entity) => { x, y, r } w px
 * @param {object}   tuning   { minSwipeSpeed, hitScale }
 * @returns {Array<{ entity, x, y, dirX, dirY }>} trafienia, od najnowszych
 */
export function findSliceHits(segment, entities, project, tuning) {
  const { ax, ay, bx, by, dtMs } = segment;
  const hits = [];

  if (strokeSpeed(ax, ay, bx, by, dtMs) < tuning.minSwipeSpeed) return hits;

  const dirX = bx - ax;
  const dirY = by - ay;

  for (const entity of entities) {
    if (!entity.alive) continue;
    const p = project(entity);
    if (!p) continue;
    if (segmentPointDistance(ax, ay, bx, by, p.x, p.y) <= p.r * tuning.hitScale) {
      hits.push({ entity, x: p.x, y: p.y, dirX, dirY });
    }
  }
  return hits;
}
