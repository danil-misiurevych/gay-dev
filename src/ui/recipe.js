import { PALETTE } from '../render/palette.js';
import { ingredientById } from '../core/ingredients.js';

/**
 * The recipe card: what the customer is asking for right now.
 *
 * Deliberately the simplest thing that works — a box with a line per
 * ingredient. M2 is about finding out whether the "slice the right thing"
 * loop is interesting at all, and a designed card comes in M4 once that
 * question has an answer (docs/ROADMAP.md, docs/UI-SPEC.md).
 *
 * Two readability rules are worth keeping even in this throwaway version:
 * each line carries the ingredient's SHAPE as a small glyph, not only its
 * name, because shape is what the player tracks in flight; and the progress
 * is shown as done/need, so what is still missing is readable at a glance.
 */
export function createRecipeCard(root) {
  let current = null;
  let timerOn = true;
  let bonus = 0;
  let bonusEl = null;
  let bar = null;
  let clock = null;
  let lastShown = -1;

  /** One small 2D glyph per 3D shape. No assets: a div and a border. */
  function glyph(type) {
    const el = document.createElement('span');
    el.className = `g g-${type.shape}`;
    const hex = `#${PALETTE[type.colorIndex % PALETTE.length].toString(16).padStart(6, '0')}`;
    if (type.shape === 'cone') el.style.borderBottomColor = hex;
    else el.style.background = hex;
    return el;
  }

  function render(recipe) {
    root.textContent = '';
    if (!recipe) return;

    const head = document.createElement('div');
    head.className = 'r-head';

    const title = document.createElement('span');
    // The value is shown up front because it is what the player is risking:
    // filling the recipe pays it and running out of time costs the same.
    title.textContent = `Recipe · ${recipe.value}`;

    // Next to it, what the extra cutting has been worth so far. It counts
    // cuts of PIECES only — never the first cut of an object and never the
    // recipe reward — so the two numbers never describe the same points.
    bonusEl = document.createElement('span');
    bonusEl.className = 'r-bonus';

    clock = document.createElement('span');
    clock.className = 'r-clock';

    head.append(title, bonusEl, clock);
    root.append(head);

    for (const item of recipe.items) {
      const type = ingredientById(item.typeId);
      const row = document.createElement('div');
      row.className = 'r-row' + (item.done >= item.need ? ' done' : '');
      if (type) row.append(glyph(type));

      const name = document.createElement('span');
      name.className = 'r-name';
      name.textContent = item.name;

      const count = document.createElement('span');
      count.className = 'r-count';
      count.textContent = `${item.done}/${item.need}`;

      row.append(name, count);
      root.append(row);
    }

    const track = document.createElement('div');
    track.className = 'r-track';
    bar = document.createElement('div');
    bar.className = 'r-bar';
    track.append(bar);
    root.append(track);

    lastShown = -1;
    paintBonus();
    tick(recipe.patience, timerOn);
  }

  function paintBonus() {
    if (!bonusEl) return;
    bonusEl.textContent = `+${bonus}`;
    bonusEl.classList.toggle('zero', bonus === 0);
  }

  /**
   * Called every frame with the seconds left. The bar is updated on every
   * frame because it is the only continuous signal; the digits are only
   * rewritten when the whole second changes, since touching textContent
   * every frame is a layout cost for something the eye cannot read anyway.
   */
  function tick(remaining, enabled = true) {
    if (!current || !bar) return;

    // With the timer off the clock and the bar are hidden rather than frozen:
    // a bar standing still still reads as a deadline, and the whole point of
    // the switch is to play a version that has none.
    root.classList.toggle('no-timer', !enabled);
    if (!enabled) {
      root.classList.remove('urgent');
      lastShown = -1;
      return;
    }

    const left = Math.max(0, remaining);
    bar.style.transform = `scaleX(${(left / current.patience).toFixed(4)})`;

    const whole = Math.ceil(left);
    if (whole !== lastShown) {
      lastShown = whole;
      clock.textContent = `${whole}s`;
      // The last few seconds get their own color: the player is watching the
      // ingredients, not the card, and needs the deadline in peripheral vision.
      root.classList.toggle('urgent', left <= 3);
    }
  }

  /** Restarts the CSS animation: without this a second hit in a row does not flash. */
  function flash(cls) {
    root.classList.remove('bad', 'good');
    void root.offsetWidth;
    root.classList.add(cls);
  }

  return {
    /**
     * @param {object} recipe
     * @param {string} result see SLICE_RESULT, or 'new'
     * @param {boolean} timerEnabled
     * @param {number} cutBonus points from extra cuts during this recipe
     */
    update(recipe, result, timerEnabled = timerOn, cutBonus = 0) {
      timerOn = timerEnabled;
      bonus = cutBonus;
      current = recipe;
      render(recipe);
      if (result === 'wrong' || result === 'expired') flash('bad');
      else if (result === 'complete') flash('good');
    },
    tick(remaining, enabled = true) {
      timerOn = enabled;
      tick(remaining, enabled);
    },

    /** Updated on every cut, without rebuilding the card. */
    setCutBonus(value) {
      if (value === bonus) return;
      bonus = value;
      paintBonus();
    },
    get recipe() { return current; },
  };
}
