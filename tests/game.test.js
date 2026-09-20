import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';

/**
 * These tests run the FULL game loop with no browser and no Three.js. That is
 * the whole value of splitting core from rendering: a regression in slice
 * logic or in scoring shows up in a second, in the terminal.
 */

const project = (e) => ({ x: 200 + e.pos.x * 10, y: 300 - e.pos.y * 10, r: 25 });

test('the game launches objects and reports misses', () => {
  const game = createGame({ seed: 12345, tuning: { spawnEvery: 0.3, spawnJitter: 0 } });
  game.setAspect(0.5);

  const spawned = [];
  const missed = [];
  game.on('spawn', (e) => spawned.push(e));
  game.on('miss', (e) => missed.push(e));

  for (let i = 0; i < 600; i++) game.update(1 / 60);

  assert.ok(spawned.length > 5, `spawned: ${spawned.length}`);
  assert.ok(missed.length > 0, 'untouched objects must eventually fall below the bound');
  assert.equal(game.scoring.misses, missed.length);
});

test('the same seed gives the same run', () => {
  const run = (seed) => {
    const g = createGame({ seed, tuning: { spawnEvery: 0.3, spawnJitter: 0 } });
    g.setAspect(0.5);
    const xs = [];
    g.on('spawn', ({ entity }) => xs.push(entity.pos.x.toFixed(6)));
    for (let i = 0; i < 300; i++) g.update(1 / 60);
    return xs.join('|');
  };
  assert.equal(run(777), run(777));
  assert.notEqual(run(777), run(778));
});

test('slicing removes the object and awards points', () => {
  const game = createGame({ seed: 42, tuning: { spawnEvery: 0.3, spawnJitter: 0 } });
  game.setAspect(0.5);
  for (let i = 0; i < 40; i++) game.update(1 / 60);

  const entity = [...game.entities.values()][0];
  assert.ok(entity, 'there should be at least one object in flight');

  const p = project(entity);
  game.beginStroke();
  const cut = game.trySlice(
    { ax: p.x - 200, ay: p.y, bx: p.x + 200, by: p.y, dtMs: 60 },
    project,
  );

  assert.equal(cut, 1);
  assert.ok(!game.entities.has(entity.id));
  // Points come from the sliced ingredient's type, not from a global base —
  // see config/ingredients.js and tests/ingredients.test.js.
  assert.equal(game.scoring.score, entity.type.score);
});

test('reset clears the state', () => {
  const game = createGame({ seed: 1 });
  game.setAspect(1);
  for (let i = 0; i < 200; i++) game.update(1 / 60);
  game.reset();
  assert.equal(game.entities.size, 0);
  assert.equal(game.scoring.score, 0);
  assert.equal(game.scoring.misses, 0);
});
