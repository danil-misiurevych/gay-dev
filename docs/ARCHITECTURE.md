# Architecture

A document for the code person and their agent.

## The main decision: core separated from rendering

```
                     events
  ┌──────────┐   spawn/slice/miss   ┌────────────┐
  │ src/core │ ───────────────────► │ src/render │──► Three.js ──► screen
  │          │                      │  src/ui    │
  │  logic   │ ◄─────────────────── │            │
  └──────────┘   project(entity)    └────────────┘
                movement segment          ▲
                                          │
                                   ┌──────────────┐
                                   │  src/input   │  Pointer Events
                                   └──────────────┘
```

`src/core/` imports neither Three.js nor anything from the DOM. This is not
purity for its own sake — it buys three concrete things:

1. **Tests without a browser.** `npm test` runs the full game loop in node in
   a fraction of a second. A regression in slice detection or in scoring shows
   up immediately, not after manual tapping on a phone.
2. **Swapping the visual layer without touching logic.** The procedural solids
   will be replaced by models. The core will not notice.
3. **A second platform at a sane price.** Playgama and YouTube Playables
   differ in SDK, not in logic. If the SDK calls were woven into the game
   loop, we would be maintaining two diverging versions of the same game.

### How the camera reaches the core

It does not. The core takes an injected function:

```js
project(entity) -> { x, y, r }   // CSS pixels
```

That is the only channel through which slice logic knows anything about the
camera. In tests we substitute a stand-in projection and check detection
without a renderer.

The same holds in the other direction: the core emits a `slice` event with the
swipe direction **in pixels**, and the render layer turns it into a cut plane
in the world (`scene.cutBasis`).

## Slice detection

The test happens in screen space: the pointer movement segment against a
circle around the projected centre of the object.

**Why a segment, not a point.** During a fast swipe at 60 Hz the finger jumps
tens of pixels between frames. A point test would let through an object
sitting right on the path of the movement — and the player would see they
dragged through an object and nothing happened. There is a test for it:
`tests/geometry.test.js`.

**Why screen space, not a 3D raycast.** The player aims at what they see — a
circle on the screen, not a sphere in space. A screen-space test matches their
intent. It is also an order of magnitude cheaper and can be tuned with a
single number (`hitScale`), which is the main knob deciding whether the game
"feels" fair.

**The speed threshold** (`minSwipeSpeed`) exists so the game cannot be won by
slowly crawling a finger across the screen.

## Ingredients

Ingredient types are data, not code: `config/ingredients.js` describes each one
as a record (id, name, shape, color, score, spawn weight, radius range). The core
imports them through `src/core/ingredients.js`, which validates the catalog once,
at startup.

Every flying object comes from **one** factory, `createEntity({ type })`, and
differs only by the type assigned to it. An entity holds a reference to the
frozen catalog entry rather than copies of its fields — name, shape, color and
score have a single source of truth. The core never interprets `shape` or
`colorIndex`; it passes them to the render layer, which is what gives them
meaning. That is why swapping the primitive solids for real models in M4 will not
touch game logic.

## Slicing, pieces and debris

A cut splits an object into two pieces that the core simulates like anything
else: `core/pieces.js` builds them, they have a hitbox, ballistics and a score,
and they can be cut again down to the depth the multiplier table in
`config/slicing.js` defines. Two rules keep them from taking the game over —
a piece never advances a recipe and never counts as a miss. Both are in
`DECISIONS.md`, D-015, along with why halves stopped being a view-layer effect.

What is left after the last allowed cut **is** still a view-layer effect: pure
debris, faded out by `entity-view.js`, never simulated.

The core decides how pieces fly apart, so it needs the cut plane in world
space — but it must not learn what a camera is. So the render layer injects
`cutNormal(dirX, dirY) -> { x, y, z }` into `trySlice`, exactly like
`project`. Without it the core falls back to a straight-on camera, which is
also what the tests run against.

A fresh piece is un-cuttable for `pieceArmTime` seconds. It appears where the
pointer already is, so without that window the same swipe shreds it on its
next movement sample.

