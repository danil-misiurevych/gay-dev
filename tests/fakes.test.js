import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';
import { createOrders } from '../src/core/orders.js';
import { createRng } from '../src/core/rng.js';
import { INGREDIENT_TYPES, REAL_TYPES, FAKE_TYPES } from '../src/core/ingredients.js';
import { PALETTE } from '../src/render/palette.js';

/**
 * Decoys: objects that fly and can be cut, but that no recipe ever asks for.
 * They are the risk the orders layer is built on, so what is pinned down here
 * is that they stay out of recipes, that cutting one is always a mistake, and
 * that they are visually distinguishable.
 */

const project = (e) => ({ x: 200 + e.pos.x * 10, y: 300 - e.pos.y * 10, r: 25 });
const swipe = (p) => ({ ax: p.x - 25, ay: p.y, bx: p.x + 25, by: p.y, dtMs: 20 });

test('the catalog splits into real ingredients and decoys', () => {
  assert.ok(REAL_TYPES.length >= 3, 'recipes need something to ask for');
  assert.ok(FAKE_TYPES.length >= 3, 'and the player needs something to avoid');
  assert.equal(REAL_TYPES.length + FAKE_TYPES.length, INGREDIENT_TYPES.length);
  assert.ok(REAL_TYPES.every((t) => t.fake === false));
  assert.ok(FAKE_TYPES.every((t) => t.fake === true));
});

test('every decoy repeats the shape of a real ingredient', () => {
  const realShapes = new Set(REAL_TYPES.map((t) => t.shape));
  for (const fake of FAKE_TYPES) {
    assert.ok(realShapes.has(fake.shape),
      `${fake.id} has shape "${fake.shape}", which no real ingredient uses`);
  }
});

test('decoys share one colour, and no real ingredient uses it', () => {
  const fakeColors = new Set(FAKE_TYPES.map((t) => t.colorIndex));
  assert.equal(fakeColors.size, 1, 'one signal, not three');
  const [grey] = fakeColors;
  assert.ok(grey < PALETTE.length, 'the decoy colour must exist in the palette');
  for (const real of REAL_TYPES) {
    assert.notEqual(real.colorIndex, grey, `${real.id} would be mistaken for a decoy`);
  }
});

test('a recipe never asks for a decoy', () => {
  const fakeIds = new Set(FAKE_TYPES.map((t) => t.id));
  for (let seed = 0; seed < 200; seed++) {
    const orders = createOrders({ rng: createRng(seed) });
    orders.start();
    for (const item of orders.recipe.items) {
      assert.ok(!fakeIds.has(item.typeId), `seed ${seed} put ${item.typeId} on a recipe`);
    }
  }
});

test('decoys still get launched — they are the risk', () => {
  const game = createGame({ seed: 6, tuning: { spawnEvery: 0.2, spawnJitter: 0, recipeBias: 0.5 } });
  game.setAspect(0.5);
  game.start();

  const seen = new Set();
  game.on('spawn', ({ entity }) => { if (entity.depth === 0) seen.add(entity.type.id); });
  for (let i = 0; i < 6000; i++) game.update(1 / 60);

  for (const fake of FAKE_TYPES) {
    assert.ok(seen.has(fake.id), `${fake.id} never flew`);
  }
});

test('cutting a decoy loses the recipe, exactly like any other wrong cut', () => {
  const game = createGame({ seed: 6, tuning: { spawnEvery: 0.2, spawnJitter: 0, pieceArmTime: 0 } });
  game.setAspect(0.5);
  game.start();

  const doomed = game.orders.recipe;
  const item = doomed.items[0];
  item.done = 1;
  doomed.done = 1;

  const before = game.orders.state.mistakes;
  const out = game.orders.onIngredientSliced(FAKE_TYPES[0].id);

  assert.equal(out.result, 'wrong');
  assert.equal(out.finished.id, doomed.id, 'the decoy costs the whole order');
  assert.equal(game.orders.state.mistakes, before + 1);
  assert.notEqual(game.orders.recipe.id, doomed.id);
  assert.equal(game.orders.recipe.done, 0);
});

test('a decoy is worth no points by default', () => {
  for (const fake of FAKE_TYPES) {
    assert.equal(fake.score, 0, `${fake.id}: the cost of a decoy is the recipe, not the score`);
  }
});

test('at full recipe bias no decoy is launched at all', () => {
  const game = createGame({ seed: 6, tuning: { spawnEvery: 0.2, spawnJitter: 0, recipeBias: 1 } });
  game.setAspect(0.5);
  game.start();

  const counts = Object.fromEntries(INGREDIENT_TYPES.map((t) => [t.id, 0]));
  game.on('spawn', ({ entity }) => { if (entity.depth === 0) counts[entity.type.id] += 1; });
  for (let i = 0; i < 3000; i++) game.update(1 / 60);

  for (const fake of FAKE_TYPES) {
    assert.equal(counts[fake.id], 0, `${fake.id} must not fly when only wanted things do`);
  }
  assert.ok(REAL_TYPES.some((t) => counts[t.id] > 0), 'something still has to fly');
});
