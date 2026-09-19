import './styles.css';

import { createGame } from './core/game.js';
import { createRng } from './core/rng.js';
import { createScene, QUALITY } from './render/scene.js';
import { createEntityView } from './render/entity-view.js';
import { createEffects } from './render/effects.js';
import { PALETTE } from './render/palette.js';
import { createPointerInput } from './input/pointer.js';
import { createOverlay } from './ui/overlay.js';
import { createHud } from './ui/hud.js';
import { createTuningPanel, loadStoredTuning } from './ui/tuning-panel.js';
import { createPlatform } from './platform/index.js';

/**
 * Sklejenie warstw. Ten plik nie zawiera logiki gry — tylko podpiecie
 * rdzenia do renderowania, wejscia i UI. Jesli zaczyna tu przybywac
 * warunkow rozgrywki, znaczy ze cos powinno trafic do src/core/.
 */
const stage = document.getElementById('stage');
const glCanvas = document.getElementById('gl');
const fxCanvas = document.getElementById('fx');
const hudRoot = document.getElementById('hud');
const panel = document.getElementById('panel');

const platform = createPlatform();
const rng = createRng();

const game = createGame({ tuning: loadStoredTuning(), paletteSize: PALETTE.length });
const view = createScene(glCanvas);
const entityView = createEntityView({ scene: view.scene, cutBasis: view.cutBasis });
const effects = createEffects({ scene: view.scene });
const overlay = createOverlay(fxCanvas);
const hud = createHud(hudRoot);

let paused = false;
let introVisible = true;

/* ---------------------------------------------------------------- zdarzenia rdzenia */

game.on('spawn', ({ entity }) => entityView.onSpawn(entity));

game.on('slice', ({ entity, x, y, dirX, dirY, gain, combo }) => {
  entityView.onRemove(entity);
  const { normal } = entityView.onSlice(entity, dirX, dirY, game.tuning, rng);
  effects.burst(entity, normal, game.tuning, rng);
  overlay.addFlash(x, y, dirX, dirY);
  overlay.addPopup(x, y, `+${gain}`, combo > 1);
  if (combo > 1) overlay.addPopup(x, y - 26, `COMBO ×${combo}`, true);
  hud.setScore(game.scoring.score);
  hud.setCombo(game.scoring.bestCombo);
});

game.on('miss', ({ entity, misses }) => {
  entityView.onRemove(entity);
  hud.setMisses(misses);
  hud.flashMiss();
});

game.on('reset', () => {
  entityView.clear();
  effects.clear();
  overlay.clearTransient();
  hud.setScore(0); hud.setCombo(0); hud.setMisses(0);
});

/* ---------------------------------------------------------------- wejscie */

const input = createPointerInput(stage, {
  onStrokeStart: () => {
    game.beginStroke();
    if (introVisible) hideIntro();
  },
  onSegment: (segment) => { if (!paused) game.trySlice(segment, view.project); },
  onStrokeEnd: () => game.endStroke(),
});

/* ---------------------------------------------------------------- rozmiar */

function resize() {
  const w = stage.clientWidth || window.innerWidth;
  const h = stage.clientHeight || window.innerHeight;
  const bounds = game.setAspect(w / h);
  view.resize(w, h, bounds);
  overlay.resize(w, h, Math.min(window.devicePixelRatio || 1, 2));
}
window.addEventListener('resize', resize);

/* ---------------------------------------------------------------- petla */

let last = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dtMs = now - last;
  // Przyciecie dt: po powrocie z tla dtMs potrafi wynosic kilka sekund,
  // a nieprzyciety krok wyrzuca wszystkie obiekty poza ekran i psuje symulacje.
  const dt = Math.min(dtMs / 1000, 0.05);
  last = now;

  if (!paused) {
    hud.tickFps(dt);
    game.update(dt);
    entityView.sync(game.entities);
    entityView.updateHalves(dt, game.tuning.gravity, game.bounds.killY);
    effects.update(dt, game.tuning.gravity);
    view.render();
  }

  input.prune(now, game.tuning.trailLife);
  overlay.draw({
    trail: input.trail,
    trailLife: game.tuning.trailLife,
    now,
    dtMs: Math.min(dtMs, 50),
    hitboxes: game.tuning.showHit
      ? [...game.entities.values()].map((e) => {
          const p = view.project(e);
          return { x: p.x, y: p.y, r: p.r * game.tuning.hitScale };
        })
      : null,
  });
}

/* ---------------------------------------------------------------- UI */

const pauseBtn = document.getElementById('btn-pause');
const hitBtn = document.getElementById('btn-hit');

function setPaused(value) {
  paused = value;
  game.setPaused(value);
  pauseBtn.setAttribute('aria-pressed', String(value));
  pauseBtn.textContent = value ? 'Wznów' : 'Pauza';
  if (value) platform.gameplayStop(); else { last = performance.now(); platform.gameplayStart(); }
}

pauseBtn.addEventListener('click', () => setPaused(!paused));
hitBtn.addEventListener('click', () => {
  game.setTuning({ showHit: !game.tuning.showHit });
  hitBtn.setAttribute('aria-pressed', String(game.tuning.showHit));
});

document.getElementById('btn-panel').addEventListener('click', () => panel.classList.add('open'));
document.getElementById('btn-close').addEventListener('click', () => panel.classList.remove('open'));

document.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P') pauseBtn.click();
  if (e.key === 'h' || e.key === 'H') hitBtn.click();
});

const intro = document.getElementById('intro');
function hideIntro() {
  introVisible = false;
  intro.classList.add('gone');
  setTimeout(() => { intro.hidden = true; }, 600);
}

createTuningPanel({
  root: panel,
  game,
  onQuality: (level) => view.setQuality(level),
  onReset: () => game.reset(),
});

let storedQuality = 'high';
try { storedQuality = localStorage.getItem('slicelab.quality') || 'high'; } catch { /* prywatne okno */ }
if (storedQuality in QUALITY) view.setQuality(storedQuality);
panel.querySelector(`#quality-row button[data-q="${storedQuality}"]`)?.setAttribute('aria-pressed', 'true');

// Platformy oczekuja, ze gra sama zglasza pauze przy utracie widocznosci.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !paused) setPaused(true);
});

/* ---------------------------------------------------------------- start */

// Start jest opakowany w funkcje zamiast top-level await celowo: top-level
// await wymaga celu es2022, a to odcina starsze przegladarki mobilne, ktore
// na platformach z grami HTML5 nadal stanowia zauwazalny udzial ruchu.
async function boot() {
  await platform.ready();
  platform.gameplayStart();
  resize();
  requestAnimationFrame((t) => { last = t; frame(t); });

  if (import.meta.env?.DEV) {
    // Ulatwia zglaszanie bugow: ziarno pozwala odtworzyc dokladnie ten przebieg.
    console.info(`[slice-lab] platform=${platform.name} seed=${game.seed}`);
  }
}

boot();
