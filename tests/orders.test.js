import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrders, SLICE_RESULT } from '../src/core/orders.js';
import { createRng } from '../src/core/rng.js';
import { createGame } from '../src/core/game.js';
import { createScoring } from '../src/core/scoring.js';
import { INGREDIENT_TYPES } from '../src/core/ingredients.js';
import { defaultTuning, mergeTuning } from '../src/core/config.js';

/**
 * The orders layer is the M2 gate, so these tests pin down the rules of the
 * loop rather than any particular numbers: a recipe is filled by the right
 * ingredients, a wrong one wipes the progress, and completing it draws the
 * next recipe.
 */

const config = {
  minTypes: 2, maxTypes: 2, minPerType: 2, maxPerType: 2,
  baseSeconds: 6, secondsPerPiece: 3.5,
  rewardMultiplier: 1, penaltyMultiplier: 1,
  failOnWrong: true,
};

const makeOrders = (seed = 5, over = {}) => {
  const orders = createOrders({ rng: createRng(seed), config: { ...config, ...over } });
  orders.start();
  return orders;
};

test('a recipe is drawn within the configured bounds', () => {
  const orders = makeOrders();
  const recipe = orders.recipe;
  assert.equal(recipe.items.length, 2);
  for (const item of recipe.items) {
    assert.equal(item.need, 2);
    assert.equal(item.done, 0);
  }
  assert.equal(recipe.need, 4);
});

test('a recipe never asks for the same ingredient twice', () => {
  for (let seed = 0; seed < 50; seed++) {
    const orders = makeOrders(seed, { minTypes: 1, maxTypes: INGREDIENT_TYPES.length });
    const ids = orders.recipe.items.map((it) => it.typeId);
    assert.equal(new Set(ids).size, ids.length, `duplicate in recipe: ${ids.join(', ')}`);
  }
});

test('slicing a required ingredient advances the recipe', () => {
  const orders = makeOrders();
  const wanted = orders.recipe.items[0].typeId;
  const out = orders.onIngredientSliced(wanted);
  assert.equal(out.result, SLICE_RESULT.PROGRESS);
  assert.equal(out.item.done, 1);
  assert.equal(orders.recipe.done, 1);
});

test('cutting the wrong thing loses the recipe and draws a new one', () => {
  const orders = makeOrders();
  const lost = orders.recipe;
  const wanted = lost.items[0].typeId;
  const notWanted = INGREDIENT_TYPES.find((t) => !lost.items.some((it) => it.typeId === t.id));
  assert.ok(notWanted, 'the catalog must hold a type outside this recipe');

  orders.onIngredientSliced(wanted);
  assert.equal(orders.recipe.done, 1);

  const out = orders.onIngredientSliced(notWanted.id);
  assert.equal(out.result, SLICE_RESULT.WRONG);
  assert.equal(out.finished.id, lost.id, 'the lost recipe comes back so the core can charge for it');
  assert.equal(orders.state.mistakes, 1);
  assert.notEqual(orders.recipe.id, lost.id, 'a different recipe must be on the counter');
  assert.equal(orders.recipe.done, 0);
  assert.equal(orders.recipe.elapsed, 0, 'and it starts on a fresh clock');
});

test('an ingredient that is already fully stocked counts as wrong', () => {
  const orders = makeOrders(5, { minPerType: 1, maxPerType: 1 });
  const first = orders.recipe.items[0].typeId;
  orders.onIngredientSliced(first);
  const out = orders.onIngredientSliced(first);
  assert.equal(out.result, SLICE_RESULT.WRONG);
});

test('with failOnWrong off, only the progress is lost', () => {
  const orders = makeOrders(5, { failOnWrong: false });
  const kept = orders.recipe;
  const wanted = kept.items[0].typeId;
  const notWanted = INGREDIENT_TYPES.find((t) => !kept.items.some((it) => it.typeId === t.id));

  orders.onIngredientSliced(wanted);
  const out = orders.onIngredientSliced(notWanted.id);

  assert.equal(out.result, SLICE_RESULT.WRONG);
  assert.equal(out.finished, null, 'nothing was lost, so there is nothing to charge for');
  assert.equal(orders.recipe.id, kept.id, 'the same recipe stays on the counter');
  assert.equal(orders.recipe.done, 0);
});

