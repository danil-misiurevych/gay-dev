import { defaultTuning } from '../core/config.js';
import { INGREDIENTS } from '../../config/ingredients.js';
import { scoreKey } from '../../config/tuning.js';

const STORAGE_KEY = 'slicelab.tuning.v2';

const CONTROLS = [
  { id: 'speed', key: 'minSwipeSpeed', label: 'Swipe speed threshold', min: 0.02, max: 1.5, step: 0.01, fmt: (v) => `${v.toFixed(2)} px/ms` },
  { id: 'hit',   key: 'hitScale',      label: 'Hitbox multiplier',      min: 0.6,  max: 2.2, step: 0.05, fmt: (v) => `×${v.toFixed(2)}` },
  { id: 'trail', key: 'trailLife',     label: 'Blade trail length',     min: 40,   max: 320, step: 5,    fmt: (v) => `${Math.round(v)} ms` },
  { id: 'grav',  key: 'gravity',       label: 'Gravity',                min: 6,    max: 46,  step: 0.5,  fmt: (v) => `${v.toFixed(1)} u/s²` },
  { id: 'apex',  key: 'apexRatio',     label: 'Apex height',            min: 0.12, max: 0.85, step: 0.01, fmt: (v) => `${Math.round(v * 100)}% of screen` },
  { id: 'every', key: 'spawnEvery',    label: 'Gap between launches',   min: 0.25, max: 2.6, step: 0.05, fmt: (v) => `${v.toFixed(2)} s` },
  { id: 'per',   key: 'perSpawn',      label: 'Objects per launch',     min: 1,    max: 4,   step: 1,    fmt: (v) => `${Math.round(v)}` },
  { id: 'side',  key: 'sideSpawnRatio', label: 'Launches from the sides', min: 0,   max: 1,   step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` },
  { id: 'bias',  key: 'recipeBias',     label: 'Flow: wrong ↔ needed',   min: 0,    max: 1,   step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` },
  { id: 'sep',   key: 'separation',    label: 'Half separation impulse', min: 0.3, max: 7,   step: 0.1,  fmt: (v) => `${v.toFixed(1)} u/s` },
  { id: 'spin',  key: 'halfSpin',      label: 'Half spin',              min: 0,    max: 14,  step: 0.2,  fmt: (v) => `${v.toFixed(1)} rad/s` },
  { id: 'burst', key: 'burstCount',    label: 'Particle count',         min: 0,    max: 34,  step: 1,    fmt: (v) => `${Math.round(v)}` },
  { id: 'arm',   key: 'pieceArmTime',   label: 'Piece arming delay',     min: 0,    max: 0.5, step: 0.01, fmt: (v) => `${Math.round(v * 1000)} ms` },
];

/**
 * One slider per ingredient, built from the catalog rather than listed here.
 * Adding an ingredient to config/ingredients.js gives it a slider with no
 * change in this file — the same rule that holds everywhere else for the
 * catalog.
 */
const SCORE_CONTROLS = INGREDIENTS.map((ingredient) => ({
  id: `sc-${ingredient.id}`,
  key: scoreKey(ingredient.id),
  label: ingredient.name,
  min: 0,
  max: 100,
  step: 1,
  fmt: (v) => `${Math.round(v)} pts`,
}));

CONTROLS.push(...SCORE_CONTROLS);

/**
 * Switches. Separate from CONTROLS because a boolean is not a slider: it has
 * no range, no unit and no formatting, and squeezing it into the slider
 * structure would mean a special case in every loop below.
 */
const CHECKS = [
  { id: 'rtimer', key: 'recipeTimer', label: 'Recipe timer', hint: 'Off, a recipe is a checklist with no deadline and no penalty.' },
];

const GROUPS = [
  { title: 'Slice detection', hint: 'A screen-space test: the finger movement segment against a circle around the projected centre of the object.', ids: ['speed', 'hit', 'trail'] },
  { title: 'Ballistics', ids: ['grav', 'apex', 'every', 'per', 'side'] },
  { title: 'Slice reaction', ids: ['sep', 'spin', 'burst', 'arm'] },
  {
    title: 'Recipes',
    hint: 'Flow at 100%: only what the recipe still needs is launched. At 50%: no influence. At 0%: only what you must not cut.',
    ids: ['bias'],
    checks: ['rtimer'],
  },
  {
    title: 'Ingredient scores',
    hint: 'What one piece is worth. A cut piece pays this times the multiplier for its level, and a recipe is worth the sum of what it asks for.',
    ids: SCORE_CONTROLS.map((c) => c.id),
  },
];

export function loadStoredTuning() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/**
 * The live tuning panel.
 *
 * This is the bridge between the gameplay person and the code: values are
 * tuned on the device, exported as JSON and pasted into config/tuning.js.
 * That way changing how the game feels needs no developer and blocks nobody.
 */
