/**
 * Platforma "web": zwykla strona, bez SDK. Sluzy do developmentu i do
 * hostowanych testow zespolu. Reklamy nie istnieja, postep leci do
 * localStorage. Wszystkie metody sa bezpieczne do wywolania zawsze —
 * dzieki temu kod gry nigdy nie sprawdza, na czym dziala.
 */
const KEY = 'slicelab.save.v1';

export function createWebPlatform() {
  return {
    name: 'web',
    async ready() {},
    gameplayStart() {},
    gameplayStop() {},
    async interstitial() { return false; },
    async rewarded() { return false; },
    async save(data) {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* prywatne okno */ }
    },
    async load() {
      try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
    },
  };
}