test('completing a recipe draws the next one', () => {
  const orders = makeOrders();
  const first = orders.recipe;
  let last;
  for (const item of first.items) {
    for (let i = 0; i < item.need; i++) last = orders.onIngredientSliced(item.typeId);
  }
  assert.equal(last.result, SLICE_RESULT.COMPLETE);
  assert.equal(last.finished.id, first.id);
  assert.notEqual(orders.recipe.id, first.id, 'a new recipe must be in play');
  assert.equal(orders.recipe.done, 0);
  assert.equal(orders.state.served, 1);
});

test('a recipe is worth the sum of its ingredients', () => {
  const orders = makeOrders();
  const recipe = orders.recipe;
  const expected = recipe.items.reduce((n, it) => n + it.score * it.need, 0);
  assert.equal(recipe.value, expected);
  assert.equal(recipe.reward, expected, 'reward = value at multiplier 1');
  assert.equal(recipe.penalty, expected, 'the penalty costs exactly what filling it pays');
  assert.ok(expected > 0);
});

test('the multipliers move reward and penalty independently', () => {
  const orders = makeOrders(5, { rewardMultiplier: 2, penaltyMultiplier: 0.5 });
  const { value, reward, penalty } = orders.recipe;
  assert.equal(reward, Math.round(value * 2));
  assert.equal(penalty, Math.round(value * 0.5));
});

test('the time allowed scales with the size of the recipe', () => {
  const small = makeOrders(5, { minTypes: 1, maxTypes: 1, minPerType: 1, maxPerType: 1 });
  const big = makeOrders(5, { minTypes: 1, maxTypes: 1, minPerType: 6, maxPerType: 6 });
  assert.equal(small.recipe.patience, 6 + 3.5 * small.recipe.need);
  assert.ok(big.recipe.patience > small.recipe.patience);
});

test('the timer only fires once it runs out, and then draws a new recipe', () => {
  const orders = makeOrders();
  const first = orders.recipe;

  assert.equal(orders.update(first.patience - 0.1), null, 'must not fire early');
  assert.ok(orders.remaining > 0);

  const out = orders.update(0.2);
  assert.ok(out, 'the tick crossing the limit must report the expiry');
  assert.equal(out.result, SLICE_RESULT.EXPIRED);
  assert.equal(out.finished.id, first.id);
  assert.notEqual(orders.recipe.id, first.id);
  assert.equal(orders.state.expired, 1);
  assert.equal(orders.recipe.elapsed, 0);
});

test('a mistake and a timeout cost the same thing', () => {
  const byClock = makeOrders(5);
  const doomed = byClock.recipe;
  const expiry = byClock.update(doomed.patience + 0.1);

  const byMistake = makeOrders(5);
  const notWanted = INGREDIENT_TYPES.find(
    (t) => !byMistake.recipe.items.some((it) => it.typeId === t.id),
  );
  const mistake = byMistake.onIngredientSliced(notWanted.id);

  assert.equal(expiry.result, SLICE_RESULT.EXPIRED);
  assert.equal(mistake.result, SLICE_RESULT.WRONG);
  assert.equal(mistake.finished.penalty, expiry.finished.penalty,
    'a recipe lost is a recipe lost, whichever way it went');
});

