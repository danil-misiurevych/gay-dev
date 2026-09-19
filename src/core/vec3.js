/**
 * Minimalne operacje na wektorach. Rdzen celowo nie uzywa THREE.Vector3 —
 * dzieki temu src/core/ nie zalezy od Three.js i testuje sie w node bez
 * przegladarki. Konwersja na typy Three.js dzieje sie w src/render/.
 */
export const v3 = (x = 0, y = 0, z = 0) => ({ x, y, z });
export const set = (o, x, y, z) => { o.x = x; o.y = y; o.z = z; return o; };
export const copy = (o, a) => set(o, a.x, a.y, a.z);
export const addScaled = (o, a, s) => { o.x += a.x * s; o.y += a.y * s; o.z += a.z * s; return o; };
export const scale = (o, s) => { o.x *= s; o.y *= s; o.z *= s; return o; };
export const length = (a) => Math.hypot(a.x, a.y, a.z);
