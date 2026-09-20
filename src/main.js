import './styles.css';

import { createGame } from './core/game.js';
import { MULTIPLIERS } from './core/pieces.js';
import { createRng } from './core/rng.js';
import { createScene, QUALITY } from './render/scene.js';
import { createEntityView } from './render/entity-view.js';
import { createEffects } from './render/effects.js';
import { createPointerInput } from './input/pointer.js';
import { createOverlay } from './ui/overlay.js';
import { createHud } from './ui/hud.js';
import { createRecipeCard } from './ui/recipe.js';
import { createTuningPanel, loadStoredTuning } from './ui/tuning-panel.js';
import { createPlatform } from './platform/index.js';

/**
 * Wiring the layers together. This file contains no game logic — only the
 * hookup between the core, rendering, input and UI. If gameplay conditions
 * start piling up here, something belongs in src/core/ instead.
 */
const stage = document.getElementById('stage');
const glCanvas = document.getElementById('gl');
const fxCanvas = document.getElementById('fx');
const hudRoot = document.getElementById('hud');
const panel = document.getElementById('panel');

const platform = createPlatform();
const rng = createRng();

const game = createGame({ tuning: loadStoredTuning() });
const view = createScene(glCanvas);
const entityView = createEntityView({ scene: view.scene, cutBasis: view.cutBasis });
const effects = createEffects({ scene: view.scene });
const overlay = createOverlay(fxCanvas);
const hud = createHud(hudRoot);
const recipeCard = createRecipeCard(document.getElementById('recipe'));

let paused = false;
let introVisible = true;

/* ---------------------------------------------------------------- core events */

game.on('spawn', ({ entity }) => entityView.onSpawn(entity));

game.on('slice', ({ entity, x, y, dirX, dirY, gain, combo, multiplier, depth, pieces, cutBonus }) => {
  entityView.onRemove(entity);
  // Pieces the core kept simulating draw themselves through 'spawn'. Only the
  // last cut, which leaves nothing playable, needs the fading debris halves.
  const normal = pieces.length
    ? pieces[0].cut
    : entityView.onSlice(entity, dirX, dirY, game.tuning, rng).normal;

  effects.burst(entity, normal, game.tuning, rng);
  overlay.addFlash(x, y, dirX, dirY);
  // The ingredient name is shown next to the points so the type that was hit
  // is readable while testing. The orders layer (M2) is what will make it matter.
  // 0 for a whole object, 1 for the deepest cut there is — the popup grows
  // and warms towards yellow along the way.
  const level = MULTIPLIERS.length > 1 ? Math.min(1, depth / (MULTIPLIERS.length - 1)) : 0;
  const label = multiplier > 1 ? `+${gain} ×${multiplier}` : `+${gain} ${entity.type.name}`;
  overlay.addPopup(x, y, label, combo > 1, level);
  if (combo > 1) overlay.addPopup(x, y - 26, `COMBO ×${combo}`, true);
  hud.setScore(game.scoring.score);
  hud.setCombo(game.scoring.bestCombo);
  recipeCard.setCutBonus(cutBonus);
});

game.on('recipe', ({ recipe, result, gain, cutBonus, x, y }) => {
  recipeCard.update(recipe, result, game.orders.timerEnabled, cutBonus ?? 0);
  if (!gain) return;
  hud.setScore(game.scoring.score);
  // A penalty has no cut to point at, so it is shown on the recipe card
  // itself — that is where the player was already looking at the clock.
  const px = x ?? overlay.width / 2;
  const py = y ?? 150;
  const lost = result === 'expired' ? 'TIME UP' : 'WRONG';
  overlay.addPopup(px, py - 52, gain > 0 ? `RECIPE +${gain}` : `${lost} −${-gain}`, true);
});

game.on('miss', ({ entity, misses }) => {
  entityView.onRemove(entity);
  hud.setMisses(misses);
  hud.flashMiss();
});

// A piece that fell off screen: cleaned up, but not a miss — see core/game.js.
game.on('gone', ({ entity }) => entityView.onRemove(entity));

game.on('reset', () => {
  entityView.clear();
  effects.clear();
  overlay.clearTransient();
  hud.setScore(0); hud.setCombo(0); hud.setMisses(0);
});

/* ---------------------------------------------------------------- input */

const input = createPointerInput(stage, {
  onStrokeStart: () => {
    game.beginStroke();
    if (introVisible) hideIntro();
  },
  onSegment: (segment) => { if (!paused) game.trySlice(segment, view.project, view.cutNormal); },
  onStrokeEnd: () => game.endStroke(),
});

/* ---------------------------------------------------------------- sizing */

function resize() {
  const w = stage.clientWidth || window.innerWidth;
  const h = stage.clientHeight || window.innerHeight;
  const bounds = game.setAspect(w / h);
  view.resize(w, h, bounds);
  overlay.resize(w, h, Math.min(window.devicePixelRatio || 1, 2));
}
window.addEventListener('resize', resize);

/* ---------------------------------------------------------------- loop */

let last = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dtMs = now - last;
  // Clamping dt: after coming back from the background dtMs can be several
  // seconds, and an unclamped step throws every object off screen and wrecks
  // the simulation.
  const dt = Math.min(dtMs / 1000, 0.05);
  last = now;

  if (!paused) {
    hud.tickFps(dt);
    game.update(dt);
    entityView.sync(game.entities, dt);
    recipeCard.tick(game.orders.remaining, game.orders.timerEnabled);
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
  pauseBtn.textContent = value ? 'Resume' : 'Pause';
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
try { storedQuality = localStorage.getItem('slicelab.quality') || 'high'; } catch { /* private window */ }
if (storedQuality in QUALITY) view.setQuality(storedQuality);
panel.querySelector(`#quality-row button[data-q="${storedQuality}"]`)?.setAttribute('aria-pressed', 'true');

// Platforms expect the game to report its own pause when visibility is lost.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !paused) setPaused(true);
});

/* ---------------------------------------------------------------- start */

// Startup is wrapped in a function rather than using top-level await on
// purpose: top-level await requires an es2022 target, and that cuts off older
// mobile browsers, which still account for noticeable traffic on HTML5 game
// platforms.
async function boot() {
  await platform.ready();
  platform.gameplayStart();
  game.start();
  resize();
  requestAnimationFrame((t) => { last = t; frame(t); });

  if (import.meta.env?.DEV) {
    // Makes bug reports easier: the seed replays exactly this run.
    console.info(`[slice-lab] platform=${platform.name} seed=${game.seed}`);
  }
}

boot();
