/**
 * Pointer input: one code path for mouse, finger and stylus (Pointer Events).
 *
 * Two things that are easy to miss and wreck the feel on a phone:
 *
 * 1. getCoalescedEvents() — a phone browser samples touch more often than it
 *    refreshes the screen (often 120 or 240 Hz against a 60 Hz display) and by
 *    default hands over only the last sample per frame. Without reading the
 *    intermediate samples, a fast swipe loses tens of pixels of its path and
 *    objects "fly through the blade" without being hit.
 *
 * 2. touch-action: none on the element — without it the browser captures
 *    vertical drags as page scrolling and slicing upwards stops working.
 */
export function createPointerInput(element, { onStrokeStart, onSegment, onStrokeEnd }) {
  const trail = [];
  let down = false;

  const point = (e) => {
    const rect = element.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now() };
  };

  function handleDown(e) {
    if (e.target.closest?.('[data-ui]')) return;
    down = true;
    trail.length = 0;
    trail.push(point(e));
    try { element.setPointerCapture(e.pointerId); } catch { /* not important */ }
    onStrokeStart?.();
  }

  function handleMove(e) {
    if (!down) return;
    const samples = e.getCoalescedEvents?.() ?? [e];
    for (const sample of samples) {
      const p = point(sample);
      const prev = trail[trail.length - 1];
      trail.push(p);
      if (prev) {
        onSegment?.({ ax: prev.x, ay: prev.y, bx: p.x, by: p.y, dtMs: p.t - prev.t });
      }
    }
  }

  function handleUp() {
    if (!down) return;
    down = false;
    onStrokeEnd?.();
  }

  element.addEventListener('pointerdown', handleDown);
  element.addEventListener('pointermove', handleMove);
  globalThis.addEventListener('pointerup', handleUp);
  globalThis.addEventListener('pointercancel', handleUp);
  element.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    trail,
    get isDown() { return down; },
    /** Drops points older than lifeMs. Called once per frame by the trail drawing. */
    prune(now, lifeMs) {
      while (trail.length && now - trail[0].t > lifeMs) trail.shift();
    },
    dispose() {
      element.removeEventListener('pointerdown', handleDown);
      element.removeEventListener('pointermove', handleMove);
      globalThis.removeEventListener('pointerup', handleUp);
      globalThis.removeEventListener('pointercancel', handleUp);
    },
  };
}
