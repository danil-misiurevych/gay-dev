import * as THREE from 'three';
import { CAMERA_FOV } from '../core/bounds.js';

/** Quality levels = upper cap on the device pixel ratio. See docs/ARCHITECTURE.md. */
export const QUALITY = { high: 2, medium: 1.5, low: 1 };

/**
 * Scene, camera, lights and screen projection.
 *
 * Lights: two directional plus one hemisphere, zero point lights. The reason
 * is performance — the cost of MeshStandardMaterial grows linearly with the
 * number of lights and is paid per fragment, which on a phone GPU is one of
 * the most expensive parts of a frame. Directional lights also behave
 * identically regardless of the Three.js lighting model, so updating the
 * library does not mean retuning the scene.
 */
export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: (globalThis.devicePixelRatio || 1) < 2,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 120);

  scene.add(new THREE.HemisphereLight(0xbfc8ff, 0x2a1c3a, 0.9));
  const key = new THREE.DirectionalLight(0xfff0d8, 2.2);
  key.position.set(4, 7, 9);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9d7cff, 0.9);
  fill.position.set(-6, -3, 5);
  scene.add(fill);

  let qualityCap = QUALITY.high;
  const view = { w: 1, h: 1 };
  const camRight = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  function refreshBasis() {
    camera.getWorldDirection(camDir);
    camRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    camUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  }

  function resize(w, h, bounds) {
    view.w = w;
    view.h = h;
    camera.aspect = bounds.aspect;
    camera.position.set(0, 0, bounds.cameraZ);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    refreshBasis();

    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, qualityCap));
    renderer.setSize(w, h, false);
  }

  function toScreen(vec, out) {
    tmp.copy(vec).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * view.w;
    out.y = (-tmp.y * 0.5 + 0.5) * view.h;
    return out;
  }

  const _a = { x: 0, y: 0 };
  const _b = { x: 0, y: 0 };

  /**
   * Projects a core object onto the screen. This is the function injected
   * into the core — the only channel through which slice logic learns
   * anything about the camera.
   */
  function project(entity) {
    tmp.set(entity.pos.x, entity.pos.y, entity.pos.z);
    toScreen(tmp, _a);
    tmp.set(
      entity.pos.x + camRight.x * entity.radius,
      entity.pos.y + camRight.y * entity.radius,
      entity.pos.z + camRight.z * entity.radius,
    );
    toScreen(tmp, _b);
    return { x: _a.x, y: _a.y, r: Math.hypot(_b.x - _a.x, _b.y - _a.y) };
  }

  /**
   * Turns the finger movement direction (px) into a cut plane in the world.
   * The plane contains the swipe direction and the camera view direction;
   * its normal is the axis along which the halves fly apart.
   */
  function cutBasis(dirX, dirY, outCut, outNormal) {
    outCut.set(0, 0, 0)
      .addScaledVector(camRight, dirX)
      .addScaledVector(camUp, -dirY);
    if (outCut.lengthSq() < 1e-6) outCut.copy(camRight);
    outCut.normalize();
    outNormal.crossVectors(outCut, camDir).normalize();
  }

  const _n = new THREE.Vector3();
  const _c = new THREE.Vector3();

  /**
   * The cut normal as plain numbers, for the core.
   *
   * The core decides how the pieces fly apart, and to do that it needs the
   * cut plane in world space — but it must not learn what a camera is. So it
   * is handed this function, exactly like `project`. Plain {x, y, z} rather
   * than a THREE.Vector3, so nothing from Three.js crosses into src/core/.
   */
  function cutNormal(dirX, dirY) {
    cutBasis(dirX, dirY, _c, _n);
    return { x: _n.x, y: _n.y, z: _n.z };
  }

  return {
    renderer, scene, camera, view,
    resize, project, cutBasis, cutNormal,
    setQuality(level) {
      qualityCap = QUALITY[level] ?? QUALITY.high;
      renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, qualityCap));
    },
    render() { renderer.render(scene, camera); },
  };
}
