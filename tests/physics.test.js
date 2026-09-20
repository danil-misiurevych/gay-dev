import { test } from 'node:test';
import assert from 'node:assert/strict';
import { integrate, launchSpeedForApex, timeToApex } from '../src/core/physics.js';
import { computeBounds } from '../src/core/bounds.js';
import { createEntity, resetIds } from '../src/core/entities.js';

test('an object launched at a given apex actually reaches it', () => {
  const gravity = 24;
  const fromY = -8;
  const apexY = 2.5;

  resetIds();
  const e = createEntity();
  e.pos.y = fromY;
  e.vel.y = launchSpeedForApex(gravity, fromY, apexY);

  // Integrate in small steps until the vertical speed changes sign.
  let peak = fromY;
  const dt = 1 / 600;
  for (let i = 0; i < 6000 && e.vel.y > 0; i++) {
    integrate(e, gravity, dt);
    peak = Math.max(peak, e.pos.y);
  }
  assert.ok(Math.abs(peak - apexY) < 0.05, `apex ${peak.toFixed(3)} instead of ${apexY}`);
});

test('rise time grows with the launch speed', () => {
  assert.ok(timeToApex(24, 20) > timeToApex(24, 10));
});

test('world bounds keep a minimum width on a narrow screen', () => {
  // A phone in portrait: without the correction the playfield becomes a narrow chimney.
  const phone = computeBounds(390 / 780);
  assert.ok(phone.halfW >= 5.19, `halfW = ${phone.halfW}`);
  assert.ok(phone.killY < -phone.halfH);

  const desktop = computeBounds(1920 / 1080);
  assert.ok(desktop.halfW > phone.halfW);
});
