/**
 * Najprostszy mozliwy emiter zdarzen. Rdzen gry publikuje zdarzenia,
 * a warstwa renderowania i UI je subskrybuja — dzieki temu rdzen nigdy
 * nie siega do niczego wizualnego.
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
