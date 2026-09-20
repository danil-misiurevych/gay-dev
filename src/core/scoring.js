/**
 * Scoring and combo.
 *
 * A combo counts within ONE continuous stroke, not within a time window.
 * That is a deliberate decision: a time window rewards flailing at the screen,
 * whereas a continuous stroke rewards aiming at several objects in one
 * movement — the skill we actually want to pay for.
 */
export function createScoring({ tuning }) {
  let score = 0;
  let strokeCount = 0;
  let bestCombo = 0;
  let misses = 0;
  let cutBonus = 0;

  return {
    get score() { return score; },
    get bestCombo() { return bestCombo; },
    get misses() { return misses; },
    /**
     * Points earned during the current recipe by cutting PIECES — the extra
     * cuts, never the first cut of a whole object and never a recipe reward.
     *
     * It is a running total for display, not a second payment: those points
     * are already in `score`, awarded cut by cut. It exists so the recipe
     * card can show what the extra cutting has been worth, next to what the
     * recipe itself is worth.
     */
    get cutBonus() { return cutBonus; },
    get strokeCount() { return strokeCount; },

    beginStroke() { strokeCount = 0; },
    endStroke() { strokeCount = 0; },

    /**
     * Registers a slice and returns the points awarded.
     *
     * `points` is the base value of the object that was sliced (see
     * config/ingredients.js). Without an argument it falls back to the global
     * `scoreBase`, so scoring still works for objects with no type.
     * The combo bonus is shared by all types on purpose: we reward the length
     * of the stroke, not whatever happened to be on it.
     */
    registerSlice(points = tuning.scoreBase) {
      strokeCount += 1;
      const gain = points + (strokeCount - 1) * tuning.comboBonus;
      score += gain;
      if (strokeCount > bestCombo) bestCombo = strokeCount;
      return { gain, combo: strokeCount };
    },

    /**
     * Points that do not come from a single slice — filling a recipe, for
     * now. Kept apart from registerSlice so a bonus never advances the combo:
     * the combo pays for the length of a stroke and nothing else.
     */
    addBonus(points) {
      const gain = Math.max(0, Math.round(points || 0));
      score += gain;
      return gain;
    },

    /**
     * Takes points away — a recipe whose timer ran out, for now.
     *
     * The score floors at zero rather than going negative. A negative total
     * in an arcade game reads as a bug to the player and makes the counter
     * meaningless early in a round, when a single lost recipe can outweigh
     * everything earned so far. Returns how much was ACTUALLY removed, so
     * the HUD never shows a penalty larger than the one that was applied.
     */
    applyPenalty(points) {
      const asked = Math.max(0, Math.round(points || 0));
      const taken = Math.min(asked, score);
      score -= taken;
      return taken;
    },

    /** Records that an already-scored cut was an extra one. */
    trackCutBonus(gain) {
      cutBonus += Math.max(0, Math.round(gain || 0));
      return cutBonus;
    },

    /** Called by the core whenever a recipe is drawn. */
    resetCutBonus() { cutBonus = 0; },

    registerMiss() { misses += 1; return misses; },

    reset() { score = 0; strokeCount = 0; bestCombo = 0; misses = 0; cutBonus = 0; },
  };
}
