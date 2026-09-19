/**
 * PARAMETRY ROZGRYWKI — jedyne zrodlo prawdy.
 *
 * Wlascicielem tego pliku jest osoba od gameplayu. Zmiana wartosci NIE
 * wymaga dotykania logiki gry i nie wymaga dewelopera: panel strojenia
 * w grze eksportuje dokladnie ten zestaw pol, wystarczy przeniesc liczby
 * tutaj i zacommitowac.
 *
 * Plik jest modulem JS, a nie JSON-em, z jednego powodu: JSON nie ma
 * komentarzy, a przy parametrach odczucia komentarz "co ta liczba robi
 * i co sie stanie, gdy ja podniesiesz" jest wazniejszy od samej liczby.
 *
 * RANGES to twarde granice. Panel i wczytywanie zapisanych ustawien
 * przycinaja do nich kazda wartosc — dzieki temu stary zapis w localStorage
 * testera nie wpuszcza do gry liczby, ktorej kod juz nie obsluguje.
 */

export const DEFAULTS = {
  // --- balistyka ---------------------------------------------------------
  /** Przyspieszenie w jednostkach swiata na s^2. Wyzej = szybszy, ostrzejszy lot. */
  gravity: 24,
  /** Wysokosc apogeum jako ulamek polowy wysokosci ekranu. 0.42 = lekko powyzej srodka. */
  apexRatio: 0.42,
  /** Bazowy odstep miedzy wyrzutami w sekundach. */
  spawnEvery: 1.05,
  /** Losowe odchylenie odstepu jako ulamek wartosci bazowej. 0 = metronom, a to czuc. */
  spawnJitter: 0.22,
  /** Ile obiektow leci naraz. Powyzej 2 combo robi sie latwe — stroic razem z punktacja. */
  perSpawn: 1,

  // --- detekcja ciecia ---------------------------------------------------
  /**
   * Prog predkosci swipe'a w px/ms. Ponizej tej wartosci ruch nie tnie.
   * Za nisko: da sie wygrac powolnym przesuwaniem palca i gra traci napiecie.
   * Za wysoko: precyzyjne, krotkie ciecia przestaja dzialac i gra frustruje.
   * Stroic ZAWSZE w parze z hitScale.
   */
  minSwipeSpeed: 0.3,
  /**
   * Mnoznik promienia hitboxa w przestrzeni ekranu.
   * Ponizej 1 gra jest "sztywna", powyzej 1.4 trafienia obok obiektu zaczynaja
   * psuc poczucie kontroli — gracz nie wie, za co dostal punkty.
   */
  hitScale: 1.15,
  /** Jak dlugo punkt sladu ostrza pozostaje aktywny, w ms. Wplywa na dlugosc ogona. */
  trailLife: 120,

  // --- reakcja na ciecie -------------------------------------------------
  /** Impuls rozsuwajacy polowki, w jednostkach na s. */
  separation: 3.0,
  /** Predkosc obrotu polowek w rad/s. */
  halfSpin: 6.5,
  /** Liczba czasteczek na ciecie. Pierwsza rzecz do zbicia, gdy brakuje FPS. */
  burstCount: 16,

  // --- punktacja ---------------------------------------------------------
  /** Punkty za pojedyncze ciecie. */
  scoreBase: 10,
  /** Dodatek za kazdy kolejny obiekt przeciety tym samym pociagnieciem. */
  comboBonus: 5,

  // --- debug -------------------------------------------------------------
  /** Podglad hitboxow. Nie commitowac jako true. */
  showHit: false,
};

/** Twarde granice dla wartosci liczbowych: [min, max]. */
export const RANGES = {
  gravity: [1, 80],
  apexRatio: [0.05, 0.95],
  spawnEvery: [0.15, 5],
  spawnJitter: [0, 0.9],
  perSpawn: [1, 8],
  minSwipeSpeed: [0, 5],
  hitScale: [0.3, 4],
  trailLife: [20, 600],
  separation: [0, 20],
  halfSpin: [0, 30],
  burstCount: [0, 64],
  scoreBase: [0, 1000],
  comboBonus: [0, 1000],
};

/** Pola zaokraglane do liczb calkowitych. */
export const INTEGER_KEYS = ['perSpawn', 'burstCount', 'scoreBase', 'comboBonus'];
