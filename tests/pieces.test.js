import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';
import { createRng } from '../src/core/rng.js';
import { createEntity } from '../src/core/entities.js';
import { splitEntity, multiplierFor, canSliceDepth, MAX_DEPTH, MULTIPLIERS } from '../src/core/pieces.js';

/**
 * Multi-level slicing. What is pinned down here is the chain of rules that
 * makes it a game rather than a particle toy: a piece is a real object, it
 * pays more than its parent, it cannot be cut the instant it appears, and it
 * has no say in the orders layer.
 */

const project = (e) => ({ x: 200 + e.pos.x * 10, y: 300 - e.pos.y * 10, r: 25 });
const swipe = (p, dtMs = 20) => ({ ax: p.x - 25, ay: p.y, bx: p.x + 25, by: p.y, dtMs });

test('the multiplier table defines the depth limit', () => {
  assert.equal(MAX_DEPTH, MULTIPLIERS.length);
  assert.equal(multiplierFor(0), MULTIPLIERS[0]);
  assert.equal(multiplierFor(MAX_DEPTH + 5), MULTIPLIERS[MULTIPLIERS.length - 1], 'clamped, never undefined');
  assert.ok(canSliceDepth(MAX_DEPTH - 1));
  assert.ok(!canSliceDepth(MAX_DEPTH));
});

test('the multipliers rise with depth', () => {
  for (let i = 1; i < MULTIPLIERS.length; i++) {
    assert.ok(MULTIPLIERS[i] > MULTIPLIERS[i - 1], `level ${i} must pay more than ${i - 1}`);
  }
});

test('a cut produces two smaller pieces flying apart along the cut normal', () => {
  const rng = createRng(1);
  const parent = createEntity({ radius: 0.8 });
  parent.vel.y = 5;
  const normal = { x: 1, y: 0, z: 0 };

  const [a, b] = splitEntity(parent, normal, { separation: 3, halfSpin: 6, pieceArmTime: 0.12 }, rng);

  assert.equal(a.depth, 1);
  assert.equal(b.depth, 1);
  assert.ok(a.radius < parent.radius && a.radius > 0);
  assert.equal(a.side, 1);
  assert.equal(b.side, -1);
  assert.ok(a.vel.x > parent.vel.x, 'one piece is pushed along the normal');
  assert.ok(b.vel.x < parent.vel.x, 'the other against it');
  assert.ok(a.vel.y > 0 && b.vel.y > 0, 'both keep the parent motion');
  assert.deepEqual(a.cut, normal);
});

test('nothing is produced past the depth limit', () => {
  const rng = createRng(1);
  const last = createEntity({ radius: 0.4, depth: MAX_DEPTH });
  assert.deepEqual(splitEntity(last, { x: 1, y: 0, z: 0 }, { separation: 3 }, rng), []);
});

test('a fresh piece cannot be cut until it is armed', () => {
  const game = createGame({ seed: 3, tuning: { spawnEvery: 0.4, spawnJitter: 0, pieceArmTime: 0.2 } });
  game.setAspect(0.5);
  for (let i = 0; i < 60; i++) game.update(1 / 60);

  const target = [...game.entities.values()][0];
  const p = project(target);
  game.beginStroke();
  assert.equal(game.trySlice(swipe(p), project), 1);

  // The pointer has not moved: the pieces are right under it.
  assert.equal(game.trySlice(swipe(p), project), 0, 'the same swipe must not shred them');
  for (let i = 0; i < 6; i++) game.update(1 / 60);
  assert.equal(game.trySlice(swipe(p), project), 0, 'still inside the window');

  for (let i = 0; i < 12; i++) game.update(1 / 60);
  assert.ok(game.trySlice(swipe(p), project) > 0, 'once armed it can be cut again');
});

test('one held swipe no longer shreds an object to the limit at once', () => {
  const shred = (pieceArmTime) => {
    const game = createGame({ seed: 3, tuning: { spawnEvery: 0.4, spawnJitter: 0, pieceArmTime } });
    game.setAspect(0.5);
    for (let i = 0; i < 60; i++) game.update(1 / 60);
    const p = project([...game.entities.values()][0]);

    let cuts = 0;
    game.on('slice', () => { cuts += 1; });
    game.beginStroke();
    for (let f = 0; f < 6; f++) {
      game.trySlice(swipe(p), project);
      game.update(1 / 60);
    }
    game.endStroke();
    return cuts;
  };

  assert.ok(shred(0) > shred(0.12), 'the arming window has to slow the chain down');
  assert.equal(shred(0.12), 1, 'within a tenth of a second only the first cut lands');
});

