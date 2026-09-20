/**
 * The 2D overlay: blade trail, cut flash, score popups, hitbox preview.
 *
 * Why a separate 2D canvas instead of geometry in the 3D scene: the blade
 * trail is part of the interface, not of the game world — it lives in screen
 * pixels rather than world units, and there is no reason for perspective to
 * touch it. A 2D canvas is also simpler and cheaper than a ribbon in 3D.
 */
/**
 * Score popups grow and warm up with the level of the cut: a first cut is
 * small and amber, the deepest one is large and yellow. The player is looking
 * at the object, not at the HUD, so the only way a deep cut can register is if
 * the number itself gets louder. Deeper cuts also linger longer — they are
 * worth more and there is more to read.
 */
const POPUP = {
  lifeMs: 900,
  lifeBoostMs: 520,
  size: 15,
  sizeBig: 17,
  sizeBoost: 13,
  amber: [242, 169, 59],
  yellow: [255, 238, 88],
  violet: [157, 124, 255],
};

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

export function createOverlay(canvas) {
  const ctx = canvas.getContext('2d');
  const flashes = [];
  const popups = [];
  let w = 1;
  let h = 1;

  return {
    /** CSS pixels, so callers can place something centred without the DOM. */
    get width() { return w; },
    get height() { return h; },

    resize(width, height, dpr) {
      w = width; h = height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    addFlash(x, y, dirX, dirY) { flashes.push({ x, y, dirX, dirY, t: 0 }); },
    /**
     * @param {boolean} big   emphasis, used for combos and recipe results
     * @param {number}  level 0..1, how deep the cut was; drives size, colour
     *                        and how long it stays
     */
    addPopup(x, y, text, big = false, level = 0) {
      popups.push({ x, y, text, big, level: Math.min(1, Math.max(0, level)), t: 0 });
    },
    clearTransient() { flashes.length = 0; popups.length = 0; },

    draw({ trail, trailLife, now, dtMs, hitboxes }) {
      ctx.clearRect(0, 0, w, h);

      if (trail.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1];
          const b = trail[i];
          const k = Math.max(0, 1 - (now - b.t) / trailLife);
          ctx.strokeStyle = `rgba(157,124,255,${(0.35 * k).toFixed(3)})`;
          ctx.lineWidth = 4 + 16 * k;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.strokeStyle = `rgba(255,255,255,${(0.85 * k).toFixed(3)})`;
          ctx.lineWidth = 1 + 7 * k;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }

      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.t += dtMs;
        const k = 1 - f.t / 180;
        if (k <= 0) { flashes.splice(i, 1); continue; }
        const len = Math.hypot(f.dirX, f.dirY) || 1;
        const ux = f.dirX / len;
        const uy = f.dirY / len;
        const L = 46 + 70 * (1 - k);
        ctx.strokeStyle = `rgba(242,169,59,${(0.9 * k).toFixed(3)})`;
        ctx.lineWidth = 2.5 * k + 0.5;
        ctx.beginPath();
        ctx.moveTo(f.x - ux * L, f.y - uy * L);
        ctx.lineTo(f.x + ux * L, f.y + uy * L);
        ctx.stroke();
      }

      if (hitboxes) {
        ctx.strokeStyle = 'rgba(79,209,197,.55)';
        ctx.lineWidth = 1;
        for (const c of hitboxes) {
          ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.stroke();
        }
      }

      ctx.textAlign = 'center';
      for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        p.t += dtMs;
        const k = 1 - p.t / (POPUP.lifeMs + p.level * POPUP.lifeBoostMs);
        if (k <= 0) { popups.splice(i, 1); continue; }

        const size = (p.big ? POPUP.sizeBig : POPUP.size) + p.level * POPUP.sizeBoost;
        ctx.font = `${p.big || p.level > 0 ? 700 : 600} ${size.toFixed(1)}px "Chakra Petch", sans-serif`;

        // A levelled popup follows the amber-to-yellow ramp; everything else
        // keeps the old two colours, so combos and recipe results stay apart
        // from the cut chain.
        const [r, g, b] = p.level > 0
          ? mix(POPUP.amber, POPUP.yellow, p.level)
          : (p.big ? POPUP.violet : POPUP.amber);
        ctx.fillStyle = `rgba(${r},${g},${b},${(k * 0.95).toFixed(3)})`;
        ctx.fillText(p.text, p.x, p.y - (1 - k) * (44 + p.level * 20));
      }
    },
  };
}
