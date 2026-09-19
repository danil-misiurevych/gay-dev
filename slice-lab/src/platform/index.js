/**
 * ADAPTER PLATFORMY.
 *
 * Gra ma trafic na Playgame i na YouTube Playables. Obie platformy maja
 * wlasne SDK, wlasne momenty na reklamy i wlasny zapis postepu. Gdyby te
 * wywolania byly wplecione w petle gry, utrzymywalibysmy dwie rozjezdzajace
 * sie wersje tej samej gry — a to jest najczestszy sposob, w jaki maly
 * zespol traci kontrole nad projektem przy drugiej platformie.
 *
 * Dlatego reszta kodu zna WYLACZNIE ten interfejs. Zadnego `if (playgama)`
 * poza tym katalogiem.
 *
 * @typedef {Object} Platform
 * @property {string}  name
 * @property {() => Promise<void>} ready        czekaj na gotowosc SDK
 * @property {() => void} gameplayStart          gracz zaczyna grac
 * @property {() => void} gameplayStop           pauza, koniec rundy, utrata fokusu
 * @property {() => Promise<boolean>} interstitial   reklama pelnoekranowa
 * @property {() => Promise<boolean>} rewarded       reklama za nagrode
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
