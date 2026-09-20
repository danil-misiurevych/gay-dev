import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';
import { createOrders } from '../src/core/orders.js';
import { createRng } from '../src/core/rng.js';
import { defaultTuning, mergeTuning } from '../src/core/config.js';
import { INGREDIENT_TYPES, scoreOf } from '../src/core/ingredients.js';
import { scoreKey } from '../config/tuning.js';
import { MULTIPLIERS } from '../src/core/pieces.js';

/**
 * Ingredient scores are tunable live, so the catalog value is only a default.
 * These tests make sure nothing reads `type.score` behind the panel's back.
 */

const project = (e) => ({ x: 200 + e.pos.x * 10, y: 300 - e.pos.y * 10, r: 25 });
const swipe = (p) => ({ ax: p.x - 25, ay: p.y, bx: p.x + 25, by: p.y, dtMs: 20 });

test('every ingredient gets a tuning key defaulting to its catalog score', () => {
  const tuning = defaultTuning();
  for (const type of INGREDIENT_TYPES) {
    assert.equal(tuning[scoreKey(type.id)], type.score, `${type.id} default`);
  }
});

test('the generated keys are clamped and rounded like any other', () => {
  assert.equal(mergeTuning({ score_orb: 9999 }).score_orb, 1000);
  assert.equal(mergeTuning({ score_orb: -5 }).score_orb, 0);
  assert.equal(mergeTuning({ score_orb: 12.7 }).score_orb, 13);
});

test('scoreOf prefers the tuned value and falls back to the catalog', () => {
  const type = INGREDIENT_TYPES[0];
  assert.equal(scoreOf(type, { [scoreKey(type.id)]: 42 }), 42);
  assert.equal(scoreOf(type, {}), type.score);
  assert.equal(scoreOf(type, undefined), type.score);
});

test('a cut pays the tuned score, not the catalog one', () => {
  const type = INGREDIENT_TYPES[0];
  const game = createGame({
    seed: 3,
    tuning: { spawnEvery: 0.4, spawnJitter: 0, [scoreKey(type.id)]: 70 },
  });
  game.setAspect(0.5);
  for (let i = 0; i < 400; i++) {
    game.update(1 / 60);
    const target = [...game.entities.values()].find((e) => e.depth === 0 && e.type.id === type.id);
    if (!target) continue;
    game.beginStroke();
    game.trySlice(swipe(project(target)), project);
    game.endStroke();
    assert.equal(game.scoring.score, 70 * MULTIPLIERS[0]);
    return;
  }
  assert.fail(`no ${type.id} was launched`);
});

test('a recipe is valued with the tuned scores, and keeps that value once drawn', () => {
  const type = INGREDIENT_TYPES[0];
  const tuning = { [scoreKey(type.id)]: 100 };
  const orders = createOrders({
    rng: createRng(5),
    tuning,
    config: { minTypes: 1, maxTypes: 1, minPerType: 2, maxPerType: 2, baseSeconds: 6, secondsPerPiece: 1 },
    types: [type],
  });
  orders.start();

  assert.equal(orders.recipe.items[0].score, 100);
  assert.equal(orders.recipe.value, 200);

  tuning[scoreKey(type.id)] = 5;
  assert.equal(orders.recipe.value, 200, 'a recipe already on the counter must not change price');
  orders.onIngredientSliced(type.id);
  orders.onIngredientSliced(type.id);
  assert.equal(orders.recipe.value, 10, 'the next one uses the new score');
});
