# Interface specification

A document for the UX/UI person and their agent. The 2D layer of the game is
entirely yours — HUD, screens, onboarding, microcopy.

## Where it lives in the code

```
src/styles.css        tokens and the whole visual layer
index.html            HUD structure
src/ui/hud.js         writing values into the counters (not their looks)
src/ui/overlay.js     blade trail, cut flash, score popups
src/ui/tuning-panel.js the tuning panel (a team tool, not part of the game)
```

Changing how the HUD looks is a change in `styles.css` and `index.html`. You do
not have to touch JavaScript.

## Tokens

Defined in `:root` in `src/styles.css`. The game is **deliberately
single-theme** — a dark screen, no light variant. The reason is a gameplay
one: the contrast of flying objects against the background is part of
readability, not decoration.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#070912` | background, the darkest point |
| `--ink` | `#ECEAFF` | primary text |
| `--dim` | `#8B89A9` | labels, secondary text |
| `--amber` | `#F2A93B` | primary accent, points, numeric values |
| `--violet` | `#9D7CFF` | secondary accent, combos, borders |
| `--teal` | `#4FD1C5` | technical data, hitbox preview |
| `--bad` | `#FF6B6B` | error, a miss |

Typefaces: **Chakra Petch** (interface) and **Azeret Mono** (numbers). The
files are local, in `src/fonts/`, `woff2` only, `latin` and `latin-ext`
subsets. The `latin-ext` subsets were required by the Polish interface
(D-007); now that the interface is in English, dropping them is worth
considering — but that is a team decision, recorded in `DECISIONS.md`, not a
cleanup.

Numbers that change carry `font-variant-numeric: tabular-nums`. Without it the
score counter jitters on every digit change.

## Rules that follow from this being a phone game

**1. The interface must not cover the playfield.** Below 620 px the buttons
move to the bottom-right corner. The top of the screen is counters and nothing
else — objects fly through the middle.

**2. Everything clickable is at least 36 px tall.** The player holds the phone
in one hand and aims with a thumb.

**3. `touch-action: none` on the playfield.** Without it the browser captures
a vertical swipe as page scrolling and slicing upwards stops working. This is
not a detail — it breaks the controls completely.

**4. Safe area.** Insets for the notch and the gesture bar are handled with
`env(safe-area-inset-*)`. An element pinned to an edge must add that margin to
its own padding rather than setting `0`.

**5. Feedback has to be immediate and visible peripherally.** The player is
looking at the object, not at the counter. That is why points appear **at the
place of the cut**, not only in the HUD.

## Microcopy

English, impersonal or second person, no exclamation marks. Buttons say what
will happen ("Pause", "Close"), not the name of a state.

The start message is one sentence and disappears after the first touch —
onboarding in this game is one sentence, because there is one mechanic.

## To be designed

The order follows from [`ROADMAP.md`](ROADMAP.md):

1. **The order card** — the most important interface element in the whole
   game. It has to show the required ingredients and the time running out in a
   way that can be read out of the corner of an eye, mid-cut. This is a real
   design problem, not an ornament.
2. **The customer at the bar** — states of waiting, satisfaction, impatience.
3. **End-of-round screen** — the result, an invitation to replay, a place for
   a rewarded ad.
4. **Start screen** — required by the platforms: sound may only be enabled
   after a user gesture.

Before you start designing the order card, read `GDD.md` — the shape of the
order data decides what can be shown at all.

## Accessibility

This is not a formality in a game built on color: some players cannot tell red
from green. Hence the rule in `ART-SPEC.md` about differentiating by
**brightness**, not hue. It applies to the interface just the same — the
"succeeded" and "failed" states must not differ by color alone.

Keyboard focus has a visible state (`:focus-visible`). Animations respect
`prefers-reduced-motion`.
