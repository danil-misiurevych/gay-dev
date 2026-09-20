import { DEFAULTS, RANGES, INTEGER_KEYS } from '../../config/tuning.js';

export { DEFAULTS, RANGES };

/** A fresh copy of the default values. */
export function defaultTuning() {
  return { ...DEFAULTS };
}

/**
 * Merges overrides (from the tuning panel or from localStorage) with the
 * defaults and clamps them to the ranges in RANGES.
 *
 * The clamping is not paranoia: the panel stores settings in a tester's
 * browser while the file in the repo changes independently. Without it, an
 * old save from a stale build can feed in a value the code no longer handles
 * — and the tester reports a bug nobody else can reproduce.
 *
 * Unknown keys are ignored so that a typo in the JSON cannot create a silent,
 * dead parameter.
 */
export function mergeTuning(overrides = {}) {
  const out = defaultTuning();

  for (const [key, value] of Object.entries(overrides)) {
    if (!(key in out)) continue;

    if (typeof out[key] === 'boolean') {
      if (typeof value === 'boolean') out[key] = value;
      continue;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;

    const range = RANGES[key];
    out[key] = range ? Math.min(range[1], Math.max(range[0], value)) : value;
  }

  for (const key of INTEGER_KEYS) {
    if (typeof out[key] === 'number') out[key] = Math.round(out[key]);
  }
  return out;
}
