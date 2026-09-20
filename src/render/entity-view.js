import * as THREE from 'three';
import { SHAPE_GEO, AXIS_Z, WHITE, skinMaterial, fleshMaterial } from './geometry.js';
import { PALETTE, FLESH_MIX } from './palette.js';

/**
 * The object view layer: maps core objects onto Three.js meshes and manages
 * the halves after a cut.
 *
 * Everything is pooled. The rule: not a single new Three.js object is created
 * inside the game loop. Allocation in the loop is not a matter of a few
 * microseconds — it is a garbage collector hitch, which on a phone shows up
 * as a stutter exactly at the moment of the cut, the worst possible one.
 */
export function createEntityView({ scene, cutBasis }) {
  const meshes = new Map();       // core object id -> renderable
  const pieces = new Map();        // core object id -> pooled half record
  const meshPool = [];
  const halves = [];              // live debris (not simulated by the core)
  const halfPool = [];

  const _q = new THREE.Quaternion();
  const _cut = new THREE.Vector3();
  const _normal = new THREE.Vector3();
  const _axis = new THREE.Vector3();

  // One pool for every shape. Shapes are swapped by reassigning the shared
  // geometry on a pooled mesh, which costs nothing and allocates nothing —
  // a pool per shape would only fragment the reuse.
  function acquireMesh(shape) {
    const m = meshPool.pop() || new THREE.Mesh(SHAPE_GEO[shape].full, skinMaterial());
    m.geometry = SHAPE_GEO[shape].full;
    scene.add(m);
    return m;
  }

  function acquireHalf(shape, side) {
    const geo = SHAPE_GEO[shape];
    let h = halfPool.pop();
    if (!h) {
      const group = new THREE.Group();
      const skin = new THREE.Mesh(geo.halfA, skinMaterial());
      const cap = new THREE.Mesh(geo.capA, fleshMaterial());
      group.add(skin, cap);
      h = { group, skin, cap, vel: new THREE.Vector3(), axis: new THREE.Vector3(), spin: 0, life: 0 };
    }
    h.skin.geometry = side > 0 ? geo.halfA : geo.halfB;
    h.cap.geometry = side > 0 ? geo.capA : geo.capB;
    scene.add(h.group);
    return h;
  }

  /** Skin in the ingredient color, cut face in a lightened, self-lit version. */
  function paintHalf(h, hex) {
    h.skin.material.color.setHex(hex);
    h.skin.material.opacity = 1;
    h.cap.material.color.setHex(hex);
    h.cap.material.color.lerp(WHITE, FLESH_MIX);
    // A flat cut face can end up turned away from every light and then
    // renders almost black. Its own emissive term guarantees the flesh
    // always stands out — and that is the main feedback signal saying
    // "the cut landed".
    h.cap.material.emissive.copy(h.cap.material.color).multiplyScalar(0.55);
    h.cap.material.opacity = 1;
  }

  return {
    get halfCount() { return halves.length; },

    /**
     * A whole object gets the full solid; a piece gets one half of it.
     *
     * A piece deeper than the first cut is drawn as a half of its shape too,
     * just smaller — we do not have quarter geometry and will not cut meshes
     * at run time (D-001). At the size and speed a piece travels this is not
     * a visible lie, and it keeps the promise that the loop allocates nothing.
     */
    onSpawn(entity) {
      const hex = PALETTE[entity.type.colorIndex % PALETTE.length];

      if (entity.depth === 0) {
        const m = acquireMesh(entity.type.shape);
        m.scale.setScalar(entity.radius);
        m.material.color.setHex(hex);
        m.material.opacity = 1;
        m.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
        meshes.set(entity.id, m);
        return;
      }

      const h = acquireHalf(entity.type.shape, entity.side);
      h.group.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
      h.group.scale.setScalar(entity.radius);
      if (entity.cut) {
        _normal.set(entity.cut.x, entity.cut.y, entity.cut.z);
        h.group.quaternion.setFromUnitVectors(AXIS_Z, _normal);
      }
      paintHalf(h, hex);
      meshes.set(entity.id, h.group);
      pieces.set(entity.id, h);
    },

    onRemove(entity) {
      const m = meshes.get(entity.id);
      if (!m) return;
      meshes.delete(entity.id);
      scene.remove(m);

      const h = pieces.get(entity.id);
      if (h) { pieces.delete(entity.id); halfPool.push(h); }
      else meshPool.push(m);
    },

    /**
     * Debris: the two halves left by the LAST possible cut. They are not
     * simulated by the core — nothing can be done with them any more, so they
     * are visual only and simply fade out. Every shallower cut produces real
     * entities instead, through onSpawn.
     */
    onSlice(entity, dirX, dirY, tuning, rng) {
      cutBasis(dirX, dirY, _cut, _normal);
      _q.setFromUnitVectors(AXIS_Z, _normal);
      const hex = PALETTE[entity.type.colorIndex % PALETTE.length];

      for (const side of [1, -1]) {
        const h = acquireHalf(entity.type.shape, side);
        h.group.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
        h.group.quaternion.copy(_q);
        h.group.scale.setScalar(entity.radius);

        paintHalf(h, hex);

        h.vel.set(entity.vel.x, entity.vel.y, entity.vel.z)
          .addScaledVector(_normal, side * tuning.separation)
          .addScaledVector(_cut, rng.range(-0.6, 0.6));
        h.axis.set(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)).normalize();
        h.spin = rng.range(0.4, 1) * tuning.halfSpin * side;
        h.life = 0;
        halves.push(h);
      }
      return { cut: _cut, normal: _normal };
    },

    /**
     * Syncs positions with the core state.
     *
     * A whole object takes its rotation straight from the core. A piece is
     * turned step by step instead: its orientation carries the cut plane, and
     * overwriting it with euler angles every frame would swing the cut face
     * around to face somewhere the cut never went.
     */
    sync(entities, dt = 0) {
      for (const e of entities.values()) {
        const m = meshes.get(e.id);
        if (!m) continue;
        m.position.set(e.pos.x, e.pos.y, e.pos.z);

        if (e.depth === 0) {
          m.rotation.set(e.rot.x, e.rot.y, e.rot.z);
          continue;
        }
        if (!dt) continue;
        _axis.set(e.spin.x, e.spin.y, e.spin.z);
        const rate = _axis.length();
        if (rate > 1e-6) m.rotateOnWorldAxis(_axis.divideScalar(rate), rate * dt);
      }
    },

    /** Halves live outside the core — purely visual, no effect on gameplay. */
    updateHalves(dt, gravity, killY) {
      for (let i = halves.length - 1; i >= 0; i--) {
        const h = halves[i];
        h.life += dt;
        h.vel.y -= gravity * dt;
        h.group.position.addScaledVector(h.vel, dt);
        h.group.rotateOnWorldAxis(h.axis, h.spin * dt);
        if (h.life > 0.9) {
          const op = Math.max(0, 1 - (h.life - 0.9) / 0.7);
          h.skin.material.opacity = op;
          h.cap.material.opacity = op;
        }
        if (h.group.position.y < killY || h.life > 1.7) {
          halves.splice(i, 1);
          scene.remove(h.group);
          halfPool.push(h);
        }
      }
    },

    clear() {
      for (const [id, m] of meshes) {
        scene.remove(m);
        const h = pieces.get(id);
        if (h) halfPool.push(h); else meshPool.push(m);
      }
      meshes.clear();
      pieces.clear();
      for (const h of halves) { scene.remove(h.group); halfPool.push(h); }
      halves.length = 0;
    },
  };
}