test('the core charges for a recipe lost to a mistake', () => {
  const project = (e) => ({ x: 200 + e.pos.x * 10, y: 300 - e.pos.y * 10, r: 25 });
  const game = createGame({ seed: 11, tuning: { spawnEvery: 0.25, spawnJitter: 0 } });
  game.setAspect(0.5);
  game.start();

  const events = [];
  game.on('recipe', (e) => events.push(e));
  game.scoring.addBonus(1000);

  const doomed = game.orders.recipe;
  for (let i = 0; i < 4000; i++) {
    game.update(1 / 60);
    const wrong = [...game.entities.values()].find((e) => e.depth === 0
      && !game.orders.recipe.items.some((it) => it.typeId === e.type.id && it.done < it.need));
    if (!wrong) continue;

    const before = game.scoring.score;
    const p = project(wrong);
    game.beginStroke();
    game.trySlice({ ax: p.x - 25, ay: p.y, bx: p.x + 25, by: p.y, dtMs: 20 }, project);
    game.endStroke();

    const last = events[events.length - 1];
    assert.equal(last.result, 'wrong');
    assert.equal(last.gain, -doomed.penalty, 'it costs what the recipe was worth');
    assert.equal(game.scoring.score, before + wrong.type.score - doomed.penalty);
    assert.notEqual(game.orders.recipe.id, doomed.id, 'and the order is replaced');
    return;
  }
  assert.fail('nothing wrong was ever launched');
});

test('the balance cannot go negative', () => {
  const scoring = createScoring({ tuning: { scoreBase: 10, comboBonus: 5 } });
  scoring.addBonus(20);
  assert.equal(scoring.applyPenalty(500), 20, 'only what there was is taken');
  assert.equal(scoring.score, 0);
  assert.equal(scoring.applyPenalty(500), 0, 'and nothing more after that');
  assert.equal(scoring.score, 0);
});

test('completing a recipe draws the next one', () => {
  const orders = makeOrders();
  const first = orders.recipe;
  let last;
  for (const item of first.items) {
    for (let i = 0; i < item.need; i++) last = orders.onIngredientSliced(item.typeId);
  }
  assert.equal(last.result, SLICE_RESULT.COMPLETE);
  assert.equal(last.finished.id, first.id);
  assert.notEqual(orders.recipe.id, first.id, 'a new recipe must be in play');
  assert.equal(orders.recipe.done, 0);
  assert.equal(orders.state.served, 1);
});

test('a recipe is worth the sum of its ingredients', () => {
  const orders = makeOrders();
  const recipe = orders.recipe;
  const expected = recipe.items.reduce((n, it) => n + it.score * it.need, 0);
  assert.equal(recipe.value, expected);
  assert.equal(recipe.reward, expected, 'reward = value at multiplier 1');
  assert.equal(recipe.penalty, expected, 'the penalty costs exactly what filling it pays');
  assert.ok(expected > 0);
});

test('the multipliers move reward and penalty independently', () => {
  const orders = makeOrders(5, { rewardMultiplier: 2, penaltyMultiplier: 0.5 });
  const { value, reward, penalty } = orders.recipe;
  assert.equal(reward, Math.round(value * 2));
  assert.equal(penalty, Math.round(value * 0.5));
});

test('the time allowed scales with the size of the recipe', () => {
  const small = makeOrders(5, { minTypes: 1, maxTypes: 1, minPerType: 1, maxPerType: 1 });
  const big = makeOrders(5, { minTypes: 1, maxTypes: 1, minPerType: 6, maxPerType: 6 });
  assert.equal(small.recipe.patience, 6 + 3.5 * small.recipe.need);
  assert.ok(big.recipe.patience > small.recipe.patience);
});

test('the timer only fires once it runs out, and then draws a new recipe', () => {
  const orders = makeOrders();
  const first = orders.recipe;

  assert.equal(orders.update(first.patience - 0.1), null, 'must not fire early');
  assert.ok(orders.remaining > 0);

  const out = orders.update(0.2);
  assert.ok(out, 'the tick crossing the limit must report the expiry');
  assert.equal(out.result, SLICE_RESULT.EXPIRED);
  assert.equal(out.finished.id, first.id);
  assert.notEqual(orders.recipe.id, first.id);
  assert.equal(orders.state.expired, 1);
  assert.equal(orders.recipe.elapsed, 0);
});

