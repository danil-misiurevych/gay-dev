/**
 * Paleta skladnikow. Indeks koloru jest tym, co przechowuje rdzen gry —
 * rdzen nie wie nic o hexach, wiec podmiana palety nie dotyka logiki.
 *
 * Wlascicielem tego pliku jest osoba od artu. Zasada doboru: kolory musza
 * roznic sie JASNOSCIA, nie tylko odcieniem — obiekt leci przez ciemne tlo
 * przez ulamek sekundy i czyta sie go kontrastem, a nie niuansem barwy.
 */
export const PALETTE = [
  0xf2a93b, // bursztyn
  0x9d7cff, // fiolet
  0x4fd1c5, // turkus
  0xff7a9c, // roz
  0xb6e36b, // limonka
  0x63b3ed, // blekit
];

/** Kolor przekroju: rozjasniona wersja koloru skorki. */
export const FLESH_MIX = 0.6;
