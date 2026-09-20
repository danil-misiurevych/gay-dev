# Decision log

Every decision somebody could ask "why this way" about. Three lines: date,
decision, rationale. We only append — if a decision changes, add a new entry
that supersedes the old one instead of editing history.

It looks like bureaucracy right up to the moment a third person asks the same
question for the third time. With four agents holding separate memories, this
is the only place where "we already settled that" has any backing.

Format:

```
## D-NNN — title
**Date:** YYYY-MM-DD · **Status:** accepted | superseded by D-XXX
**Decision:** …
**Why:** …
```

---

## D-001 — Slicing via ready-made halves, not by cutting the mesh at run time
**Date:** 2026-09-18 · **Status:** accepted
**Decision:** On a cut we swap the object for two prepared halves and rotate
them so the cut plane lines up with the swipe direction. We do not cut geometry
in real time (CSG).
**Why:** CSG generates geometry inside the game loop, which means allocation
and garbage collector hitches — on a phone, visible exactly at the moment of
the cut. Visually the difference is imperceptible, because the cut angle is
reproduced by the rotation anyway. The performance budget stays available for
object count and effects.

## D-002 — Slice detection in screen space, not by a 3D raycast
**Date:** 2026-09-18 · **Status:** accepted
**Decision:** The test is the pointer movement segment against a circle around
the projected centre of the object, with a speed threshold.
**Why:** The player aims at what they see on screen, so a screen-space test
matches their intent. It is an order of magnitude cheaper than a raycast and
can be tuned with a single number (`hitScale`), which is the main feel knob.

## D-003 — Test with a segment, not a point
**Date:** 2026-09-18 · **Status:** accepted
**Decision:** We check the intersection of the segment between two position
samples, not of the current position.
**Why:** During a fast swipe the finger jumps tens of pixels between frames.
A point test lets through an object sitting on the path of the movement, which
the player experiences as a lost hit. Covered by a test in
`tests/geometry.test.js`.

## D-004 — Game core separated from rendering
**Date:** 2026-09-19 · **Status:** accepted
**Decision:** `src/core/` imports neither Three.js nor the DOM. The camera
reaches the core only through an injected `project()` function.
**Why:** Three concrete gains: testing the full game loop in node without a
browser, swapping models without touching logic, and a second platform without
maintaining two versions of the game.

## D-005 — Bundler and tree-shaking from day one
**Date:** 2026-09-19 · **Status:** accepted
**Decision:** Vite + ES modules, Three.js as an npm dependency rather than
from a CDN.
**Why:** The whole library is about 600 kB uncompressed; after tree-shaking
about 115 kB gzip remains. With hard size limits on HTML5 game platforms that
can be the difference between acceptance and rejection. Adding a bundler later
means rewriting imports across the whole project.

## D-006 — Division of graphics work: 2D with the UI designer, 3D unsettled
**Date:** 2026-09-19 · **Status:** OPEN — needs a team decision
**Decision:** The 2D layer (HUD, screens, icons) belongs to the UX/UI person.
How the 3D models come about is **not settled**: modelling in-house in Blender
or CC0 assets styled with color.
**Why:** Ten years in UX/UI is a different craft from art for a 3D game. On a
zero budget, CC0 plus styling is realistic, but it has to be a decision rather
than a drift. Close it before the first model — the requirements in
`ART-SPEC.md` apply either way.

## D-007 — woff2 only, no woff fallback
**Date:** 2026-09-19 · **Status:** accepted
**Decision:** Fonts are bundled locally, in `woff2` only, `latin` and
`latin-ext` subsets.
**Why:** A `woff` fallback is about 100 kB of dead weight in the bundle, and
browsers without `woff2` support are practically absent from mobile traffic.
`latin-ext` is mandatory — without it Polish characters fall back to a
substitute typeface. *(Note: with the interface translated to English in
D-011, the `latin-ext` requirement is worth revisiting; that needs its own
entry, not a silent cleanup.)*

## D-008 — Orders layer before polishing the slicing
**Date:** 2026-09-19 · **Status:** accepted
**Decision:** Milestone M2 is an ugly, working orders loop. No polishing of
effects, models or sound until the M2 gate is passed.
**Why:** Swipe slicing is a mass-cloned mechanic and does not distinguish the
game on its own — the team's previous project was rejected by Playgama for
resembling the catalogue. Only the orders layer can be the differentiator, so
it has to be verified before four people invest in presentation.

