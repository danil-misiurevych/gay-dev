/**
 * WARSTWA ZAMOWIEN — SZKIELET, JESZCZE NIEAKTYWNA.
 *
 * To jest rzecz, ktora ma odroznic gre od dziesiatek klonow Fruit Ninja:
 * samo ciecie jest mechanika powszechnie znana i nie wyroznia niczego.
 * Wyroznia dopiero presja wyboru WLASCIWEGO skladnika pod zamowienie
 * klienta. Dlatego ta warstwa ma powstac wczesnie i brzydko, zanim
 * ktokolwiek zacznie polerowac efekty ciecia — patrz docs/ROADMAP.md.
 *
 * Modul jest celowo pusty w warstwie zachowania: ksztalt danych jest
 * ustalony, decyzje projektowe nie. Nie implementuj tego bez zatwierdzonego
 * wpisu w docs/GDD.md i docs/DECISIONS.md.
 *
 * @typedef {Object} Order
 * @property {number}   id
 * @property {string[]} wants        identyfikatory wymaganych skladnikow
 * @property {number}   patience     sekundy do utraty cierpliwosci
 * @property {number}   elapsed      sekundy od pojawienia sie zamowienia
 *
 * @typedef {Object} OrdersState
 * @property {Order[]} active
 * @property {number}  served
 * @property {number}  failed
 */

export function createOrders(/* { tuning, rng } */) {
  /** @type {OrdersState} */
  const state = { active: [], served: 0, failed: 0 };

  return {
    state,
    enabled: false,
    update(/* dt */) { /* TODO: milestone M2 */ },
    onIngredientSliced(/* ingredientId */) { /* TODO: milestone M2 */ },
    reset() { state.active.length = 0; state.served = 0; state.failed = 0; },
  };
}