export function createTuningPanel({ root, game, onQuality, onReset }) {
  const body = root.querySelector('#panel-body');
  const nums = new Map();
  const ranges = new Map();
  const checks = new Map();

  for (const group of GROUPS) {
    const section = document.createElement('div');
    section.className = 'grp';
    section.innerHTML = `<h3>${group.title}</h3>${group.hint ? `<p class="hint">${group.hint}</p>` : ''}`;
    for (const id of group.ids) {
      const c = CONTROLS.find((x) => x.id === id);
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<label for="r-${c.id}">${c.label}</label><span class="num" id="n-${c.id}"></span>`;
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', id: `r-${c.id}`, min: c.min, max: c.max, step: c.step });
      section.append(row, input);
      ranges.set(c.id, input);
    }

    for (const id of group.checks ?? []) {
      const c = CHECKS.find((x) => x.id === id);
      const row = document.createElement('label');
      row.className = 'row check';
      row.htmlFor = `c-${c.id}`;
      const input = document.createElement('input');
      Object.assign(input, { type: 'checkbox', id: `c-${c.id}` });
      const text = document.createElement('span');
      text.textContent = c.label;
      row.append(input, text);
      section.append(row);
      if (c.hint) {
        const hint = document.createElement('p');
        hint.className = 'hint';
        hint.textContent = c.hint;
        section.append(hint);
      }
      checks.set(c.id, input);
    }
    body.append(section);
  }

  const extras = document.createElement('div');
  extras.className = 'grp';
  extras.innerHTML = `
    <h3>Render quality</h3>
    <p class="hint">Upper cap on the device pixel ratio. The cheapest performance lever — measure FPS on the target phone at every level.</p>
    <div class="toggles" id="quality-row">
      <button type="button" data-q="high">High</button>
      <button type="button" data-q="medium">Medium</button>
      <button type="button" data-q="low">Low</button>
    </div>
    <h3 style="margin-top:16px">Export</h3>
    <p class="hint">Values to paste into <code>config/tuning.js</code>. The panel stores settings locally in this browser.</p>
    <textarea class="json" id="tuning-json" readonly spellcheck="false"></textarea>
    <div class="toggles" style="margin-top:8px">
      <button type="button" id="btn-copy">Copy</button>
      <button type="button" id="btn-reset">Reset</button>
    </div>`;
  body.append(extras);

  for (const c of CONTROLS) nums.set(c.id, body.querySelector(`#n-${c.id}`));
  const jsonEl = body.querySelector('#tuning-json');

  function exportable() {
    const out = {};
    for (const key of Object.keys(defaultTuning())) out[key] = game.tuning[key];
    return out;
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(exportable())); } catch { /* private window */ }
  }

  function sync() {
    for (const c of CHECKS) checks.get(c.id).checked = game.tuning[c.key] !== false;
    for (const c of CONTROLS) {
      const input = ranges.get(c.id);
      input.value = game.tuning[c.key];
      nums.get(c.id).textContent = c.fmt(parseFloat(input.value));
    }
    jsonEl.value = JSON.stringify(exportable(), null, 2);
  }

  for (const c of CONTROLS) {
    ranges.get(c.id).addEventListener('input', (e) => {
      game.setTuning({ [c.key]: parseFloat(e.target.value) });
      nums.get(c.id).textContent = c.fmt(game.tuning[c.key]);
      jsonEl.value = JSON.stringify(exportable(), null, 2);
      persist();
    });
  }

  for (const c of CHECKS) {
    checks.get(c.id).addEventListener('change', (e) => {
      game.setTuning({ [c.key]: e.target.checked });
      jsonEl.value = JSON.stringify(exportable(), null, 2);
      persist();
    });
  }

  const qualityRow = extras.querySelector('#quality-row');
  qualityRow.addEventListener('click', (e) => {
    const level = e.target.dataset?.q;
    if (!level) return;
    for (const b of qualityRow.querySelectorAll('button')) {
      b.setAttribute('aria-pressed', String(b.dataset.q === level));
    }
    onQuality?.(level);
    try { localStorage.setItem('slicelab.quality', level); } catch { /* private window */ }
  });

  extras.querySelector('#btn-copy').addEventListener('click', (e) => {
    const btn = e.target;
    const done = () => { btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = 'Copy'; }, 1400); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(jsonEl.value).then(done, () => jsonEl.select());
    else jsonEl.select();
  });

  extras.querySelector('#btn-reset').addEventListener('click', () => {
    game.setTuning(defaultTuning());
    onReset?.();
    sync();
    persist();
  });

  sync();
  return { sync, exportable };
}
