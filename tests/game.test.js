import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/core/game.js';

/**
 * Te testy uruchamiaja PELNA petle gry bez przegladarki i bez Three.js.
 * To jest cala wartosc podzialu na rdzen i renderowanie: regresja
 * w logice ciecia czy punktacji wychodzi w sekunde, w terminalu.
 */

const project = (e) => ({ x: 200 + e.pos.x * 10, y: 300 - e.pos.y * 10, r: 25 });

test('gra wyrzuca obiekty i zglasza nietrafienia', () => {
  const game = createGame({ seed: 12345, tuning: { spawnEvery: 0.3, spawnJitter: 0 } });
  game.setAspect(0.5);

  const spawned = [];
  const missed = [];
  game.on('spawn', (e) => spawned.push(e));
  game.on('miss', (e) => missed.push(e));

  for (let i = 0; i < 600; i++) game.update(1 / 60);

  assert.ok(spawned.length > 5, `wyrzuconych: ${spawned.length}`);
  assert.ok(missed.length > 0, 'obiekty nietkniete musza w koncu spasc ponizej granicy');
  assert.equal(game.scoring.misses, missed.length);
});

test('ta sama wartosc ziarna daje ten sam przebieg', () => {
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

test('ciecie usuwa obiekt i przyznaje punkty', () => {
  const game = createGame({ seed: 42, tuning: { spawnEvery: 0.3, spawnJitter: 0 } });
  game.setAspect(0.5);
  for (let i = 0; i < 40; i++) game.update(1 / 60);

  const entity = [...game.entities.values()][0];
  assert.ok(entity, 'powinien byc co najmniej jeden obiekt w locie');

  const p = project(entity);
  game.beginStroke();
  const cut = game.trySlice(
    { ax: p.x - 200, ay: p.y, bx: p.x + 200, by: p.y, dtMs: 60 },
    project,
  );

  assert.equal(cut, 1);
  assert.ok(!game.entities.has(entity.id));
  assert.equal(game.scoring.score, game.tuning.scoreBase);
});

test('reset czysci stan', () => {
  const game = createGame({ seed: 1 });
  game.setAspect(1);
  for (let i = 0; i < 200; i++) game.update(1 / 60);
  game.reset();
  assert.equal(game.entities.size, 0);
  assert.equal(game.scoring.score, 0);
  assert.equal(game.scoring.misses, 0);
});
