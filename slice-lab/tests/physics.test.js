import { test } from 'node:test';
import assert from 'node:assert/strict';
import { integrate, launchSpeedForApex, timeToApex } from '../src/core/physics.js';
import { computeBounds } from '../src/core/bounds.js';
import { createEntity, resetIds } from '../src/core/entities.js';

test('obiekt wyrzucony na zadane apogeum faktycznie tam dolatuje', () => {
  const gravity = 24;
  const fromY = -8;
  const apexY = 2.5;

  resetIds();
  const e = createEntity();
  e.pos.y = fromY;
  e.vel.y = launchSpeedForApex(gravity, fromY, apexY);

  // Calkowanie malym krokiem do momentu, w ktorym predkosc pionowa zmienia znak.
  let peak = fromY;
  const dt = 1 / 600;
  for (let i = 0; i < 6000 && e.vel.y > 0; i++) {
    integrate(e, gravity, dt);
    peak = Math.max(peak, e.pos.y);
  }
  assert.ok(Math.abs(peak - apexY) < 0.05, `apogeum ${peak.toFixed(3)} zamiast ${apexY}`);
});

test('czas wznoszenia rosnie z predkoscia poczatkowa', () => {
  assert.ok(timeToApex(24, 20) > timeToApex(24, 10));
});

test('granice swiata trzymaja minimalna szerokosc na waskim ekranie', () => {
  // Telefon w pionie: bez korekty pole gry zrobiloby sie waskim kominem.
  const phone = computeBounds(390 / 780);
  assert.ok(phone.halfW >= 5.19, `halfW = ${phone.halfW}`);
  assert.ok(phone.killY < -phone.halfH);

  const desktop = computeBounds(1920 / 1080);
  assert.ok(desktop.halfW > phone.halfW);
});
