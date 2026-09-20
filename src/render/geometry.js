import * as THREE from 'three';
import { SHAPES } from '../core/ingredients.js';

/**
 * Geometries are built ONCE at startup and shared by every object. Scaling
 * happens on the mesh (mesh.scale), never by building new geometry — that is
 * how the game loop stays free of geometry allocation, and therefore free of
 * garbage collector hitches.
 *
 * Every shape provides the same set of five solids, in one convention:
 *
 *   full   — the whole object, at radius 1,
 *   halfA  — the z >= 0 half,   halfB — the z <= 0 half,
 *   capA   — cut face of halfA (normal -Z),
 *   capB   — cut face of halfB (normal +Z).
 *
 * So the cut plane is always the same — z = 0, normal along Z — regardless
 * of shape. The view layer rotates the whole half so that its local +Z lines
 * up with the computed cut normal, and that single mechanism covers every
 * solid. Adding a fourth shape means adding one entry below, with no change
 * to entity-view.js.
 *
 * For a sphere the split is free: SphereGeometry(phiStart, phiLength) cuts it
 * along the XY plane. For a cone it is equally free but along a different
 * axis — ConeGeometry(thetaStart, thetaLength) cuts along x = 0 — so the
 * finished half is rotated -90 degrees around Y to bring it into the same
 * convention. For a cube a half is simply a flatter box.
 */
const SEG_W = 14;
const SEG_H = 10;

/** Cut face offset from the z = 0 plane, so it does not z-fight the solid's own face. */
const CAP_EPS = 0.004;

/** Cone: base radius and height chosen so the silhouette stays inside the hitbox. */
const CONE_R = 0.85;
const CONE_H = 1.8;

/** Cube: edge length chosen so it reads about as large as an orb in flight. */
const CUBE = 1.5;

function coneCap() {
  const shape = new THREE.Shape();
  shape.moveTo(-CONE_R, -CONE_H / 2);
  shape.lineTo(CONE_R, -CONE_H / 2);
  shape.lineTo(0, CONE_H / 2);
  return new THREE.ShapeGeometry(shape);   // lies in the XY plane, normal +Z
}

function buildShape(name) {
  switch (name) {
    case 'sphere':
      return {
        full: new THREE.SphereGeometry(1, SEG_W, SEG_H),
        halfA: new THREE.SphereGeometry(1, SEG_W, SEG_H, 0, Math.PI),
        halfB: new THREE.SphereGeometry(1, SEG_W, SEG_H, Math.PI, Math.PI),
        capA: new THREE.CircleGeometry(1, SEG_W),
        capB: new THREE.CircleGeometry(1, SEG_W),
      };

    case 'box':
      return {
        full: new THREE.BoxGeometry(CUBE, CUBE, CUBE),
        halfA: new THREE.BoxGeometry(CUBE, CUBE, CUBE / 2).translate(0, 0, CUBE / 4),
        halfB: new THREE.BoxGeometry(CUBE, CUBE, CUBE / 2).translate(0, 0, -CUBE / 4),
        capA: new THREE.PlaneGeometry(CUBE, CUBE),
        capB: new THREE.PlaneGeometry(CUBE, CUBE),
      };

    case 'cone':
      return {
        full: new THREE.ConeGeometry(CONE_R, CONE_H, SEG_W, 1),
        halfA: new THREE.ConeGeometry(CONE_R, CONE_H, SEG_W, 1, false, 0, Math.PI).rotateY(-Math.PI / 2),
        halfB: new THREE.ConeGeometry(CONE_R, CONE_H, SEG_W, 1, false, Math.PI, Math.PI).rotateY(-Math.PI / 2),
        capA: coneCap(),
        capB: coneCap(),
      };

    default:
      throw new Error(`render/geometry.js: no solid defined for shape "${name}"`);
  }
}

/** @type {Record<string, { full, halfA, halfB, capA, capB }>} */
export const SHAPE_GEO = {};
for (const name of SHAPES) {
  const geo = buildShape(name);
  geo.capA.rotateX(Math.PI).translate(0, 0, -CAP_EPS);
  geo.capB.translate(0, 0, CAP_EPS);
  SHAPE_GEO[name] = geo;
}

export const AXIS_Z = new THREE.Vector3(0, 0, 1);
export const WHITE = new THREE.Color(0xffffff);

export function skinMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.52, metalness: 0.06,
    flatShading: true, transparent: true,
  });
}

export function fleshMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.85, metalness: 0, transparent: true,
    side: THREE.DoubleSide,
  });
}
