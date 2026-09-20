import { test } from 'node:test';
import assert from 'node:assert/strict';
import { segmentPointDistance, segmentIntersectsCircle, strokeSpeed } from '../src/core/geometry2d.js';

test('distance to a segment: the projection falls inside the segment', () => {
  assert.equal(segmentPointDistance(0, 0, 10, 0, 5, 3), 3);
});

test('distance to a segment: the projection falls outside, so we measure to the end', () => {
  // Point (20, 0) is past the end of segment (0,0)-(10,0) — the distance is 10, not 0.
  assert.equal(segmentPointDistance(0, 0, 10, 0, 20, 0), 10);
});

test('a fast swipe hits an object sitting BETWEEN frames', () => {
  // This is why the test uses a segment rather than a point: the finger
  // jumped from x=0 to x=400 and the object sits halfway along the path.
  // A point test would check only the endpoints and miss it.
  assert.ok(segmentIntersectsCircle(0, 300, 400, 300, 200, 305, 20));
});

test('an object next to the path of movement is not hit', () => {
  assert.ok(!segmentIntersectsCircle(0, 300, 400, 300, 200, 400, 20));
});

test('swipe speed in px/ms', () => {
  assert.equal(strokeSpeed(0, 0, 100, 0, 200), 0.5);
});

test('zero elapsed time does not divide by zero', () => {
  assert.ok(Number.isFinite(strokeSpeed(0, 0, 100, 0, 0)));
});
