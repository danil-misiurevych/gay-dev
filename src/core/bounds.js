/**
 * World bounds derived from the screen aspect ratio.
 *
 * Design assumption: the game has to look the same on a phone in portrait
 * (aspect ~0.46) and on a desktop (aspect ~1.8). Instead of a fixed camera
 * distance we keep a fixed minimum visible WIDTH of the world and pull the
 * camera back far enough to fit it. Without that, the playfield turns into
 * a narrow chimney on a phone and objects fly off screen.
 */
export const MIN_HALF_HEIGHT = 6;
export const MIN_HALF_WIDTH = 5.2;
export const CAMERA_FOV = 50;

export function computeBounds(aspect) {
  const a = Math.max(aspect, 0.001);
  const halfH = Math.max(MIN_HALF_HEIGHT, MIN_HALF_WIDTH / a);
  const halfW = halfH * a;
  return {
    aspect: a,
    halfW,
    halfH,
    /** Below this Y an object counts as missed. */
    killY: -halfH - 2.2,
    /** Camera distance from the z = 0 plane for the bounds above. */
    cameraZ: halfH / Math.tan((CAMERA_FOV / 2) * Math.PI / 180),
  };
}
