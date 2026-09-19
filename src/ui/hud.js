/**
 * HUD: liczniki na gorze ekranu.
 *
 * Wlascicielem warstwy wizualnej HUD-u jest osoba od UX/UI — patrz
 * docs/UI-SPEC.md. Ten modul odpowiada wylacznie za wpisywanie wartosci
 * do istniejacych elementow, nie za ich wyglad.
 */
export function createHud(root) {
  const el = (id) => root.querySelector(`#${id}`);
  const nodes = {
    score: el('v-score'),
    combo: el('v-combo'),
    miss: el('v-miss'),
    fps: el('v-fps'),
    missBox: el('s-miss'),
  };

  let fpsAcc = 0;
  let fpsFrames = 0;

  return {
    setScore(v) { nodes.score.textContent = v; },
    setCombo(v) { nodes.combo.textContent = `×${v}`; },
    setMisses(v) { nodes.miss.textContent = v; },

    flashMiss() {
      nodes.missBox.classList.remove('flash');
      void nodes.missBox.offsetWidth; // wymusza restart animacji
      nodes.missBox.classList.add('flash');
    },

    /** Licznik FPS usredniany w oknie polsekundowym — chwilowe wahania sa bez znaczenia. */
    tickFps(dt) {
      fpsAcc += dt;
      fpsFrames += 1;
      if (fpsAcc > 0.5) {
        nodes.fps.textContent = Math.round(fpsFrames / fpsAcc);
        fpsAcc = 0;
        fpsFrames = 0;
      }
    },
  };
}
