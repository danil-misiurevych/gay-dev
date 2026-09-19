/**
 * Wejscie wskaznika: jeden kod obsluguje mysz, palec i rysik (Pointer Events).
 *
 * Dwie rzeczy, ktore latwo przeoczyc, a psuja odczucie na telefonie:
 *
 * 1. getCoalescedEvents() — przegladarka na telefonie probkuje dotyk czesciej
 *    niz odswieza ekran (czesto 120 lub 240 Hz przy 60 Hz obrazu) i domyslnie
 *    oddaje tylko ostatnia probke na klatke. Bez odczytania probek posrednich
 *    szybki swipe gubi po kilkadziesiat pikseli trasy i obiekty "przelatuja
 *    przez ostrze" bez trafienia.
 *
 * 2. touch-action: none na elemencie — bez tego przegladarka przechwytuje
 *    pionowe przeciagniecia jako przewijanie strony i ciecie w gore przestaje
 *    dzialac.
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
    try { element.setPointerCapture(e.pointerId); } catch { /* nieistotne */ }
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
    /** Usuwa punkty starsze niz lifeMs. Wywolywane raz na klatke przez rysowanie sladu. */
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
