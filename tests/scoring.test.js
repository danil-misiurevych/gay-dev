import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScoring } from '../src/core/scoring.js';
import { mergeTuning, defaultTuning } from '../src/core/config.js';

const tuning = { scoreBase: 10, comboBonus: 5 };

test('combo narasta w obrebie jednego pociagniecia', () => {
  const s = createScoring({ tuning });
  s.beginStroke();
  assert.equal(s.registerSlice().gain, 10);
  assert.equal(s.registerSlice().gain, 15);
  assert.equal(s.registerSlice().gain, 20);
  assert.equal(s.score, 45);
  assert.equal(s.bestCombo, 3);
});

test('nowe pociagniecie zeruje combo', () => {
  const s = createScoring({ tuning });
  s.beginStroke();
  s.registerSlice();
  s.registerSlice();
  s.endStroke();
  s.beginStroke();
  assert.equal(s.registerSlice().gain, 10);
  assert.equal(s.bestCombo, 2, 'najlepsze combo w sesji zostaje zapamietane');
});

test('mergeTuning przycina wartosci spoza zakresu', () => {
  assert.equal(mergeTuning({ gravity: 9999 }).gravity, 80);
  assert.equal(mergeTuning({ hitScale: -5 }).hitScale, 0.3);
});

test('mergeTuning ignoruje nieznane klucze i smieci', () => {
  const t = mergeTuning({ nieistniejacy: 1, gravity: 'szybko' });
  assert.equal(t.gravity, defaultTuning().gravity);
  assert.ok(!('nieistniejacy' in t));
});

test('pola calkowite sa zaokraglane', () => {
  assert.equal(mergeTuning({ perSpawn: 2.7 }).perSpawn, 3);
});
