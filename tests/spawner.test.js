import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';
import { computeBounds } from '../src/core/bounds.js';

/**
 * Objects enter either from below or from one of the side edges. What is
 * pinned down here is the contract of an entry, not the exact numbers: it
 * starts off screen, it flies inwards, and it reaches the same apex whichever
 * edge it came from — otherwise the two kinds would feel like different games.
 */

const collect = (tuning, frames = 1800) => {
  const game = createGame({ seed: 21, tuning: { spawnEvery: 0.25, spawnJitter: 0, ...tuning } });
  game.setAspect(0.5);
  const spawned = [];
  game.on('spawn', ({ entity }) => spawned.push({
    x: entity.pos.x, y: entity.pos.y, vx: entity.vel.x, vy: entity.vel.y,
  }));
  for (let i = 0; i < frames; i++) game.update(1 / 60);
  return { spawned, bounds: game.bounds, tuning: game.tuning };
};

test('at ratio 0 everything still comes from below', () => {
  const { spawned, bounds } = collect({ sideSpawnRatio: 0 });
  assert.ok(spawned.length > 10);
  for (const e of spawned) {
    assert.ok(Math.abs(e.x) < bounds.halfW, `x = ${e.x} should be on screen`);
    assert.ok(e.y < bounds.killY + 1, `y = ${e.y} should be below the bottom edge`);
  }
});

test('at ratio 1 everything enters from a side, off screen and aimed inwards', () => {
  const { spawned, bounds } = collect({ sideSpawnRatio: 1 });
  assert.ok(spawned.length > 10);

  const sides = new Set();
  for (const e of spawned) {
    assert.ok(Math.abs(e.x) > bounds.halfW, `x = ${e.x} must start outside the screen`);
    assert.ok(e.y > bounds.killY, 'a side launch must start above the kill line');
    assert.ok(e.vy > 0, 'it still has to rise');
    assert.ok(Math.sign(e.vx) === -Math.sign(e.x), 'it must fly towards the centre');
    sides.add(Math.sign(e.x));
  }
  assert.equal(sides.size, 2, 'both the left and the right edge must be used');
});

test('both edges are mixed in at the default ratio', () => {
  const { spawned, bounds } = collect({});
  const fromSide = spawned.filter((e) => Math.abs(e.x) > bounds.halfW).length;
  assert.ok(fromSide > 0, 'some launches should come from the sides');
  assert.ok(fromSide < spawned.length, 'some launches should still come from below');
});

test('a side launch reaches the same apex as one from below', () => {
  const bounds = computeBounds(0.5);
  const tuning = { gravity: 24, apexRatio: 0.42 };
  const apexOf = (e) => e.y + (e.vy * e.vy) / (2 * tuning.gravity);
  const target = bounds.halfH * tuning.apexRatio;

  for (const ratio of [0, 1]) {
    const { spawned } = collect({ ...tuning, sideSpawnRatio: ratio });
    for (const e of spawned) {
      assert.ok(Math.abs(apexOf(e) - target) < 0.01,
        `apex ${apexOf(e).toFixed(3)} instead of ${target.toFixed(3)}`);
    }
  }
});

test('an object launched from a side eventually falls below the kill line', () => {
  const game = createGame({ seed: 5, tuning: { spawnEvery: 0.3, spawnJitter: 0, sideSpawnRatio: 1 } });
  game.setAspect(0.5);
  let missed = 0;
  game.on('miss', () => { missed += 1; });
  for (let i = 0; i < 1200; i++) game.update(1 / 60);
  assert.ok(missed > 0, 'side launches must not stay in flight forever');
});