## D-009 — Ingredient types as a catalog: one factory, shape and score per type
**Date:** 2026-09-20 · **Status:** to be confirmed by the team
**Decision:** Ingredient types are records in `config/ingredients.js` (id, name,
shape, color, score, spawn weight, radius range). Every object is built by one
factory, `createEntity({ type })`, and differs only by the type assigned to it.
Slice points come from the type rather than from the global `scoreBase`; the
combo bonus stays shared. The first three types use primitive solids: sphere,
cube, cone.
**Why:** M2 needs distinguishable ingredients, and a catalog is the cheapest way
to make sure adding a fourth one touches neither the core nor the render layer.
**Deviation from ROADMAP.md (M2 says "distinguished by color alone"):** shape
reads faster than color for an object crossing a small screen in a fraction of a
second, and it is not art work — it is `BoxGeometry` and `ConeGeometry`, zero
assets, zero art time. D-008 still holds: these are not models, only stand-in
solids until M4. If the team considers this jumping ahead of the M2 gate,
reverting to color alone means changing one `shape` field in three catalog
entries.

## D-010 — Halves for solids other than the sphere
**Date:** 2026-09-20 · **Status:** accepted
**Decision:** Every shape provides the same set of five solids in one convention
(`full`, `halfA` z ≥ 0, `halfB` z ≤ 0, `capA`, `capB`), built once at startup.
A cone splits along its `theta` parameter, so the finished half is rotated −90°
around Y to bring it into the same convention as the sphere.
**Why:** The slicing mechanism rotates a half so its local `+Z` lines up with the
cut normal (D-001). Keeping one convention for every solid means
`entity-view.js` carries no per-shape `if`, and adding a fourth solid is one
entry in `render/geometry.js`.
**Known limitation:** halves are always placed perpendicular to the finger
movement, so for the cube and the cone they lose the object's own in-flight
rotation — there is a visible orientation "pop" at the moment of the cut. The
alternative is run-time mesh cutting, rejected in D-001. To be judged on the
live prototype at the M2 gate.

