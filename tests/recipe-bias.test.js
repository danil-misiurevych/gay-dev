import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';
import { createRng } from '../src/core/rng.js';
import { pickIngredient, INGREDIENT_TYPES } from '../src/core/ingredients.js';

/**
 * `recipeBias` is a slider between two opposites: at 1 only what the recipe
 * still needs is launched, at 0 only what must not be cut, and 0.5 is no
 * influence at all. These tests pin down both ends, the neutral middle and
 * the fact that the move between them is gradual rather than a switch.
 */

/**
 * Runs the game with a known recipe — every type required, some of it already
 * stocked — and counts what gets launched.
 */
function spawnCounts({ bias, stock = {}, only = null, frames = 6000, seed = 17 }) {
  const game = createGame({
    seed,
    tuning: { spawnEvery: 0.2, spawnJitter: 0, recipeBias: bias },
  });
  game.setAspect(0.5);
  game.start();

  const listed = only ?? INGREDIENT_TYPES.map((t) => t.id);
  const recipe = game.orders.recipe;
  recipe.items = INGREDIENT_TYPES
    .filter((t) => listed.includes(t.id))
    .map((t) => ({ typeId: t.id, name: t.name, score: t.score, need: 4, done: stock[t.id] ?? 0 }));
  recipe.need = recipe.items.reduce((n, it) => n + it.need, 0);
  recipe.done = recipe.items.reduce((n, it) => n + it.done, 0);
  recipe.patience = Infinity;

  const counts = Object.fromEntries(INGREDIENT_TYPES.map((t) => [t.id, 0]));
  game.on('spawn', ({ entity }) => { if (entity.depth === 0) counts[entity.type.id] += 1; });
  for (let i = 0; i < frames; i++) game.update(1 / 60);
  return counts;
}

const [first, second] = INGREDIENT_TYPES;

test('wantedShare reports how much of an ingredient the recipe still wants', () => {
  const game = createGame({ seed: 2 });
  game.setAspect(1);
  game.start();

  const item = game.orders.recipe.items[0];
  assert.equal(game.orders.wantedShare(item.typeId), 1, 'nothing cut yet: fully wanted');
  item.done = item.need;
  assert.equal(game.orders.wantedShare(item.typeId), 0, 'stocked: not wanted any more');
  assert.equal(game.orders.wantedShare('not-an-ingredient'), 0,
    'never asked for reads the same as finished');
});

test('at 50% the recipe has no influence on what flies', () => {
  const plain = spawnCounts({ bias: 0.5 });
  const stocked = spawnCounts({ bias: 0.5, stock: { [first.id]: 4 } });
  assert.deepEqual(stocked, plain, 'the same seed must produce the same launches');
});

test('at 100% only what the recipe still needs is launched', () => {
  const counts = spawnCounts({ bias: 1, stock: { [first.id]: 4 } });
  assert.equal(counts[first.id], 0, 'stocked: must not appear');
  assert.ok(counts[second.id] > 0, 'still needed: must keep coming');
});

test('at 100% an ingredient the recipe never asked for is not launched either', () => {
  const counts = spawnCounts({ bias: 1, only: [first.id] });
  assert.ok(counts[first.id] > 0, 'the one on the recipe flies');
  for (const type of INGREDIENT_TYPES.slice(1)) {
    assert.equal(counts[type.id], 0, `${type.id} is not on the recipe and must not fly`);
  }
});

test('at 0% only what must not be cut is launched', () => {
  const counts = spawnCounts({ bias: 0, stock: { [first.id]: 4 } });
  assert.ok(counts[first.id] > 0, 'stocked: exactly what this end favours');
  assert.equal(counts[second.id], 0, 'still needed: must not appear');
});

test('the move between the ends is gradual, not a switch', () => {
  const id = first.id;
  const none = spawnCounts({ bias: 0.8 })[id];
  const half = spawnCounts({ bias: 0.8, stock: { [id]: 2 } })[id];
  const full = spawnCounts({ bias: 0.8, stock: { [id]: 4 } })[id];

  assert.ok(half < none, `half stocked should be rarer: ${half} vs ${none}`);
  assert.ok(full < half, `fully stocked should be rarer still: ${full} vs ${half}`);
  assert.ok(full > 0, 'below 100% it thins out rather than disappearing');
});

test('with the orders layer off, the catalog weights stand', () => {
  const run = (bias) => {
    const game = createGame({ seed: 17, tuning: { spawnEvery: 0.2, spawnJitter: 0, recipeBias: bias } });
    game.setAspect(0.5);
    game.orders.enabled = false;
    const counts = Object.fromEntries(INGREDIENT_TYPES.map((t) => [t.id, 0]));
    game.on('spawn', ({ entity }) => { counts[entity.type.id] += 1; });
    for (let i = 0; i < 3000; i++) game.update(1 / 60);
    return counts;
  };
  assert.deepEqual(run(1), run(0), 'no recipe, no bias, whatever the slider says');
});

test('the draw falls back to catalog weights if the bias silences everything', () => {
  const rng = createRng(4);
  const picked = pickIngredient(rng, () => 0);
  assert.ok(INGREDIENT_TYPES.includes(picked), 'a spawner that stops spawning is the worse bug');
});
