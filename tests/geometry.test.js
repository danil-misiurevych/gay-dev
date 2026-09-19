import { test } from 'node:test';
import assert from 'node:assert/strict';
import { segmentPointDistance, segmentIntersectsCircle, strokeSpeed } from '../src/core/geometry2d.js';

test('odleglosc od odcinka: rzut pada wewnatrz odcinka', () => {
  assert.equal(segmentPointDistance(0, 0, 10, 0, 5, 3), 3);
});

test('odleglosc od odcinka: rzut pada poza odcinkiem, liczymy do konca', () => {
  // Punkt (20, 0) jest za koncem odcinka (0,0)-(10,0) — odleglosc to 10, nie 0.
  assert.equal(segmentPointDistance(0, 0, 10, 0, 20, 0), 10);
});

test('szybki swipe trafia obiekt lezacy MIEDZY klatkami', () => {
  // To jest powod, dla ktorego test jest odcinkiem, a nie punktem: palec
  // przeskoczyl z x=0 do x=400, obiekt stoi w polowie trasy. Test punktowy
  // sprawdzilby tylko konce i przepuscilby go.
  assert.ok(segmentIntersectsCircle(0, 300, 400, 300, 200, 305, 20));
});

test('obiekt obok trasy ruchu nie zostaje trafiony', () => {
  assert.ok(!segmentIntersectsCircle(0, 300, 400, 300, 200, 400, 20));
});

test('predkosc swipe a w px/ms', () => {
  assert.equal(strokeSpeed(0, 0, 100, 0, 200), 0.5);
});

test('zerowy czas nie powoduje dzielenia przez zero', () => {
  assert.ok(Number.isFinite(strokeSpeed(0, 0, 100, 0, 0)));
});
