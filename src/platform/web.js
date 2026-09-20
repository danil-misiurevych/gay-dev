/**
 * The "web" platform: a plain page, no SDK. Used for development and for the
 * team's hosted tests. Ads do not exist and progress goes to localStorage.
 * Every method is always safe to call — that is what keeps the game code
 * from ever checking what it is running on.
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
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private window */ }
    },
    async load() {
      try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
    },
  };
}
