/**
 * Punktacja i combo.
 *
 * Combo liczy sie w obrebie JEDNEGO ciaglego pociagniecia, nie w oknie
 * czasowym. To swiadoma decyzja: okno czasowe nagradza mlocenie palcem
 * na oslep, a ciaglosc pociagniecia nagradza celowanie w kilka obiektow
 * jednym ruchem — czyli umiejetnosc, ktora chcemy premiowac.
 */
export function createScoring({ tuning }) {
  let score = 0;
  let strokeCount = 0;
  let bestCombo = 0;
  let misses = 0;

  return {
    get score() { return score; },
    get bestCombo() { return bestCombo; },
    get misses() { return misses; },
    get strokeCount() { return strokeCount; },

    beginStroke() { strokeCount = 0; },
    endStroke() { strokeCount = 0; },

    /** Rejestruje ciecie i zwraca liczbe przyznanych punktow. */
    registerSlice() {
      strokeCount += 1;
      const gain = tuning.scoreBase + (strokeCount - 1) * tuning.comboBonus;
      score += gain;
      if (strokeCount > bestCombo) bestCombo = strokeCount;
      return { gain, combo: strokeCount };
    },

    registerMiss() { misses += 1; return misses; },

    reset() { score = 0; strokeCount = 0; bestCombo = 0; misses = 0; },
  };
}
