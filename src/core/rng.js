/**
 * Deterministic pseudo-random number generator (mulberry32).
 *
 * Why not Math.random(): core tests have to be repeatable, and when a bug is
 * reported we want to be able to replay exactly the same run from its seed.
 * The seed goes into the log on a crash.
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
    /** Float in the range [min, max). */
    range: (min, max) => min + next() * (max - min),
    /** Integer in the range [min, max]. */
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}
