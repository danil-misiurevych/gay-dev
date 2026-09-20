import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INGREDIENT_TYPES, SHAPES, ingredientById, pickIngredient } from '../src/core/ingredients.js';
import { createEntity } from '../src/core/entities.js';
import { createGame } from '../src/core/game.js';
import { createScoring } from '../src/core/scoring.js';
import { createRng } from '../src/core/rng.js';

/**
 * The catalog is content, not logic, so these tests do not pin down the
 * numbers a gameplay person is free to change. They pin down the contract:
 * every type is complete, drawable and scoreable, and a slice pays what its
 * own type is worth.
 */

test('every catalog entry is complete and drawable', () => {
  assert.ok(INGREDIENT_TYPES.length >= 3, 'at least three types are expected');
  const ids = new Set();
  for (const t of INGREDIENT_TYPES) {
    assert.ok(t.id && !ids.has(t.id), `id must be present and unique: ${t.id}`);
    ids.add(t.id);
    assert.ok(t.name.length > 0, `${t.id}: missing name`);
    assert.ok(SHAPES.includes(t.shape), `${t.id}: unknown shape`);
    assert.ok(Number.isInteger(t.score) && t.score >= 0, `${t.id}: bad score`);
    assert.ok(t.radius[0] > 0 && t.radius[1] >= t.radius[0], `${t.id}: bad radius range`);
  }
});

test('the catalog covers the three basic shapes', () => {
  const shapes = new Set(INGREDIENT_TYPES.map((t) => t.shape));
  for (const shape of ['sphere', 'box', 'cone']) {
    assert.ok(shapes.has(shape), `no ingredient uses the "${shape}" shape`);
  }
});

test('a type is looked up by id and cannot be mutated', () => {
  const first = INGREDIENT_TYPES[0];
  assert.equal(ingredientById(first.id), first);
  assert.equal(ingredientById('does-not-exist'), undefined);
  assert.throws(() => { 'use strict'; first.score = 999; });
});

test('every object comes from one factory and carries its type', () => {
  for (const type of INGREDIENT_TYPES) {
    const e = createEntity({ type, radius: type.radius[0] });
    assert.equal(e.type.id, type.id);
    assert.equal(e.type.shape, type.shape);
    assert.equal(e.type.score, type.score);
    assert.ok(e.alive);
  }
});

test('the spawner draws every type and respects its radius range', () => {
  const game = createGame({ seed: 9, tuning: { spawnEvery: 0.2, spawnJitter: 0 } });
  game.setAspect(0.5);

  const seen = new Set();
  game.on('spawn', ({ entity }) => {
    seen.add(entity.type.id);
    const [min, max] = entity.type.radius;
    assert.ok(entity.radius >= min && entity.radius <= max,
      `${entity.type.id}: radius ${entity.radius} outside [${min}, ${max}]`);
  });

  for (let i = 0; i < 3000; i++) game.update(1 / 60);
  assert.equal(seen.size, INGREDIENT_TYPES.length, `types drawn: ${[...seen].join(', ')}`);
});

test('weights steer the draw', () => {
  const rng = createRng(2024);
  const counts = new Map(INGREDIENT_TYPES.map((t) => [t.id, 0]));
  for (let i = 0; i < 4000; i++) {
    const t = pickIngredient(rng);
    counts.set(t.id, counts.get(t.id) + 1);
  }

  const byWeight = [...INGREDIENT_TYPES].sort((a, b) => b.weight - a.weight);
  const heaviest = byWeight[0];
  const lightest = byWeight[byWeight.length - 1];
  if (heaviest.weight > lightest.weight) {
    assert.ok(counts.get(heaviest.id) > counts.get(lightest.id),
      `the heavier type should be drawn more often: ${JSON.stringify([...counts])}`);
  }
});

test('a slice pays what its own type is worth', () => {
  const s = createScoring({ tuning: { scoreBase: 10, comboBonus: 5 } });
  s.beginStroke();
  assert.equal(s.registerSlice(20).gain, 20, 'first slice: the type score alone');
  assert.equal(s.registerSlice(10).gain, 15, 'second slice: type score + one combo bonus');
  assert.equal(s.registerSlice().gain, 20, 'no argument: falls back to scoreBase');
  assert.equal(s.score, 55);
});

test('the score awarded in game matches the sliced type', () => {
  const project = (e) => ({ x: 200 + e.pos.x * 10, y: 300 - e.pos.y * 10, r: 25 });
  const game = createGame({ seed: 42, tuning: { spawnEvery: 0.3, spawnJitter: 0 } });
  game.setAspect(0.5);
  for (let i = 0; i < 40; i++) game.update(1 / 60);

  const entity = [...game.entities.values()][0];
  const p = project(entity);
  game.beginStroke();
  game.trySlice({ ax: p.x - 200, ay: p.y, bx: p.x + 200, by: p.y, dtMs: 60 }, project);

  assert.equal(game.scoring.score, entity.type.score);
});