test('a mistake and a timeout cost the same thing', () => {
  const byClock = makeOrders(5);
  const doomed = byClock.recipe;
  const expiry = byClock.update(doomed.patience + 0.1);

  const byMistake = makeOrders(5);
  const notWanted = INGREDIENT_TYPES.find(
    (t) => !byMistake.recipe.items.some((it) => it.typeId === t.id),
  );
  const mistake = byMistake.onIngredientSliced(notWanted.id);

  assert.equal(expiry.result, SLICE_RESULT.EXPIRED);
  assert.equal(mistake.result, SLICE_RESULT.WRONG);
  assert.equal(mistake.finished.penalty, expiry.finished.penalty,
    'a recipe lost is a recipe lost, whichever way it went');
});

test('the core charges for a recipe lost to a mistake, and floors at zero', () => {
  const game = createGame({ seed: 11 });
  game.setAspect(0.5);
  game.start();

  const doomed = game.orders.recipe;
  const notWanted = INGREDIENT_TYPES.find((t) => !doomed.items.some((it) => it.typeId === t.id));
  game.scoring.addBonus(1000);

  const events = [];
  game.on('recipe', (e) => events.push(e));
  const out = game.orders.onIngredientSliced(notWanted.id);
  assert.equal(out.result, SLICE_RESULT.WRONG);

  // Now the same thing through the core, where the score actually moves.
  const fresh = createGame({ seed: 11 });
  fresh.setAspect(0.5);
  fresh.start();
  const recipe = fresh.orders.recipe;
  const wrongId = INGREDIENT_TYPES.find((t) => !recipe.items.some((it) => it.typeId === t.id)).id;

  fresh.scoring.addBonus(recipe.penalty + 30);
  const before = fresh.scoring.score;
  const hits = [];
  fresh.on('recipe', (e) => hits.push(e));
  fresh.orders.onIngredientSliced(wrongId);
  assert.equal(fresh.scoring.applyPenalty(recipe.penalty), recipe.penalty);
  assert.equal(fresh.scoring.score, before - recipe.penalty);

  // And with almost nothing banked, the balance stops at zero.
  const broke = createScoring({ tuning: { scoreBase: 10, comboBonus: 5 } });
  broke.addBonus(20);
  assert.equal(broke.applyPenalty(500), 20, 'only what there was is taken');
  assert.equal(broke.score, 0, 'the balance cannot go negative');
});

test('the core awards the completion bonus and announces the recipe', () => {
  const project = (e) => ({ x: 200 + e.pos.x * 10, y: 300 - e.pos.y * 10, r: 25 });
  const game = createGame({ seed: 3, tuning: { spawnEvery: 0.25, spawnJitter: 0 } });
  game.setAspect(0.5);

  const events = [];
  game.on('recipe', (e) => events.push(e));
  game.start();
  assert.equal(events[0].result, 'new');
  assert.ok(events[0].recipe.items.length > 0);

  // Slice only what the current recipe asks for, until one is completed.
  // The swipe is short and only taken when nothing else is within reach of
  // it: this test is about the orders layer, not about collateral damage.
  const reaches = (segment, entity) => {
    const p = project(entity);
    const inside = p.x >= segment.ax - p.r * 2 && p.x <= segment.bx + p.r * 2;
    return inside && Math.abs(p.y - segment.ay) <= p.r * 2;
  };

  let completed = null;
  for (let i = 0; i < 4000 && !completed; i++) {
    game.update(1 / 60);
    for (const entity of [...game.entities.values()]) {
      if (entity.depth > 0) continue;
      const wanted = game.orders.recipe.items.some(
        (it) => it.typeId === entity.type.id && it.done < it.need,
      );
      if (!wanted) continue;
      const p = project(entity);
      const segment = { ax: p.x - 20, ay: p.y, bx: p.x + 20, by: p.y, dtMs: 20 };
      const crowded = [...game.entities.values()]
        .some((other) => other.id !== entity.id && reaches(segment, other));
      if (crowded) continue;

      game.beginStroke();
      game.trySlice(segment, project);
      game.endStroke();
      const last = events[events.length - 1];
      if (last.result === 'complete') completed = last;
    }
  }

  assert.ok(completed, 'a recipe should be completable by slicing only what it asks for');
  assert.equal(completed.gain, completed.finished.reward);
  assert.ok(game.scoring.score >= completed.finished.reward);
  assert.equal(game.orders.state.mistakes, 0, 'nothing wrong was sliced');
});

