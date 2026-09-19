import * as THREE from 'three';

/**
 * Geometrie tworzone RAZ przy starcie i wspoldzielone przez wszystkie
 * obiekty. Skalowanie robimy na obiekcie (mesh.scale), nie przez tworzenie
 * nowej geometrii — dzieki temu w petli gry nie ma zadnych alokacji
 * geometrii, a wiec nie ma przycinek od garbage collectora.
 *
 * Podzial polowek: SphereGeometry(phiStart, phiLength) dzieli kule
 * plaszczyzna XY. Dla phi w [0, PI] mamy z >= 0, dla [PI, 2PI] — z <= 0.
 * Plaszczyzna ciecia to wiec z = 0, a jej normalna to os Z. Warstwa
 * widoku obraca cala polowke tak, zeby lokalne +Z pokrylo sie z wyliczona
 * normalna ciecia — stad ciecie wyglada, jakby szlo dokladnie wzdluz
 * ruchu palca, mimo ze geometria jest zawsze ta sama.
 */
const SEG_W = 14;
const SEG_H = 10;

export const GEO = {
  full: new THREE.SphereGeometry(1, SEG_W, SEG_H),
  halfA: new THREE.SphereGeometry(1, SEG_W, SEG_H, 0, Math.PI),         // z >= 0
  halfB: new THREE.SphereGeometry(1, SEG_W, SEG_H, Math.PI, Math.PI),   // z <= 0
  capA: new THREE.CircleGeometry(1, SEG_W),                             // normalna -Z (po obrocie)
  capB: new THREE.CircleGeometry(1, SEG_W),                             // normalna +Z
};
GEO.capA.rotateX(Math.PI);

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
  });
}
