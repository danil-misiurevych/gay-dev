import { defaultTuning } from '../core/config.js';

const STORAGE_KEY = 'slicelab.tuning.v2';

const CONTROLS = [
  { id: 'speed', key: 'minSwipeSpeed', label: "Próg prędkości swipe'a", min: 0.02, max: 1.5, step: 0.01, fmt: (v) => `${v.toFixed(2)} px/ms` },
  { id: 'hit',   key: 'hitScale',      label: 'Mnożnik hitboxa',        min: 0.6,  max: 2.2, step: 0.05, fmt: (v) => `×${v.toFixed(2)}` },
  { id: 'trail', key: 'trailLife',     label: 'Długość śladu ostrza',   min: 40,   max: 320, step: 5,    fmt: (v) => `${Math.round(v)} ms` },
  { id: 'grav',  key: 'gravity',       label: 'Grawitacja',             min: 6,    max: 46,  step: 0.5,  fmt: (v) => `${v.toFixed(1)} u/s²` },
  { id: 'apex',  key: 'apexRatio',     label: 'Wysokość apogeum',       min: 0.12, max: 0.85, step: 0.01, fmt: (v) => `${Math.round(v * 100)}% ekranu` },
  { id: 'every', key: 'spawnEvery',    label: 'Odstęp między wyrzutami', min: 0.25, max: 2.6, step: 0.05, fmt: (v) => `${v.toFixed(2)} s` },
  { id: 'per',   key: 'perSpawn',      label: 'Obiektów na wyrzut',     min: 1,    max: 4,   step: 1,    fmt: (v) => `${Math.round(v)}` },
  { id: 'sep',   key: 'separation',    label: 'Impuls rozrzutu połówek', min: 0.3, max: 7,   step: 0.1,  fmt: (v) => `${v.toFixed(1)} u/s` },
  { id: 'spin',  key: 'halfSpin',      label: 'Rotacja połówek',        min: 0,    max: 14,  step: 0.2,  fmt: (v) => `${v.toFixed(1)} rad/s` },
  { id: 'burst', key: 'burstCount',    label: 'Ilość cząsteczek',       min: 0,    max: 34,  step: 1,    fmt: (v) => `${Math.round(v)} szt.` },
];

const GROUPS = [
  { title: 'Detekcja cięcia', hint: 'Test w przestrzeni ekranu: odcinek ruchu palca kontra okrąg wokół rzutowanego środka obiektu.', ids: ['speed', 'hit', 'trail'] },
  { title: 'Balistyka', ids: ['grav', 'apex', 'every', 'per'] },
  { title: 'Reakcja na cięcie', ids: ['sep', 'spin', 'burst'] },
];

export function loadStoredTuning() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

/**
 * Panel strojenia parametrów na żywo.
 *
 * To jest most między osobą od gameplayu a kodem: wartości stroi się na
 * urządzeniu, eksportuje jako JSON i wkleja do config/tuning.json. Dzięki
 * temu zmiana odczucia z gry nie wymaga dewelopera i nie blokuje nikogo.
 */
export function createTuningPanel({ root, game, onQuality, onReset }) {
  const body = root.querySelector('#panel-body');
  const nums = new Map();
  const ranges = new Map();

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
    body.append(section);
  }

  const extras = document.createElement('div');
  extras.className = 'grp';
  extras.innerHTML = `
    <h3>Jakość renderowania</h3>
    <p class="hint">Górny limit device pixel ratio. Najtańsza dźwignia wydajności — zmierz FPS na docelowym telefonie na każdym poziomie.</p>
    <div class="toggles" id="quality-row">
      <button type="button" data-q="high">Wysoka</button>
      <button type="button" data-q="medium">Średnia</button>
      <button type="button" data-q="low">Niska</button>
    </div>
    <h3 style="margin-top:16px">Eksport</h3>
    <p class="hint">Wartości do wklejenia w <code>config/tuning.json</code>. Panel zapisuje ustawienia lokalnie w tej przeglądarce.</p>
    <textarea class="json" id="tuning-json" readonly spellcheck="false"></textarea>
    <div class="toggles" style="margin-top:8px">
      <button type="button" id="btn-copy">Kopiuj</button>
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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(exportable())); } catch { /* prywatne okno */ }
  }

  function sync() {
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

  const qualityRow = extras.querySelector('#quality-row');
  qualityRow.addEventListener('click', (e) => {
    const level = e.target.dataset?.q;
    if (!level) return;
    for (const b of qualityRow.querySelectorAll('button')) {
      b.setAttribute('aria-pressed', String(b.dataset.q === level));
    }
    onQuality?.(level);
    try { localStorage.setItem('slicelab.quality', level); } catch { /* prywatne okno */ }
  });

  extras.querySelector('#btn-copy').addEventListener('click', (e) => {
    const btn = e.target;
    const done = () => { btn.textContent = 'Skopiowano'; setTimeout(() => { btn.textContent = 'Kopiuj'; }, 1400); };
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
