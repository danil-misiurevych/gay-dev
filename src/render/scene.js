import * as THREE from 'three';
import { CAMERA_FOV } from '../core/bounds.js';

/** Poziomy jakosci = gorny limit device pixel ratio. Patrz docs/ARCHITECTURE.md. */
export const QUALITY = { high: 2, medium: 1.5, low: 1 };

/**
 * Scena, kamera, swiatla i rzutowanie na ekran.
 *
 * Swiatla: dwa kierunkowe plus hemisferyczne, zero punktowych. Powod jest
 * wydajnosciowy — koszt MeshStandardMaterial rosnie liniowo z liczba swiatel
 * i liczy sie per fragment, a na GPU telefonu to jeden z najdrozszych
 * elementow klatki. Swiatla kierunkowe zachowuja sie tez identycznie
 * niezaleznie od modelu oswietlenia Three.js, wiec nie trzeba przestrajac
 * scenu przy aktualizacji biblioteki.
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
   * Rzutuje obiekt rdzenia na ekran. To jest funkcja wstrzykiwana do
   * rdzenia — jedyny kanal, przez ktory logika ciecia dowiaduje sie
   * czegokolwiek o kamerze.
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
   * Zamienia kierunek ruchu palca (px) na plaszczyzne ciecia w swiecie.
   * Plaszczyzna zawiera kierunek swipe'a i kierunek patrzenia kamery;
   * jej normalna jest osia, wzdluz ktorej rozjezdzaja sie polowki.
   */
  function cutBasis(dirX, dirY, outCut, outNormal) {
    outCut.set(0, 0, 0)
      .addScaledVector(camRight, dirX)
      .addScaledVector(camUp, -dirY);
    if (outCut.lengthSq() < 1e-6) outCut.copy(camRight);
    outCut.normalize();
    outNormal.crossVectors(outCut, camDir).normalize();
  }

  return {
    renderer, scene, camera, view,
    resize, project, cutBasis,
    setQuality(level) {
      qualityCap = QUALITY[level] ?? QUALITY.high;
      renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, qualityCap));
    },
    render() { renderer.render(scene, camera); },
  };
}
