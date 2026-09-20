/**
 * HUD: the counters at the top of the screen.
 *
 * The visual layer of the HUD is owned by the UX/UI person — see
 * docs/UI-SPEC.md. This module is responsible only for writing values into
 * existing elements, not for how they look.
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
      void nodes.missBox.offsetWidth; // forces the animation to restart
      nodes.missBox.classList.add('flash');
    },

    /** FPS counter averaged over half a second — momentary jitter is meaningless. */
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
