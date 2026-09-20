/**
 * PLATFORM ADAPTER.
 *
 * The game is going to Playgama and to YouTube Playables. Both platforms
 * have their own SDK, their own moments for ads and their own progress
 * storage. If those calls were woven into the game loop we would be
 * maintaining two slowly diverging versions of the same game — which is the
 * most common way a small team loses control of a project on its second
 * platform.
 *
 * So the rest of the code knows ONLY this interface. No `if (playgama)`
 * outside this directory.
 *
 * @typedef {Object} Platform
 * @property {string}  name
 * @property {() => Promise<void>} ready        wait until the SDK is ready
 * @property {() => void} gameplayStart          the player starts playing
 * @property {() => void} gameplayStop           pause, end of round, focus lost
 * @property {() => Promise<boolean>} interstitial   full-screen ad
 * @property {() => Promise<boolean>} rewarded       rewarded ad
 * @property {(data:object) => Promise<void>} save
 * @property {() => Promise<object|null>} load
 */

import { createWebPlatform } from './web.js';
import { createPlaygamaPlatform } from './playgama.js';

export function createPlatform(name = import.meta.env?.VITE_PLATFORM || 'web') {
  switch (name) {
    case 'playgama': return createPlaygamaPlatform();
    case 'web':
    default: return createWebPlatform();
  }
}
