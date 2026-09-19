/**
 * Platforma Playgama — SZKIELET DO UZUPELNIENIA.
 *
 * UWAGA DLA AGENTA I DLA CZLOWIEKA: nie wypelniaj tego pliku z pamieci.
 * Nazwy metod SDK i sposob inicjalizacji zmieniaja sie miedzy wersjami,
 * a bledna integracja reklam jest jednym z czestszych powodow odrzucenia
 * gry przy weryfikacji. Otworz aktualna dokumentacje Playgamy, przepisz
 * wywolania stamtad i dopisz w docs/DECISIONS.md, z ktorej wersji SDK
 * korzystamy i kiedy zostala sprawdzona.
 *
 * Kontrakt, ktory ten plik ma spelnic, jest zdefiniowany w ./index.js
 * i nie powinien sie zmieniac — jesli SDK wymaga czegos, czego w nim nie
 * ma, rozszerz interfejs, a nie obchodz go z zewnatrz.
 *
 * Do sprawdzenia przy integracji:
 *  - moment wywolania gameplayStart / gameplayStop (platformy wstrzymuja
 *    dzwiek i reklamy na tej podstawie),
 *  - czy interstitial wolno pokazac w trakcie rundy, czy tylko miedzy,
 *    i jaki jest minimalny odstep miedzy reklamami,
 *  - czy zapis postepu jest asynchroniczny i czy ma limit rozmiaru,
 *  - czy SDK wymaga ekranu startowego z gestem uzytkownika przed dzwiekiem.
 */
export function createPlaygamaPlatform() {
  let sdk = null;

  return {
    name: 'playgama',

    async ready() {
      // TODO(M3): zaladuj i zainicjalizuj SDK zgodnie z aktualna dokumentacja.
      // Dopoki sdk === null, wszystkie ponizsze metody degraduja sie bezpiecznie.
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
