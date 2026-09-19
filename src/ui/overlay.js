/**
 * Nakladka 2D: slad ostrza, blysk ciecia, wyskakujace punkty, podglad hitboxow.
 *
 * Dlaczego osobne plotno 2D, a nie geometria w scenie 3D: slad ostrza jest
 * elementem interfejsu, nie swiata gry — zyje w pikselach ekranu, nie
 * w jednostkach swiata, i nie ma sensu, zeby dotykala go perspektywa.
 * Canvas 2D jest przy tym prostszy i tanszy niz wstega w 3D.
 */
export function createOverlay(canvas) {
  const ctx = canvas.getContext('2d');
  const flashes = [];
  const popups = [];
  let w = 1;
  let h = 1;

  return {
    resize(width, height, dpr) {
      w = width; h = height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    addFlash(x, y, dirX, dirY) { flashes.push({ x, y, dirX, dirY, t: 0 }); },
    addPopup(x, y, text, big = false) { popups.push({ x, y, text, big, t: 0 }); },
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
        const k = 1 - p.t / 700;
        if (k <= 0) { popups.splice(i, 1); continue; }
        ctx.font = `${p.big ? '700 17px' : '600 15px'} "Chakra Petch", sans-serif`;
        ctx.fillStyle = p.big
          ? `rgba(157,124,255,${(k * 0.95).toFixed(3)})`
          : `rgba(242,169,59,${(k * 0.95).toFixed(3)})`;
        ctx.fillText(p.text, p.x, p.y - (1 - k) * 44);
      }
    },
  };
}
