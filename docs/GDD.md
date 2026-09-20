# Game concept

A document for the gameplay person and their agent. It contains what has been
**approved**. Keep unapproved ideas out of this file so they do not look like
settled matters.

## Pitch

An intergalactic bar. Alien customers place orders. Ingredients fly into the
air and the player slices the right ones with a swipe. A mistake costs.

## What is the mechanic and what is the product

Swipe slicing is one of the most cloned mechanics in the history of mobile
games. **On its own it distinguishes nothing**, and swapping fruit for other
objects is a reskin, not differentiation. The team's previous project was
rejected by Playgama for exactly this resemblance to the catalogue.

The differentiator is meant to be the **orders layer**: the pressure of
picking the right ingredient, the customer, the consequence of a mistake.
Slicing is the input method, not the content of the game.

The operational conclusion, binding on the whole team: the orders layer is
built **early and ugly**, before anyone starts polishing slice effects.
Details in [`ROADMAP.md`](ROADMAP.md).

## Game loop (target)

1. A customer sits at the bar and places an order: 1–3 ingredients.
2. Ingredients fly into the air, mixed with ones that do not fit.
3. The player slices the ones on the order. Slicing the right one — progress.
   Slicing a wrong one — a penalty.
4. An order filled before the customer runs out of patience → points.
5. The pace rises: more customers at once, shorter patience, more distractors.

**Unsettled:** whether letting a required ingredient through (it fell
untouched) is penalised the same as slicing a wrong one. This changes the
whole feel of the game — the first version penalises only slicing the wrong
one, as the gentler option. To be checked on the live prototype.

## Current state

Implemented: ballistic launch from below and from the side edges, swipe
slicing, halves, particles, scoring with combos, miss counter, ingredient
types (see `../config/ingredients.js`) and the first version of the recipes
with a timer (see `../config/recipes.js`).

Not implemented: visible customers, bombs, difficulty progression, sound,
end-of-round screen.

## Ingredients and decoys

The catalog ([`../config/ingredients.js`](../config/ingredients.js)) holds two
kinds of object, told apart by the `fake` flag:

- **Real ingredients** — Plasma orb, Ice cube, Chili spike. Recipes ask for
  these, and cutting one that is on the order advances it.
- **Decoys** — Ash orb, Ash cube, Ash spike. The same three shapes in neutral
  grey, worth 0 points, never on a recipe. Cutting one is always a mistake and
  wipes the recipe progress.

Decoys repeat the real shapes on purpose: shape is what the eye tracks in
flight, so a decoy with its own silhouette would be dodged without a thought.
Repeating it forces the player to read the colour instead — which is the thing
that can be read wrong at speed, and that is where the risk lives.

At the default settings decoys are about a third of what flies. Their share is
governed by their `weight` in the catalog and by the recipe bias below.

## Recipes

The current, deliberately minimal version of the orders layer:

- a recipe asks for 1–3 different ingredients, each in some count,
- it is worth the sum of its ingredients: Σ (ingredient score × count),
- slicing a required ingredient advances the recipe,
- **slicing anything else loses the recipe**: its value comes off the score
  and a new order is drawn. "Anything else" means a decoy, an ingredient the
  order never asked for, and one already stocked — all three cost the same,
- filling it in time adds its value to the score and draws the next recipe,
- letting the timer run out subtracts the same value and draws the next one.

A lost recipe costs the same whether it was lost to the clock or to a wrong
cut. **The score never goes below zero** — a mistake can empty the balance,
not put the player in debt.

Time allowed = `baseSeconds + secondsPerPiece × pieces`, so a bigger order
gets a longer window. The score floors at zero rather than going negative.

**The failure rule can be switched off** with `failOnWrong` in
`recipes.js`: a wrong cut then only wipes the progress and the same order
stays. That is the gentler version from before — worth one comparison at the
M2 gate, but it lets the player fill orders by cutting everything in sight.

**The timer can be switched off**: the *Recipe timer* checkbox in the tuning
panel (`recipeTimer` in `tuning.js`). Off, a recipe is a pure checklist — no
deadline, no penalty. Play both versions before the M2 gate; the question is
whether the time pressure is what makes the loop worth repeating.
Everything is tunable in [`../config/recipes.js`](../config/recipes.js) —
that is your file.

The knobs that decide the difficulty of M2 are `maxTypes` with `maxPerType`
(how much the player has to keep in their head) and `secondsPerPiece` (how
much slack the clock leaves). Tune the second one against `spawnEvery` in
`tuning.js`: if a required ingredient is not even launched inside the window,
the recipe is lost to the dice rather than to the player.

There is still no customer with a face or a mood — the timer is the whole
customer for now.

### What gets launched

The flow of ingredients is steered by one slider, *Flow: wrong ↔ needed*
(`recipeBias` in `tuning.js`), between two opposites:

- **100%** — only what the recipe still needs is launched. Nothing wrong is
  left to cut, so the risk disappears along with it.
- **50%** — no influence: everything flies at its catalog frequency.
- **0%** — only what you must **not** cut is launched: what you have already
  stocked, and what the recipe never asked for.

    weight = catalog weight × (2 × bias × wanted + 2 × (1 − bias) × unwanted)

`wanted` is how much of that ingredient the recipe still needs, so the effect
moves as the order fills: an ingredient thins out gradually as you stock it
rather than vanishing when you cut the last one. Default is 0.65 — leaning
towards the recipe while keeping something wrong on screen to cut.

Tune it against the timer. The bias exists so an order is not lost waiting for
one rare ingredient; pushed too far it fills orders for the player.

## Combo

Counted within **one continuous stroke**, not within a time window. A
deliberate decision: a time window rewards flailing at the screen, whereas a
continuous stroke rewards aiming at several objects in one movement — the
skill we want to pay for.

Scoring: the sliced ingredient's own score for the first cut, `+comboBonus`
for each further cut in the same stroke. The completion bonus for a recipe
stands outside the combo and does not advance it.

## Parameters and tuning

Every number governing the feel is in
[`../config/tuning.js`](../config/tuning.js), with a comment on each — including
one slider per ingredient score, generated from the catalog.
**That is your file.** Changing a value needs no developer and blocks nobody.
Ingredients live in [`../config/ingredients.js`](../config/ingredients.js) and
recipes in [`../config/recipes.js`](../config/recipes.js).

How to work:

1. Open the game on a phone, go into **Tuning**.
2. Tune live, while playing.
3. When the feel is right — **Copy**, paste the numbers into
   `config/tuning.js`, commit.
4. In the commit write **what changed in the feel**, not which numbers.

### The pair that is tuned together

`minSwipeSpeed` and `hitScale` decide whether the game feels precise or
accidental. Do not tune them separately.

- Speed threshold too low → the game can be won by slowly crawling a finger,
  and the tension disappears.
- Threshold too high → short, precise cuts stop working and the game frustrates.
- Hitbox too large → hits "next to" the object; the player cannot tell what
  they scored for.
- Hitbox too small → the game feels unfair even though it is mathematically
  honest.

Turn on **Hitboxes** (the `H` key) to see what the code actually tests.

## Target audience and context

A browser game, mostly on a phone, short sessions (1–3 minutes), often
one-handed. That constrains the design: no controls that need two hands, no
long tutorials, readability on a small screen matters more than richness.

## Monetisation

Ads only. Two natural places:

- **Interstitial** between rounds, never during one.
- **Rewarded** for continuing after a loss, or for a bonus at the start.

Integrated through the adapter in `src/platform/`. Do not weave SDK calls into
the game loop — rationale in [`ARCHITECTURE.md`](ARCHITECTURE.md).
