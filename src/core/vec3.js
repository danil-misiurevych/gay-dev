/**
 * Minimal vector operations. The core deliberately avoids THREE.Vector3 —
 * that is what keeps src/core/ free of any dependency on Three.js and
 * testable in node without a browser. Conversion to Three.js types happens
 * in src/render/.
 */
export const v3 = (x = 0, y = 0, z = 0) => ({ x, y, z });
export const set = (o, x, y, z) => { o.x = x; o.y = y; o.z = z; return o; };
export const copy = (o, a) => set(o, a.x, a.y, a.z);
export const addScaled = (o, a, s) => { o.x += a.x * s; o.y += a.y * s; o.z += a.z * s; return o; };
export const scale = (o, s) => { o.x *= s; o.y *= s; o.z *= s; return o; };
export const length = (a) => Math.hypot(a.x, a.y, a.z);
