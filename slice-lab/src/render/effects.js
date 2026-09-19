import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { WHITE } from './geometry.js';

const MAX_PARTICLES = 64;

/**
 * Wybuchy czasteczek przy cieciu. Pulowane tak samo jak reszta.
 * Kazdy wybuch to jeden obiekt Points — jedno wywolanie rysowania
 * zamiast kilkunastu osobnych siatek.
 */
export function createEffects({ scene }) {
  const active = [];
  const pool = [];
  const _inherit = new THREE.Vector3();

  function acquire() {
    let b = pool.pop();
    if (!b) {
      const positions = new Float32Array(MAX_PARTICLES * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        size: 0.22, sizeAttenuation: true, transparent: true, depthWrite: false,
      });
      b = { points: new THREE.Points(geometry, material), positions, vel: [], n: 0, life: 0 };
      for (let i = 0; i < MAX_PARTICLES; i++) b.vel.push(new THREE.Vector3());
    }
    scene.add(b.points);
    return b;
  }

  return {
    burst(entity, normal, tuning, rng) {
      if (tuning.burstCount <= 0) return;
      const b = acquire();
      b.n = Math.min(MAX_PARTICLES, Math.round(tuning.burstCount));
      b.life = 0;
      b.points.material.color.setHex(PALETTE[entity.colorIndex % PALETTE.length]);
      b.points.material.color.lerp(WHITE, 0.35);
      b.points.material.opacity = 1;
      b.points.material.size = 0.1 + entity.radius * 0.18;

      for (let i = 0; i < b.n; i++) {
        b.positions[i * 3] = entity.pos.x;
        b.positions[i * 3 + 1] = entity.pos.y;
        b.positions[i * 3 + 2] = entity.pos.z;
        b.vel[i]
          .set(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)).normalize()
          .multiplyScalar(rng.range(1.5, 5.5))
          .addScaledVector(normal, rng.range(-2, 2))
          .add(_inherit.set(entity.vel.x, entity.vel.y, entity.vel.z));
      }
      b.points.geometry.attributes.position.needsUpdate = true;
      b.points.geometry.setDrawRange(0, b.n);
      active.push(b);
    },

    update(dt, gravity) {
      for (let i = active.length - 1; i >= 0; i--) {
        const b = active[i];
        b.life += dt;
        for (let p = 0; p < b.n; p++) {
          const v = b.vel[p];
          v.y -= gravity * 0.55 * dt;
          v.multiplyScalar(1 - 1.6 * dt);
          b.positions[p * 3] += v.x * dt;
          b.positions[p * 3 + 1] += v.y * dt;
          b.positions[p * 3 + 2] += v.z * dt;
        }
        b.points.geometry.attributes.position.needsUpdate = true;
        b.points.material.opacity = Math.max(0, 1 - b.life / 0.75);
        if (b.life > 0.75) {
          active.splice(i, 1);
          scene.remove(b.points);
          pool.push(b);
        }
      }
    },

    clear() {
      for (const b of active) { scene.remove(b.points); pool.push(b); }
      active.length = 0;
    },
  };
}
