import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findSliceHits } from '../src/core/slicing.js';
import { createEntity, resetIds } from '../src/core/entities.js';

/** Stand-in projection: an object sits where its position says, radius 30 px. */
const project = (e) => ({ x: e.pos.x, y: e.pos.y, r: 30 });
const tuning = { minSwipeSpeed: 0.3, hitScale: 1 };

function entityAt(x, y) {
  const e = createEntity();
  e.pos.x = x;
  e.pos.y = y;
  return e;
}

test('a fast swipe through an object cuts it', () => {
  resetIds();
  const list = [entityAt(200, 300)];
  const hits = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100 }, list, project, tuning);
  assert.equal(hits.length, 1);
});

test('a slow movement does not cut, even straight through the centre of an object', () => {
  // Without the speed threshold the game could be won by crawling a finger across the screen.
  resetIds();
  const list = [entityAt(200, 300)];
  const hits = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100000 }, list, project, tuning);
  assert.equal(hits.length, 0);
});

test('a single stroke cuts several objects at once', () => {
  resetIds();
  const list = [entityAt(100, 300), entityAt(250, 300), entityAt(380, 300)];
  const hits = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100 }, list, project, tuning);
  assert.equal(hits.length, 3);
});

test('the hitbox multiplier widens hits', () => {
  resetIds();
  const list = [entityAt(200, 340)]; // 40 px off the path, radius 30
  const strict = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100 }, list, project, tuning);
  const loose = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100 }, list, project,
    { ...tuning, hitScale: 1.5 });
  assert.equal(strict.length, 0);
  assert.equal(loose.length, 1);
});

test('dead objects are skipped', () => {
  resetIds();
  const e = entityAt(200, 300);
  e.alive = false;
  const hits = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100 }, [e], project, tuning);
  assert.equal(hits.length, 0);
});
