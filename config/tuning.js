/**
 * GAMEPLAY PARAMETERS — the single source of truth.
 *
 * This file is owned by the gameplay person. Changing a value does NOT
 * require touching game logic and does not require a developer: the in-game
 * tuning panel exports exactly this set of fields, so it is enough to move
 * the numbers here and commit them.
 *
 * It is a JS module rather than JSON for one reason: JSON has no comments,
 * and for feel parameters the comment "what this number does and what
 * happens when you raise it" matters more than the number itself.
 *
 * RANGES are hard limits. The panel and the loading of stored settings clamp
 * every value to them — that is what stops an old save in a tester's
 * localStorage from feeding the game a number the code no longer handles.
 *
 * One group of parameters is GENERATED rather than written out: the score of
 * each ingredient, as `score_<id>`. The ids come from ./ingredients.js, so
 * adding an ingredient there gives it a slider here for free and nothing in
 * this file has to be edited. See the bottom of the file.
 */
import { INGREDIENTS } from './ingredients.js';

export const DEFAULTS = {
  // --- ballistics --------------------------------------------------------
  /** Acceleration in world units per s^2. Higher = faster, sharper flight. */
  gravity: 24,
  /** Apex height as a fraction of half the screen height. 0.42 = slightly above centre. */
  apexRatio: 0.42,
  /** Base gap between launches, in seconds. */
  spawnEvery: 1.05,
  /** Random deviation of the gap as a fraction of the base. 0 = a metronome, and you can feel it. */
  spawnJitter: 0.22,
  /** How many objects fly at once. Above 2 combos get easy — tune together with scoring. */
  perSpawn: 1,
  /**
   * Which ingredients get launched, as a slider between two opposites:
   *
   *   100%  only what the recipe still needs flies,
   *    50%  no influence — everything flies at its catalog frequency,
   *     0%  only what the player must NOT cut flies: the ingredients already
   *         stocked for the recipe, and the ones it never asked for.
   *
   * Everything in between is a blend, and it moves as the recipe fills up —
   * an ingredient thins out gradually as the player stocks it rather than
   * disappearing the moment the last one is cut. The formula is in
   * src/core/spawner.js and in DECISIONS.md, D-018.
   *
   * The default leans towards the recipe without removing the risk: at 100%
   * there is nothing wrong left to cut, which takes the tension the whole
   * orders layer is built on out of the game. Below 50% the game is actively
   * hostile — useful to play once to feel what the bias is doing, not to ship.
   */
  recipeBias: 0.65,

  /**
   * Share of launches that come in from the left or right edge instead of
   * from below. 0 = everything from below, 1 = everything from the sides.
   * Side launches cross the screen, so they stay reachable for less time —
   * raising this makes the game harder without touching any other number.
   */
  sideSpawnRatio: 0.35,

  // --- slice detection ---------------------------------------------------
  /**
   * Swipe speed threshold in px/ms. Below this a movement does not cut.
   * Too low: the game can be won by slowly dragging a finger and loses its
   * tension. Too high: short, precise cuts stop working and the game
   * frustrates. ALWAYS tune in tandem with hitScale.
   */
  minSwipeSpeed: 0.3,
  /**
   * Hitbox radius multiplier in screen space.
   * Below 1 the game feels stiff; above 1.4, hits next to the object start
   * eroding the sense of control — the player cannot tell what they scored for.
   */
  hitScale: 1.15,
  /** How long a blade trail point stays live, in ms. Drives the length of the tail. */
  trailLife: 120,

  // --- slice reaction ----------------------------------------------------
  /** Impulse pushing the halves apart, in units per s. */
  separation: 3.0,
  /** Rotation speed of the halves in rad/s. */
  halfSpin: 6.5,
  /** Particles per slice. The first thing to cut when FPS runs short. */
  burstCount: 16,
  /**
   * Seconds a fresh piece cannot be cut for.
   *
   * Without it the cut is not a cut but a chain reaction: the pieces appear
   * exactly where the pointer already is, the next movement sample of the
   * same swipe catches them, and one flick shreds an object down to the
   * depth limit before the player has seen anything.
   *
   * Too low and the chain reaction comes back. Too high and a deliberate
   * second cut is refused, which reads as the game dropping input — keep it
   * short enough that the pieces have visibly moved apart by the time it
   * ends.
   */
  pieceArmTime: 0.12,

  // --- scoring -----------------------------------------------------------
  /**
   * Points for a single slice of an object with no type. Objects with a type
   * are worth `score_<id>`, generated at the bottom of this file.
   */
  scoreBase: 10,
  /** Bonus for each further object sliced in the same stroke. */
  comboBonus: 5,

  // --- recipes -----------------------------------------------------------
  /**
   * Whether a recipe is on a clock at all.
   *
   * Off, a recipe is a pure checklist: no deadline, no penalty, the player
   * fills it whenever the right ingredients happen to fly by. That is the
   * version to compare against at the M2 gate — the question being tested is
   * whether the time pressure is what makes the loop interesting, and you
   * cannot answer it without playing both.
   *
   * It lives here rather than in config/recipes.js because it is a live
   * switch for the feel, and this is the file the in-game tuning panel reads
   * and exports. What a recipe CONTAINS stays in config/recipes.js.
   */
  recipeTimer: true,

  // --- debug -------------------------------------------------------------
  /** Hitbox preview. Do not commit as true. */
  showHit: false,
};

/** Hard limits for the numeric values: [min, max]. */
export const RANGES = {
  gravity: [1, 80],
  apexRatio: [0.05, 0.95],
  spawnEvery: [0.15, 5],
  spawnJitter: [0, 0.9],
  perSpawn: [1, 8],
  sideSpawnRatio: [0, 1],
  recipeBias: [0, 1],
  minSwipeSpeed: [0, 5],
  hitScale: [0.3, 4],
  trailLife: [20, 600],
  separation: [0, 20],
  halfSpin: [0, 30],
  burstCount: [0, 64],
  pieceArmTime: [0, 1],
  scoreBase: [0, 1000],
  comboBonus: [0, 1000],
};

/** Fields rounded to integers. */
export const INTEGER_KEYS = ['perSpawn', 'burstCount', 'scoreBase', 'comboBonus'];

/* -------------------------------------------------------------------------
 * Per-ingredient scores.
 *
 * The score in config/ingredients.js is the DEFAULT; the live, tunable value
 * lives here under `score_<id>` so the panel can expose it as a slider and
 * export it with everything else.
 *
 * A key that is already present wins, so a block pasted in from the panel's
 * export keeps working — that is the whole point of the export, and silently
 * overwriting it would be the kind of bug nobody finds for a week.
 * ---------------------------------------------------------------------- */

/** The tuning key holding the live score of an ingredient. */
export const scoreKey = (id) => `score_${id}`;

for (const ingredient of INGREDIENTS) {
  const key = scoreKey(ingredient.id);
  if (!(key in DEFAULTS)) DEFAULTS[key] = ingredient.score;
  RANGES[key] = [0, 1000];
  INTEGER_KEYS.push(key);
}