## D-011 — Repository language: English
**Date:** 2026-09-20 · **Status:** accepted (owner's decision)
**Decision:** The whole repository is in English: documentation, code
comments, test names and the player-facing interface strings. Polish is not
used any more.
**Why:** Requested by the project owner. Recorded because it touches every
file and because the next person to open a Polish-language commit from before
this date should know it is history, not a style to keep.
**Consequence to settle:** the `latin-ext` font subsets (D-007) were sized for
Polish characters and may now be dead weight in the bundle.

## D-012 — Recipes: the first working version of the orders layer
**Date:** 2026-09-20 · **Status:** to be confirmed by the team
**Decision:** `src/core/orders.js` now implements recipes: a recipe asks for
1–3 different ingredients with a count each, slicing a required ingredient
advances it, slicing anything else wipes the progress and the recipe restarts,
and completing one awards `completionBonus` and draws the next. Settings live
in `config/recipes.js`, owned by the gameplay person. The HUD shows the recipe
as a plain box with one line per ingredient (`src/ui/recipe.js`).
**Why:** This is the M2 milestone and the whole point of the project —
verifying whether "the customer wants X, slice X, do not slice Y" is
interesting at all. Built ugly and early per D-008.
**Deliberate omissions, so they do not look like oversights:**
- an ingredient that is already fully stocked counts as wrong, so the player
  has to track what is still missing rather than what is merely listed,
- a wrong slice still scores its own points; the penalty is the lost recipe
  progress. Whether that is punishment enough is a question for the M2 gate.
*(Superseded in part by D-013, which adds the timer, and by D-021, which makes
a wrong cut lose the whole recipe.)*

## D-013 — A recipe is worth its ingredients, and it is on a clock
**Date:** 2026-09-20 · **Status:** to be confirmed by the team
**Decision:** Every recipe carries a value: the sum of (ingredient score ×
count required). Filling it adds that value to the score; letting its timer
run out subtracts the same value and draws a new recipe. Both sides have their
own multiplier in `config/recipes.js`, at 1 by default. The time allowed is
`baseSeconds + secondsPerPiece × pieces`.
**Why:** Points for a slice made the ingredients matter individually, but
nothing made the ORDER matter — without a deadline, a recipe could be filled
eventually by slicing everything in sight, which is the clone we are trying
not to build. A symmetric reward and penalty means the decision "is this piece
worth cutting" has a cost on both sides, which is the loop M2 has to test.
**Why the time scales with the size:** a flat window would make a one-piece
order trivial and a nine-piece order impossible, so the difficulty would come
from the draw rather than from play.
**Deliberate details:**
- the score floors at zero instead of going negative; a negative total reads
  as a bug to the player and makes the counter meaningless early in a round,
- a wrong slice does not also take time away — the punishment is the lost
  progress, otherwise one misjudged swipe decides the whole recipe,
- the timer does not restart on a wrong slice, for the same reason.
**Switchable:** `recipeTimer` in `config/tuning.js`, with a checkbox in the
tuning panel, turns the clock off entirely — a recipe then becomes a pure
checklist with no deadline and no penalty. It exists so the M2 gate can be
played both ways: the question being tested is whether the time pressure is
what makes the loop interesting, and that cannot be answered without the
comparison. With the timer off the elapsed time stops accumulating rather
than resetting, so flipping it back on continues the window.
**To check at the M2 gate:** whether the full penalty is too harsh, and
whether `secondsPerPiece` leaves enough room given `spawnEvery` — if a
required ingredient is never even launched inside the window, the recipe is
lost to the dice and that reads as unfair.

## D-014 — Objects also enter from the sides
**Date:** 2026-09-20 · **Status:** to be confirmed by the team
**Decision:** A share of launches, `sideSpawnRatio` in `config/tuning.js`
(0.35 by default), enters from the left or right edge and crosses the screen
instead of rising from below. Side launches start outside the visible area,
below the middle, and are aimed past the centre. They use the same apex as a
launch from below.
**Why:** With one entry edge the player's attention has one resting place, and
with the recipes in play they can simply wait at the bottom of the screen for
the right ingredient. A second and third edge make position part of the
decision, at the cost of one number rather than of new mechanics.
**Why the same apex:** the apex is the parameter the gameplay person tunes; if
it differed per edge, the two kinds of launch would feel like different games
and `apexRatio` would stop meaning anything.

## D-015 — Pieces are real objects, and they can be cut again
**Date:** 2026-09-20 · **Status:** to be confirmed by the team
**Decision:** A cut object falls into two pieces that the core simulates like
anything else: they have a hitbox, ballistics and a score, and they can be cut
in turn. How deep it goes is decided by the multiplier table in
`config/slicing.js` — `[1, 1.2, 1.5, 2]` means four levels, and each cut pays
the ingredient's score times the multiplier for the depth of the piece that
was cut. What is left after the last allowed cut is visual debris, handled by
the render layer as before.
**Why it reverses part of the old design:** halves used to live entirely in
`render/entity-view.js` — purely visual, invisible to the core. That is a good
arrangement right up to the moment the player is allowed to hit them, because
anything hittable needs a hitbox, physics and a score, and all three live in
the core. D-001 is untouched: we still swap in ready-made geometry rather than
cutting meshes at run time.
**The rules that keep it from breaking the game, and why:**
- **A piece never advances a recipe.** Otherwise one orb would fill an order
  for three of them by being cut three times, and the orders layer is the
  point of the project (D-008).
- **A piece never counts as a miss.** Pieces fall off screen constantly and by
  design; counting them would turn the miss counter into a measure of how much
  the player cut.
- **A fresh piece cannot be cut for `pieceArmTime` seconds** (`tuning.js`,
  0.12 by default). Reported from play: the pieces appear exactly where the
  pointer already is, so the next movement sample of the same swipe caught
  them and one flick shredded an object to the depth limit instantly. Measured
  on a swipe held in place: 30 cuts before, 1 within the first tenth of a
  second after.
**Known visual approximation:** a quarter is drawn as a smaller half, because
there is no quarter geometry and there will not be run-time mesh cutting. At
the size and speed a piece travels this is not visible, but it is a lie and
should be written down as one.
**To check at the M2 gate:** whether deep cutting competes with the orders
layer for the player's attention. It pays well and asks for no thought about
which ingredient is which — if it turns out to be the more rewarding game,
the multipliers come down.

## D-016 — Ingredient scores are live tuning values
**Date:** 2026-09-20 · **Status:** accepted
**Decision:** The score of each ingredient is a tuning parameter, `score_<id>`,
with its own slider in the panel. The keys are generated from the catalog, so
adding an ingredient to `config/ingredients.js` gives it a slider and nothing
in `config/tuning.js` or in the panel is edited by hand. The score in the
catalog is the DEFAULT; `scoreOf(type, tuning)` is the only thing allowed to
answer what a piece is worth.
**Why:** Scoring is the knob that decides whether deep cutting competes with
the orders layer (D-015), and it cannot be tuned by the person who owns the
feel if it needs a commit and a rebuild to change.
**Detail worth knowing:** a recipe takes its ingredient scores at the moment
it is drawn, so retuning mid-round never changes the price of the order
already on the counter. A key already present in DEFAULTS wins over the
generated one, so a block pasted in from the panel's export keeps working.

## D-017 — The recipe card shows what the extra cutting paid
**Date:** 2026-09-20 · **Status:** to be confirmed by the team
**Decision:** Next to a recipe's value the card shows a second number: the
points earned during that recipe by cutting PIECES — never the first cut of an
object, never a recipe reward. It resets whenever a recipe is drawn.
**Why:** The two ways to earn are now in tension by design (D-015), and the
player cannot judge that tension without seeing both numbers side by side.
It is also the number to watch at the M2 gate: if it dwarfs the recipe value
in normal play, the multipliers are too generous.
**Not a second payment:** those points are already in the score, awarded cut
by cut. The counter is a running total for display, which is why it lives in
the scoring module and not in the orders layer.

## D-018 — Launches lean towards what the recipe still needs
**Date:** 2026-09-20 · **Status:** superseded by D-019
**Decision:** The spawner scales each ingredient's catalog weight by

    1 - recipeBias x progress

where `progress` is how much of that ingredient the current recipe already
has (0..1) and `recipeBias` is a tuning parameter with a slider, 0.5 by
default. Ingredients the recipe never asked for are left at their catalog
weight at any setting. If the bias were ever to silence everything, the draw
falls back to the plain catalog weights.
**Why progressive rather than a switch:** an ingredient gets gradually rarer
as the player stocks it, instead of vanishing the moment the last one is cut.
A cliff would be visible as the flow changing character mid-recipe, and it
would make the last ingredient of an order feel scripted.
**Why it is needed at all:** with uniform weights an order can be lost waiting
for one rare ingredient that simply never launches inside the window — the
recipe is then lost to the dice rather than to the player, which reads as
unfair (the risk already flagged in D-013).
**Measured at the default 0.5,** on a recipe asking for four of an ingredient:
244 launches of it while none are stocked, 204 at one, 160 at two, 98 at
three. At strength 1 a fully stocked ingredient stops appearing entirely,
which also removes the chance to make the mistake of cutting it — an extreme
worth playing once, not a default.
**To check at the M2 gate:** whether the bias makes orders too easy to fill.
It works against the tension D-012 is built on, and the two have to be tuned
against each other, not separately.

## D-019 — The recipe bias is a slider between two opposites
**Date:** 2026-09-20 · **Status:** to be confirmed by the team · supersedes D-018
**Decision:** `recipeBias` no longer means "strength of a lean"; it selects
what gets launched, between two ends:

    wanted   = (need - done) / need        1 = asked for, none cut yet
    unwanted = 1 - wanted                  1 = stocked, or never asked for
    weight   = catalog weight x (2 x bias x wanted + 2 x (1 - bias) x unwanted)

    100%  only what the recipe still needs is launched
     50%  no influence at all — the catalog weights stand
      0%  only what must NOT be cut is launched

Default 0.65. Everything between the ends is a blend that moves as the recipe
fills: an ingredient thins out gradually as it is stocked rather than
disappearing when the last one is cut.
**Why the factor is 2:** it is what makes 0.5 land exactly on the catalog
weights, so the middle of the slider is a true neutral rather than an
arbitrary point.
**Why an off-recipe ingredient counts as fully unwanted** (it counted as
neutral under D-018): the slider asks "how much of what flies should be stuff
you want", and a distractor has to be part of that question or the two ends do
not mean what they say. Cutting a distractor and cutting a stocked ingredient
cost the player the same thing, so as far as "should this fly" goes they are
one category.
**What the ends cost, and why neither is the default:** at 100% there is
nothing wrong left to cut, which removes the tension the whole orders layer is
built on (D-008, D-012). Below 50% the game is actively hostile — worth
playing once to feel what the slider does, not worth shipping.
**Degenerate case:** at 0% with a freshly drawn recipe nothing has been cut
yet, so every weight is zero and the draw falls back to the catalog weights.
That is the safety valve from D-018, working as intended — a spawner that
stops spawning is a far worse failure than a badly biased one.
**Measured at the default 0.65,** on a recipe asking for four of an
ingredient: 244 launches of it while none are stocked, then 229, 205, 190, and
169 once it is complete. At 100% the same row ends at 0.

## D-020 — Decoys: same shapes, no colour, no points
**Date:** 2026-09-20 · **Status:** to be confirmed by the team
**Decision:** The catalog gains a `fake` flag and three decoys — `ash_orb`,
`ash_cube`, `ash_spike`. They repeat the three real shapes, share one neutral
grey (palette index 6, the only colourless entry), are worth 0 points, and no
recipe ever asks for them: `createOrders` draws from `REAL_TYPES`. Cutting one
is a mistake like any other, so it wipes the recipe progress. They are
launched like everything else, which at the default bias of 0.65 makes them
about 35% of what flies.
**Why the same shapes:** shape is what the eye tracks in flight. A decoy with
a shape of its own would be a new thing to learn and would be avoided on
silhouette alone, which is no decision at all. Repeating the shape forces the
player to read the colour, and colour is the thing that can be read wrong in
the fraction of a second an object is on screen.
**Why grey rather than another hue:** the absence of colour reads faster than
any hue, and `ART-SPEC.md` already requires ingredients to differ in
brightness rather than tint — a coloured decoy would compete with that rule
instead of using it.
**Why 0 points:** the cost of cutting a decoy is the recipe it destroys.
Paying for the mistake as well would blunt that, and the score is the one
thing the player watches. It is a per-ingredient tuning slider like any other,
so softening it is a slider move, not a commit.
**Consequence worth stating:** at a recipe bias of 1 no decoy is launched at
all, which is the same warning as in D-019 seen from the other side — that end
of the slider removes the risk the orders layer exists to create.

## D-021 — A wrong cut loses the recipe and costs what it was worth
**Date:** 2026-09-20 · **Status:** to be confirmed by the team · supersedes the
wrong-cut rule in D-012
**Decision:** Cutting anything the recipe does not currently want — a decoy,
an ingredient the order never asked for, or one already stocked — loses the
recipe. Its penalty comes off the score and a new recipe is drawn, exactly as
if the clock had run out. The score floors at zero, so a mistake can empty the
balance but never put the player in debt. The behaviour is switchable with
`failOnWrong` in `config/recipes.js`, which replaces `resetOnWrong`.
**Why a lost recipe rather than lost progress:** wiping the progress was a
punishment the player could out-wait — the same order stayed on the counter,
so cutting everything in sight was still a viable way to fill it, just slower.
That is the clone the project exists not to be (D-008). Losing the order makes
the decision "is this the right thing to cut" the only way to play.
**Why the same penalty as a timeout:** a recipe lost is a recipe lost. One
number, one rule, and nothing to explain twice. If playtests want a mistake to
cost less than running out of time, that is a second multiplier in
`config/recipes.js` and a small change here.
**Why the floor at zero rather than a negative balance:** a negative total
reads as a bug to the player, and early in a round a single mistake would
outweigh everything earned so far — see D-013, which set the same rule for the
timer.
**Deliberate, and worth arguing about at the M2 gate:** the cut itself still
pays its own points before the penalty lands. A decoy is worth 0 (D-020), so
cutting one is pure loss, but a real ingredient cut at the wrong moment still
hands over its score on the way out. Making it pay nothing would be one line —
the question is whether the mistake should feel like a bad trade or like
nothing at all.
