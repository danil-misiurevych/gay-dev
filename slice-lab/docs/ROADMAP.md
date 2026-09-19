# Plan prac

Kolejność nie jest przypadkowa i jest ważniejsza niż zawartość poszczególnych
punktów.

## Dlaczego taka kolejność

Naturalnym odruchem zespołu będzie dopracowywanie cięcia — bo jest
satysfakcjonujące, od razu widać efekt i każdy ma na to pomysł. Ryzyko jest
konkretne: **za trzy tygodnie można mieć świetne cięcie i zero zamówień, czyli
świetny klon.** Playgama odrzuciła poprzedni projekt zespołu za podobieństwo
do katalogu.

Dlatego warstwa zamówień powstaje przed jakimkolwiek polerowaniem. Brzydka,
bez grafiki, w obecnym prototypie. Dopiero jeśli okaże się ciekawa, warto
w to inwestować pracę czterech osób.

## M1 — fundament *(zrobione)*

- Mechanika cięcia, balistyka, punktacja z combo.
- Podział na rdzeń i renderowanie, testy bez przeglądarki.
- Panel strojenia parametrów na urządzeniu.
- Build, CI, publikacja na GitHub Pages, budżet rozmiaru paczki.

## M2 — warstwa zamówień *(następne, priorytet bezwzględny)*

Cel: sprawdzić, czy pętla „klient chce X, tnij X, nie tnij Y" jest w ogóle
ciekawa. **Bez grafiki, bez efektów, bez dźwięku.**

- Typy składników — na razie odróżniane samym kolorem z istniejącej palety.
- `src/core/orders.js`: zamówienie (1–2 składniki), cierpliwość, realizacja.
- Kara za przecięcie niewłaściwego składnika.
- Najprostsze możliwe pokazanie zamówienia w HUD — tekst wystarczy.
- Rozstrzygnięcie otwartego pytania z `GDD.md`: czy przepuszczenie właściwego
  składnika też karze.

**Bramka:** cały zespół gra i odpowiada na jedno pytanie — czy chce zagrać
jeszcze raz. Jeśli nie, wracamy do konceptu, a nie do polerowania.

## M3 — platforma

- Integracja SDK Playgamy (`src/platform/playgama.js`) z aktualnej dokumentacji.
- Ekran startowy z gestem użytkownika (wymagany przez politykę dźwięku).
- Interstitial między rundami, rewarded za wznowienie.
- Zapis najlepszego wyniku.
- Weryfikacja rozmiaru paczki wobec limitów platformy.

## M4 — grafika i oprawa

Dopiero tutaj, świadomie.

- Modele składników wg [`ART-SPEC.md`](ART-SPEC.md).
- Karta zamówienia i klient wg [`UI-SPEC.md`](UI-SPEC.md).
- Tło baru.
- Dźwięk.

## M5 — progresja i wydanie

- Rosnąca trudność, dystraktory, bomby.
- Strojenie krzywej trudności na żywych sesjach.
- YouTube Playables jako druga platforma.

## Rytm pracy

Tygodniowa pętla, dopasowana do tego, że wszyscy pracują na prywatnych limitach:

```
koncept na piśmie → zatwierdzenie → implementacja → wszyscy grają na linku → wnioski do DECISIONS.md
```

Powierzchnią recenzji jest działająca gra pod opublikowanym linkiem, nie zrzuty
ekranu i nie opisy.
