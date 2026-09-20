import { addScaled } from './vec3.js';

/**
 * Ballistics. The one place where motion is integrated — if air drag or
 * a draught in the bar ever shows up, this is the only file that changes.
 */
export function integrate(entity, gravity, dt) {
  entity.vel.y -= gravity * dt;
  addScaled(entity.pos, entity.vel, dt);
  entity.rot.x += entity.spin.x * dt;
  entity.rot.y += entity.spin.y * dt;
  entity.rot.z += entity.spin.z * dt;
  return entity;
}

/** Vertical speed needed to rise from fromY to exactly apexY. */
export function launchSpeedForApex(gravity, fromY, apexY) {
  const rise = Math.max(0.01, apexY - fromY);
  return Math.sqrt(2 * gravity * rise);
}

/** Time to reach the apex for a given launch speed. */
export function timeToApex(gravity, vy) {
  return vy / gravity;
}
