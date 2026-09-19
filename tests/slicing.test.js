import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findSliceHits } from '../src/core/slicing.js';
import { createEntity, resetIds } from '../src/core/entities.js';

/** Zastepcze rzutowanie: obiekt siedzi tam, gdzie mowi jego pozycja, promien 30 px. */
const project = (e) => ({ x: e.pos.x, y: e.pos.y, r: 30 });
const tuning = { minSwipeSpeed: 0.3, hitScale: 1 };

function entityAt(x, y) {
  const e = createEntity();
  e.pos.x = x;
  e.pos.y = y;
  return e;
}

test('szybki swipe przez obiekt tnie', () => {
  resetIds();
  const list = [entityAt(200, 300)];
  const hits = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100 }, list, project, tuning);
  assert.equal(hits.length, 1);
});

test('powolny ruch nie tnie, nawet gdy przechodzi przez srodek obiektu', () => {
  // Bez progu predkosci dalo by sie wygrac trzymajac palec i pelzajac nim po ekranie.
  resetIds();
  const list = [entityAt(200, 300)];
  const hits = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100000 }, list, project, tuning);
  assert.equal(hits.length, 0);
});

test('jedno pociagniecie tnie kilka obiektow naraz', () => {
  resetIds();
  const list = [entityAt(100, 300), entityAt(250, 300), entityAt(380, 300)];
  const hits = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100 }, list, project, tuning);
  assert.equal(hits.length, 3);
});

test('mnoznik hitboxa poszerza trafienia', () => {
  resetIds();
  const list = [entityAt(200, 340)]; // 40 px od trasy, promien 30
  const strict = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100 }, list, project, tuning);
  const loose = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100 }, list, project,
    { ...tuning, hitScale: 1.5 });
  assert.equal(strict.length, 0);
  assert.equal(loose.length, 1);
});

test('martwe obiekty sa pomijane', () => {
  resetIds();
  const e = entityAt(200, 300);
  e.alive = false;
  const hits = findSliceHits({ ax: 0, ay: 300, bx: 400, by: 300, dtMs: 100 }, [e], project, tuning);
  assert.equal(hits.length, 0);
});
