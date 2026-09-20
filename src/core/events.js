/**
 * The simplest possible event emitter. The game core publishes events and
 * the render and UI layers subscribe to them, which is what keeps the core
 * from ever reaching for anything visual.
 */
export function createEmitter() {
  const map = new Map();
  return {
    on(name, fn) {
      if (!map.has(name)) map.set(name, new Set());
      map.get(name).add(fn);
      return () => map.get(name).delete(fn);
    },
    emit(name, payload) {
      const set = map.get(name);
      if (!set) return;
      for (const fn of set) fn(payload);
    },
    clear() { map.clear(); },
  };
}