test('an expired recipe subtracts its value through the core', () => {
  const game = createGame({ seed: 4 });
  game.setAspect(0.5);

  const events = [];
  game.on('recipe', (e) => events.push(e));
  game.start();

  const doomed = game.orders.recipe;
  game.scoring.addBonus(1000);
  const before = game.scoring.score;

  // Run past the deadline without slicing anything.
  for (let i = 0; i < 60 * 120 && game.orders.recipe.id === doomed.id; i++) game.update(1 / 60);

  const last = events[events.length - 1];
  assert.equal(last.result, 'expired');
  assert.equal(last.gain, -doomed.penalty);
  assert.equal(game.scoring.score, before - doomed.penalty);
  assert.equal(game.orders.state.expired, 1);
});

test('the score floors at zero instead of going negative', () => {
  const game = createGame({ seed: 8 });
  game.setAspect(0.5);
  game.start();

  const doomed = game.orders.recipe;
  assert.equal(game.scoring.score, 0);
  for (let i = 0; i < 60 * 120 && game.orders.recipe.id === doomed.id; i++) game.update(1 / 60);

  assert.equal(game.scoring.score, 0, 'nothing to take, so nothing is taken');
});

test('reset clears recipe progress and counters', () => {
  const game = createGame({ seed: 11 });
  game.setAspect(1);
  game.start();
  game.orders.onIngredientSliced(game.orders.recipe.items[0].typeId);
  game.reset();
  assert.equal(game.orders.state.served, 0);
  assert.equal(game.orders.state.expired, 0);
  assert.equal(game.orders.state.mistakes, 0);
  assert.equal(game.orders.recipe.done, 0);
  assert.equal(game.orders.recipe.elapsed, 0);
});

test('with the timer switched off a recipe never expires', () => {
  const game = createGame({ seed: 4, tuning: { recipeTimer: false } });
  game.setAspect(0.5);
  const events = [];
  game.on('recipe', (e) => events.push(e));
  game.start();

  const recipe = game.orders.recipe;
  game.scoring.addBonus(1000);
  assert.equal(game.orders.timerEnabled, false);

  for (let i = 0; i < 60 * 300; i++) game.update(1 / 60);

  assert.equal(game.orders.recipe.id, recipe.id, 'the same recipe must still be in play');
  assert.equal(game.orders.recipe.elapsed, 0, 'no time is accumulated while the timer is off');
  assert.equal(game.scoring.score, 1000, 'nothing may be taken away');
  assert.equal(game.orders.state.expired, 0);
  assert.equal(events.filter((e) => e.result === 'expired').length, 0);
});

test('the switch takes effect mid-recipe, in both directions', () => {
  const game = createGame({ seed: 4 });
  game.setAspect(0.5);
  game.start();
  const recipe = game.orders.recipe;

  game.update(4);
  assert.equal(recipe.elapsed, 4);

  game.setTuning({ recipeTimer: false });
  game.update(10);
  assert.equal(recipe.elapsed, 4, 'the clock stops where it was');

  game.setTuning({ recipeTimer: true });
  game.update(1);
  assert.equal(recipe.elapsed, 5, 'and continues rather than restarting');
});

test('the switch survives the tuning merge as a boolean', () => {
  assert.equal(defaultTuning().recipeTimer, true);
  assert.equal(mergeTuning({ recipeTimer: false }).recipeTimer, false);
  assert.equal(mergeTuning({ recipeTimer: 'nope' }).recipeTimer, true, 'garbage is ignored');
});
