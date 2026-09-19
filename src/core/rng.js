/**
 * Deterministyczny generator liczb pseudolosowych (mulberry32).
 *
 * Po co, skoro jest Math.random(): testy rdzenia musza byc powtarzalne,
 * a przy zglaszaniu buga chcemy moc odtworzyc dokladnie ten sam przebieg
 * rozgrywki z ziarna. Ziarno trafia do logow przy crashu.
 */
export function createRng(seed = Date.now() >>> 0) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    seed,
    next,
    /** Liczba zmiennoprzecinkowa z przedzialu [min, max). */
    range: (min, max) => min + next() * (max - min),
    /** Liczba calkowita z przedzialu [min, max]. */
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}
