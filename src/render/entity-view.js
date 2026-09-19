import * as THREE from 'three';
import { GEO, AXIS_Z, WHITE, skinMaterial, fleshMaterial } from './geometry.js';
import { PALETTE, FLESH_MIX } from './palette.js';

/**
 * Warstwa widoku obiektow: mapuje obiekty rdzenia na siatki Three.js
 * i zarzadza polowkami po cieciu.
 *
 * Wszystko jest pulowane. Zasada: w petli gry nie powstaje ani jeden nowy
 * obiekt Three.js. Alokacja w petli to nie kwestia paru mikrosekund —
 * to przycinka od garbage collectora, ktora na telefonie widac jako
 * zacinanie dokladnie w momencie ciecia, czyli w najgorszym mozliwym.
 */
export function createEntityView({ scene, cutBasis }) {
  const meshes = new Map();       // id obiektu rdzenia -> mesh
  const meshPool = [];
  const halves = [];              // aktywne polowki
  const halfPool = [];

  const _q = new THREE.Quaternion();
  const _cut = new THREE.Vector3();
  const _normal = new THREE.Vector3();

  function acquireMesh() {
    const m = meshPool.pop() || new THREE.Mesh(GEO.full, skinMaterial());
    scene.add(m);
    return m;
  }

  function acquireHalf(side) {
    let h = halfPool.pop();
    if (!h) {
      const group = new THREE.Group();
      const skin = new THREE.Mesh(GEO.halfA, skinMaterial());
      const cap = new THREE.Mesh(GEO.capA, fleshMaterial());
      group.add(skin, cap);
      h = { group, skin, cap, vel: new THREE.Vector3(), axis: new THREE.Vector3(), spin: 0, life: 0 };
    }
    h.skin.geometry = side > 0 ? GEO.halfA : GEO.halfB;
    h.cap.geometry = side > 0 ? GEO.capA : GEO.capB;
    scene.add(h.group);
    return h;
  }

  return {
    get halfCount() { return halves.length; },

    onSpawn(entity) {
      const m = acquireMesh();
      m.scale.setScalar(entity.radius);
      m.material.color.setHex(PALETTE[entity.colorIndex % PALETTE.length]);
      m.material.opacity = 1;
      m.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
      meshes.set(entity.id, m);
    },

    onRemove(entity) {
      const m = meshes.get(entity.id);
      if (!m) return;
      meshes.delete(entity.id);
      scene.remove(m);
      meshPool.push(m);
    },

    /** Tworzy dwie polowki zorientowane do kierunku swipe'a. */
    onSlice(entity, dirX, dirY, tuning, rng) {
      cutBasis(dirX, dirY, _cut, _normal);
      _q.setFromUnitVectors(AXIS_Z, _normal);
      const hex = PALETTE[entity.colorIndex % PALETTE.length];

      for (const side of [1, -1]) {
        const h = acquireHalf(side);
        h.group.position.set(entity.pos.x, entity.pos.y, entity.pos.z);
        h.group.quaternion.copy(_q);
        h.group.scale.setScalar(entity.radius);

        h.skin.material.color.setHex(hex);
        h.skin.material.opacity = 1;

        h.cap.material.color.setHex(hex);
        h.cap.material.color.lerp(WHITE, FLESH_MIX);
        // Plaska scianka przekroju potrafi byc odwrocona od wszystkich swiatel
        // i wtedy renderuje sie niemal czarna. Wlasna emisja gwarantuje, ze
        // miazsz zawsze sie odcina — a to jest glowny sygnal zwrotny
        // "ciecie sie udalo".
        h.cap.material.emissive.copy(h.cap.material.color).multiplyScalar(0.55);
        h.cap.material.opacity = 1;

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

    /** Synchronizuje pozycje siatek ze stanem rdzenia. */
    sync(entities) {
      for (const e of entities.values()) {
        const m = meshes.get(e.id);
        if (!m) continue;
        m.position.set(e.pos.x, e.pos.y, e.pos.z);
        m.rotation.set(e.rot.x, e.rot.y, e.rot.z);
      }
    },

    /** Polowki zyja poza rdzeniem — sa czysto wizualne i nie wplywaja na gre. */
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
      for (const m of meshes.values()) { scene.remove(m); meshPool.push(m); }
      meshes.clear();
      for (const h of halves) { scene.remove(h.group); halfPool.push(h); }
      halves.length = 0;
    },
  };
}
