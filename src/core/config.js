import { DEFAULTS, RANGES, INTEGER_KEYS } from '../../config/tuning.js';

export { DEFAULTS, RANGES };

/** Swieza kopia wartosci domyslnych. */
export function defaultTuning() {
  return { ...DEFAULTS };
}

/**
 * Scala nadpisania (z panelu strojenia albo z localStorage) z wartosciami
 * domyslnymi i przycina je do zakresow z RANGES.
 *
 * Przycinanie nie jest paranoja: panel zapisuje ustawienia w przegladarce
 * testera, a plik w repo zmienia sie niezaleznie. Bez tego stary zapis
 * z nieaktualnego builda potrafi wpuscic wartosc, ktorej kod juz nie
 * obsluguje — i tester zglasza buga, ktorego nikt inny nie odtworzy.
 *
 * Nieznane klucze sa ignorowane, zeby literowka w JSON-ie nie tworzyla
 * cichego, martwego parametru.
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
