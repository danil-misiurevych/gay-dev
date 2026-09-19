import { addScaled } from './vec3.js';

/**
 * Balistyka. Jedno miejsce, w ktorym zyje calka ruchu — jesli kiedys
 * dojdzie opor powietrza albo wiatr w barze, zmienia sie tylko to.
 */
export function integrate(entity, gravity, dt) {
  entity.vel.y -= gravity * dt;
  addScaled(entity.pos, entity.vel, dt);
  entity.rot.x += entity.spin.x * dt;
  entity.rot.y += entity.spin.y * dt;
  entity.rot.z += entity.spin.z * dt;
  return entity;
}

/** Predkosc pionowa potrzebna, zeby z wysokosci fromY doleciec dokladnie do apexY. */
export function launchSpeedForApex(gravity, fromY, apexY) {
  const rise = Math.max(0.01, apexY - fromY);
  return Math.sqrt(2 * gravity * rise);
}

/** Czas wznoszenia do apogeum dla danej predkosci poczatkowej. */
export function timeToApex(gravity, vy) {
  return vy / gravity;
}
