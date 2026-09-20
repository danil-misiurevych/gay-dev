# Plan of work

The order is not accidental and matters more than the contents of any
individual item.

## Why this order

The team's natural instinct will be to refine the slicing — because it is
satisfying, the effect is immediate and everybody has an idea for it. The risk
is concrete: **in three weeks you can have excellent slicing and zero orders,
i.e. an excellent clone.** Playgama rejected the team's previous project for
resembling the catalogue.

That is why the orders layer is built before any polishing. Ugly, with no
graphics, in the current prototype. Only if it turns out to be interesting is
it worth investing four people's work into it.

## M1 — foundation *(done)*

- Slicing mechanic, ballistics, scoring with combos.
- Split between core and rendering, tests without a browser.
- On-device parameter tuning panel.
- Build, CI, publishing to GitHub Pages, bundle size budget.

## M2 — orders layer *(next, absolute priority)*

Goal: find out whether the loop "the customer wants X, slice X, do not slice Y"
is interesting at all. **No graphics, no effects, no sound.**

- Ingredient types — for now told apart by color from the existing palette.
  *(Implemented as a catalog with primitive shapes as well — see D-009,
  pending team confirmation.)*
- `src/core/orders.js`: an order (1–2 ingredients), patience, fulfilment.
- A penalty for slicing the wrong ingredient.
- The simplest possible display of an order in the HUD — text is enough.
- Settle the open question from `GDD.md`: whether letting the right ingredient
  through is also penalised.

**Gate:** the whole team plays and answers one question — do they want to play
again. If not, we go back to the concept, not to polishing.

## M3 — platform

- Playgama SDK integration (`src/platform/playgama.js`) from the current
  documentation.
- A start screen with a user gesture (required by autoplay policy for sound).
- Interstitial between rounds, rewarded for continuing.
- Storing the best score.
- Verifying the bundle size against the platform limits.

## M4 — graphics and presentation

Only here, deliberately.

- Ingredient models per [`ART-SPEC.md`](ART-SPEC.md).
- Order card and customer per [`UI-SPEC.md`](UI-SPEC.md).
- Bar background.
- Sound.

## M5 — progression and release

- Rising difficulty, distractors, bombs.
- Tuning the difficulty curve on live sessions.
- YouTube Playables as the second platform.

## Working rhythm

A weekly loop, fitted to everyone working on personal limits:

```
concept in writing → approval → implementation → everyone plays the link → conclusions into DECISIONS.md
```

The review surface is the working game behind the published link, not
screenshots and not descriptions.
