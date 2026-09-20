/**
 * RECIPE SETTINGS — owned by the gameplay person, like tuning.js.
 *
 * A recipe is what a customer orders: a few ingredients, each in a required
 * count, to be filled before the timer runs out. The player fills it by
 * slicing the right things. Slicing anything that is not on the recipe starts
 * that recipe over from zero.
 *
 * These numbers are deliberately kept out of the code: how much a recipe asks
 * for and how long it allows are the two strongest difficulty knobs in M2,
 * and they have to be changeable without a developer.
 *
 * Ingredient types themselves live in ./ingredients.js.
 */
export const RECIPE_CONFIG = {
  /** How many DIFFERENT ingredients one recipe asks for, drawn per recipe. */
  minTypes: 1,
  maxTypes: 3,

  /** How many pieces of a single ingredient a recipe asks for. */
  minPerType: 1,
  maxPerType: 3,

  // --- timer ---------------------------------------------------------------
  /**
   * Whether the timer runs at all is `recipeTimer` in tuning.js — it is a
   * live switch with a checkbox in the tuning panel. The numbers below only
   * decide how long the window is when it is on.
   *
   * Time allowed for a recipe = baseSeconds + secondsPerPiece × pieces.
   *
   * The time scales with the size of the recipe on purpose: a flat window
   * would make a one-piece order trivial and a nine-piece order impossible,
   * and the difficulty would come from the draw rather than from play.
   *
   * Tune against `spawnEvery` in tuning.js — if a required ingredient does
   * not even get launched within the window, the recipe is lost to the dice
   * and not to the player, which reads as unfair.
   */
  baseSeconds: 6,
  secondsPerPiece: 3.5,

  // --- reward and penalty --------------------------------------------------
  /**
   * A recipe is worth the sum of its ingredients: Σ (type score × count).
   * Completing it adds that value, letting the timer run out subtracts it.
   *
   * The multipliers make the two sides tunable independently. Equal values
   * mean a lost recipe costs exactly what a filled one paid — a harsh,
   * symmetric rule; lower the penalty one if playtests say it is too much.
   */
  rewardMultiplier: 1,
  penaltyMultiplier: 1,

  /**
   * Whether cutting anything the recipe does not want loses the recipe.
   *
   * On, a wrong cut costs the same as running out of time: the penalty is
   * taken off the score and a new recipe is drawn. "Wrong" means anything not
   * currently needed — a decoy, an ingredient the order never asked for, or
   * one already stocked.
   *
   * This is the whole tension of the orders layer. Off, a recipe is a
   * checklist the player fills by cutting everything in sight, which is the
   * clone we are trying not to build — see docs/ROADMAP.md, the M2 gate.
   */
  failOnWrong: true,
};