Half geometry is built **once** at startup, for radius 1.
Every shape provides the same set of five solids: `full`, `halfA` (`z ≥ 0`),
`halfB` (`z ≤ 0`) and the cut faces `capA`/`capB`. The cut plane is therefore
always the same — `z = 0`, normal along Z — whatever the solid, and
`entity-view.js` carries no per-shape `if`.

`SphereGeometry(phi 0..π)` gives the `z ≥ 0` hemisphere, `(phi π..2π)` the
`z ≤ 0` one. A cone splits along its `theta` parameter, i.e. the `x = 0` plane, so the
finished half is rotated −90° around Y. A cube half is simply a flatter box.
Details and limitations: `DECISIONS.md`, D-010.

## Orders layer

`src/core/orders.js` holds the recipes: what the customer is asking for right
now, what has already been sliced, and what a wrong slice does. Settings are
in `config/recipes.js`.

The layer is deliberately passive — it knows nothing about scoring, rendering
or the HUD. `onIngredientSliced(typeId)` returns the outcome of a slice and
`update(dt)` returns one when the timer runs out; the core turns both into a
`recipe` event carrying a signed `gain`, and the UI subscribes to it. That is
why score is moved by the core and not by the orders layer: scoring has
exactly one owner.

A recipe is worth the sum of its ingredients and is on a clock — filling it
pays that value, letting it expire costs the same. Details and the deliberate
omissions are in `DECISIONS.md`, D-012 and D-013.

## Launching objects

`core/spawner.js` launches from below and from the side edges, in the
proportion set by `sideSpawnRatio`, and steers the draw between what the
current recipe still needs and what it must not have (`recipeBias`, formula in
`DECISIONS.md`, D-019).
It asks the orders layer for that progress rather than holding a copy of the
recipe, so there is still exactly one place that knows what the customer
wants. Both aim at the SAME apex: the launch
speed is derived from the target apex (`launchSpeedForApex`), never written
down directly.

That is a design decision, not a mathematical convenience. "The object should
reach 42% of the screen height" is a parameter the gameplay person
understands and can tune; "speed 14.7 u/s" means nothing to them and changes
meaning with every change of gravity. It also keeps the two entry edges
feeling like one game — see `DECISIONS.md`, D-014.

## Performance

Target: 60 FPS on a mid-range phone from the last three years. The levers, in
order of effectiveness:

| Lever | Effect | Where |
|---|---|---|
| Device pixel ratio cap | 2 → 1.5 is about 44% fewer fragments | `render/scene.js`, panel |
| Number of lights | cost is per fragment × number of lights | `render/scene.js` |
| Number of particles | transparent overdraw | `config/tuning.js` |
| Objects on screen at once | linear | `config/tuning.js` |

We deliberately use two directional lights and one hemisphere light, zero
point lights: directional lights behave identically regardless of the Three.js
lighting model, so updating the library does not require retuning the scene.

**FPS is not a value you crank up.** `requestAnimationFrame` is synchronised
with the display refresh — the ceiling is the panel's physical refresh rate.
A steady 30 on an iPhone usually means power-saving mode, not a problem in the
code. Before you start optimising, establish whether the frame budget is
actually being exceeded.

**Zero allocation in the loop.** Meshes, halves and particle bursts are
pooled. When you add an effect, add its pool.

## Bundle budget

`npm run size` measures the size of `dist/` after gzip and fails once a limit
is exceeded. The limits are in `scripts/check-size.mjs`.

Three.js after tree-shaking is currently about 115 kB gzip — the whole library
without tree-shaking would be about 600 kB uncompressed. Hence a bundler from
day one rather than "some time later".

We keep only `woff2`, no `woff`: the fallback is about 100 kB of dead weight,
and browsers without `woff2` support are practically absent from mobile
traffic.

## Platform layer

`src/platform/index.js` defines the interface the rest of the code sticks to.
`web.js` is the implementation without an SDK (development and team testing).
`playgama.js` is a skeleton — **do not fill it in from memory**, see the
comment in the file.

## Determinism

`core/rng.js` is a seeded generator. That makes tests repeatable, and when a
bug is reported the exact same run can be replayed. The seed goes to the
console in development mode.