test('cutting a piece pays its own multiplier', () => {
  const game = createGame({ seed: 3, tuning: { spawnEvery: 0.4, spawnJitter: 0, pieceArmTime: 0 } });
  game.setAspect(0.5);
  for (let i = 0; i < 60; i++) game.update(1 / 60);

  const gains = [];
  game.on('slice', ({ depth, multiplier, entity }) => gains.push({ depth, multiplier, score: entity.type.score }));

  const target = [...game.entities.values()][0];
  game.beginStroke();
  game.trySlice(swipe(project(target)), project);
  const piece = [...game.entities.values()].find((e) => e.depth === 1);
  assert.ok(piece, 'the cut must leave a real, simulated piece behind');
  game.trySlice(swipe(project(piece)), project);
  game.endStroke();

  assert.equal(gains[0].multiplier, MULTIPLIERS[0]);
  assert.equal(gains[1].multiplier, MULTIPLIERS[1]);
  assert.ok(MULTIPLIERS[1] > 1, 'the fixture assumes deeper cuts pay more');
});

test('pieces falling off screen are not misses, and do not touch the recipe', () => {
  const game = createGame({ seed: 3, tuning: { spawnEvery: 0.4, spawnJitter: 0, pieceArmTime: 0 } });
  game.setAspect(0.5);
  game.start();
  for (let i = 0; i < 60; i++) game.update(1 / 60);

  const target = [...game.entities.values()][0];
  const before = { ...game.orders.state };
  game.beginStroke();
  game.trySlice(swipe(project(target)), project);

  // Cut the pieces too, then let everything fall away.
  for (const piece of [...game.entities.values()].filter((e) => e.depth === 1)) {
    game.trySlice(swipe(project(piece)), project);
  }
  game.endStroke();

  const afterSlices = { ...game.orders.state };
  assert.equal(afterSlices.mistakes, before.mistakes, 'only the whole object speaks to the orders layer');

  const gone = [];
  const missed = [];
  game.on('gone', ({ entity }) => gone.push(entity));
  game.on('miss', ({ entity }) => missed.push(entity));
  for (let i = 0; i < 600; i++) game.update(1 / 60);

  assert.ok(gone.length > 0, 'pieces must be reported as gone so the view can release them');
  assert.ok(gone.every((e) => e.depth > 0), 'only pieces go quietly');
  // Whole objects launched meanwhile still count; pieces never do.
  assert.ok(missed.length > 0, 'the fixture should still see untouched objects fall');
  assert.ok(missed.every((e) => e.depth === 0), 'a piece must never be counted as a miss');
  assert.equal(game.scoring.misses, missed.length);
});

test('the cut bonus counts extra cuts only, and resets with the recipe', () => {
  const game = createGame({ seed: 3, tuning: { spawnEvery: 0.4, spawnJitter: 0, pieceArmTime: 0 } });
  game.setAspect(0.5);
  game.start();
  for (let i = 0; i < 60; i++) game.update(1 / 60);

  const whole = [...game.entities.values()].find((e) => e.depth === 0);
  game.beginStroke();
  game.trySlice(swipe(project(whole)), project);
  assert.equal(game.scoring.cutBonus, 0, 'the first cut of an object is not an extra cut');

  const scoreAfterFirst = game.scoring.score;
  let expected = 0;
  for (const piece of [...game.entities.values()].filter((e) => e.depth === 1)) {
    const before = game.scoring.score;
    game.trySlice(swipe(project(piece)), project);
    expected += game.scoring.score - before;
  }
  game.endStroke();

  assert.ok(expected > 0, 'the fixture must actually cut some pieces');
  assert.equal(game.scoring.cutBonus, expected, 'it holds exactly what the extra cuts paid');
  assert.equal(game.scoring.score, scoreAfterFirst + expected,
    'the bonus is a running total of points already awarded, never a second payment');

  game.reset();
  assert.equal(game.scoring.cutBonus, 0);
});

test('the slice event carries the running cut bonus for the HUD', () => {
  const game = createGame({ seed: 3, tuning: { spawnEvery: 0.4, spawnJitter: 0, pieceArmTime: 0 } });
  game.setAspect(0.5);
  game.start();
  for (let i = 0; i < 60; i++) game.update(1 / 60);

  const seen = [];
  game.on('slice', ({ depth, cutBonus }) => seen.push({ depth, cutBonus }));

  const whole = [...game.entities.values()].find((e) => e.depth === 0);
  game.beginStroke();
  game.trySlice(swipe(project(whole)), project);
  const piece = [...game.entities.values()].find((e) => e.depth === 1);
  game.trySlice(swipe(project(piece)), project);
  game.endStroke();

  // One swipe can catch both pieces, so the count of events is not fixed —
  // what matters is that the first cut reports nothing and the running total
  // rises with every cut after it.
  assert.equal(seen[0].depth, 0);
  assert.equal(seen[0].cutBonus, 0);
  assert.ok(seen.length > 1, 'at least one piece has to be cut');
  assert.ok(seen.slice(1).every((e) => e.depth > 0 && e.cutBonus > 0));
  assert.equal(seen[seen.length - 1].cutBonus, game.scoring.cutBonus,
    'the last event carries the current total');
});
