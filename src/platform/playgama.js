/**
 * The Playgama platform — SKELETON, TO BE FILLED IN.
 *
 * NOTE FOR THE AGENT AND FOR THE HUMAN: do not fill this file in from memory.
 * SDK method names and the way initialisation works change between versions,
 * and a broken ad integration is one of the more common reasons a game is
 * rejected during review. Open the current Playgama documentation, copy the
 * calls from there, and record in docs/DECISIONS.md which SDK version we use
 * and when it was checked.
 *
 * The contract this file has to satisfy is defined in ./index.js and should
 * not change — if the SDK needs something the contract does not cover,
 * extend the interface rather than working around it from outside.
 *
 * To check during integration:
 *  - when gameplayStart / gameplayStop should be called (platforms suspend
 *    sound and ads based on it),
 *  - whether an interstitial may be shown during a round or only between
 *    rounds, and what the minimum gap between ads is,
 *  - whether saving progress is asynchronous and whether it has a size limit,
 *  - whether the SDK requires a start screen with a user gesture before sound.
 */
export function createPlaygamaPlatform() {
  let sdk = null;

  return {
    name: 'playgama',

    async ready() {
      // TODO(M3): load and initialise the SDK per the current documentation.
      // While sdk === null, every method below degrades safely.
      sdk = globalThis.playgama ?? null;
    },

    gameplayStart() { /* TODO(M3) */ },
    gameplayStop() { /* TODO(M3) */ },

    async interstitial() { return false; /* TODO(M3) */ },
    async rewarded() { return false; /* TODO(M3) */ },

    async save(_data) { /* TODO(M3) */ },
    async load() { return null; /* TODO(M3) */ },

    get _sdk() { return sdk; },
  };
}
