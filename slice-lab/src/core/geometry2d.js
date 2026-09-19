/**
 * Geometria 2D uzywana przez detekcje ciecia.
 *
 * Kluczowa decyzja: test jest ODCINKIEM, nie punktem. Przy szybkim swipie
 * na 60 Hz palec przeskakuje kilkadziesiat pikseli miedzy klatkami i test
 * punktowy przepuscilby obiekt lezacy dokladnie na trasie ruchu.
 */

/** Najmniejsza odleglosc punktu (px, py) od odcinka (ax,ay)-(bx,by). */
export function segmentPointDistance(ax, ay, bx, by, px, py) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

/** Czy odcinek przecina okrag o srodku (cx, cy) i promieniu r. */
export function segmentIntersectsCircle(ax, ay, bx, by, cx, cy, r) {
  return segmentPointDistance(ax, ay, bx, by, cx, cy) <= r;
}

/** Predkosc ruchu w px/ms. dtMs jest przycinane do >= 1, zeby nie dzielic przez zero. */
export function strokeSpeed(ax, ay, bx, by, dtMs) {
  return Math.hypot(bx - ax, by - ay) / Math.max(1, dtMs);
}
