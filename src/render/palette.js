/**
 * The ingredient palette. A color index is what the game core stores — the
 * core knows nothing about hex values, so swapping the palette never touches
 * game logic.
 *
 * This file is owned by the art person. The rule for picking colors: they
 * must differ in BRIGHTNESS, not only in hue — an object crosses a dark
 * background for a fraction of a second and is read by contrast, not by a
 * subtlety of shade.
 */
export const PALETTE = [
  0xf2a93b, // amber
  0x9d7cff, // violet
  0x4fd1c5, // teal
  0xff7a9c, // pink
  0xb6e36b, // lime
  0x63b3ed, // sky
  // Index 6 is the decoys' grey. It is deliberately the only colorless entry:
  // "this one is not an ingredient" has to be readable in the fraction of a
  // second an object is on screen, and the absence of color reads faster than
  // any hue would. Keep it mid-brightness — a decoy that is darker than the
  // background stops being a fair thing to avoid.
  0x8b8fa3, // ash
];

/** Cut face color: a lightened version of the skin color. */
export const FLESH_MIX = 0.6;
