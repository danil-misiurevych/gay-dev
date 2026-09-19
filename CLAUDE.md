# Instrukcje dla agentów AI

Ten plik czyta **każdy** agent, niezależnie od tego, czyja to sesja. Jeśli
pracujesz nad tym projektem, przeczytaj go w całości przed pierwszą zmianą.

## Dlaczego ten plik istnieje

Nad projektem pracują cztery osoby, każda z własnym agentem. Każdy agent ma
osobną pamięć i po kilku dniach „wie" co innego niż pozostałe trzy. Repozytorium
jest jedynym wspólnym źródłem prawdy — nie czyjaś rozmowa, nie ustalenie na
czacie, nie to, co pamiętasz z poprzedniej sesji.

Praktyczny wniosek dla Ciebie: **czytaj repo zamiast pytać o kontekst.**
Odpowiedź na „dlaczego to jest zrobione tak" prawie zawsze jest w
`docs/DECISIONS.md` albo w komentarzu nad kodem.

## Czym jest projekt

Gra przeglądarkowa: międzygalaktyczny bar, w którym gracz tnie lecące składniki
(swipe, mechanika pokrewna Fruit Ninja), żeby realizować zamówienia obcych
klientów. Cel publikacji: Playgama, następnie YouTube Playables. Monetyzacja:
wyłącznie reklamy.

Stan: mechanika cięcia działa. Warstwa zamówień — czyli to, co ma odróżnić grę
od klonów — jeszcze nie istnieje. Patrz `docs/ROADMAP.md`.

## Zasady architektury, których nie łamiemy

**1. `src/core/` nie zna Three.js ani DOM.**
Żadnego importu `three`, `window`, `document` w `src/core/`. Rdzeń jest czystą
logiką i musi dać się uruchomić w node bez przeglądarki — na tym stoją testy.
Kamera dostaje się do rdzenia wyłącznie przez wstrzykiwaną funkcję `project()`.

**2. W pętli gry nie powstają nowe obiekty.**
Siatki, połówki i cząsteczki są pulowane. Alokacja w pętli to nie kwestia
mikrosekund — to przycinka od garbage collectora, którą na telefonie widać
dokładnie w momencie cięcia, czyli w najgorszym możliwym. Jeśli dopisujesz
efekt, dopisz też pulę.

**3. Parametry odczucia mieszkają w `config/tuning.js`.**
Nie wpisuj liczb regulujących rozgrywkę do kodu. Właścicielem tego pliku jest
osoba od gameplayu i musi móc go zmieniać bez dewelopera.

**4. Kod platformy tylko w `src/platform/`.**
Żadnego `if (playgama)` poza tym katalogiem. Gra trafi na dwie platformy i to
jest jedyny sposób, żeby nie utrzymywać dwóch wersji.

**5. Nie wypełniaj `src/platform/playgama.js` z pamięci.**
Nazwy metod SDK zmieniają się między wersjami, a błędna integracja reklam jest
częstym powodem odrzucenia gry przy weryfikacji. Otwórz aktualną dokumentację,
przepisz stamtąd i dopisz w `docs/DECISIONS.md`, której wersji SDK dotyczy.

## Zanim powiesz, że skończyłeś

```bash
npm test          # testy rdzenia, bez przeglądarki
npm run build     # musi przejść
npm run size      # budżet rozmiaru paczki
```

Nie raportuj ukończenia zadania, jeśli którekolwiek z tych trzech nie przechodzi.
Jeśli podniosłeś limit rozmiaru w `scripts/check-size.mjs`, uzasadnij to wpisem
w `docs/DECISIONS.md` — wzrost paczki ma być decyzją, nie przypadkiem.

## Decyzje zapisujemy

Każda decyzja, o którą ktoś mógłby zapytać „czemu tak", trafia do
`docs/DECISIONS.md`. Wpis to trzy linijki: data, decyzja, uzasadnienie.
To wygląda na biurokrację dokładnie do momentu, w którym trzecia osoba pyta
o to samo po raz trzeci.

Nie zmieniaj decyzji już zapisanej bez zgody człowieka. Jeśli uważasz, że
decyzja była błędna — powiedz to, podaj argumenty i poczekaj.

## Czego nie robić

- Nie dopisuj funkcji rozgrywki „przy okazji". Zakres wynika z `docs/ROADMAP.md`
  i z zatwierdzonego wpisu w `docs/GDD.md`.
- Nie polerowuj efektów cięcia, dopóki nie działa warstwa zamówień. Uzasadnienie
  jest w `docs/ROADMAP.md` i jest to najważniejsza decyzja produktowa w projekcie.
- Nie dodawaj zależności bez potrzeby. Każda biblioteka to rozmiar paczki,
  a limit platformy jest twardy.
- Nie przepisuj plików w całości, gdy wystarczy zmiana kilku linii. Duże diffy
  są nieczytelne w recenzji i marnują tokeny wszystkich.
- Nie commituj `showHit: true` ani innych ustawień debugowania.

## Ekonomia tokenów

Zespół pracuje na prywatnych limitach. Trzy nawyki, które realnie oszczędzają:

1. Zacznij od przeczytania odpowiedniego dokumentu z `docs/`, zamiast odtwarzać
   kontekst w rozmowie.
2. Jedna długa sesja na obszar zamiast nowej sesji na każde pytanie.
3. Małe, precyzyjne zmiany zamiast generowania dużych plików od nowa.

## Kto czym się zajmuje

| Obszar | Dokument | Pliki |
|---|---|---|
| Kod, architektura | `docs/ARCHITECTURE.md` | `src/`, `tests/`, `scripts/` |
| Rozgrywka, strojenie | `docs/GDD.md` | `config/tuning.js` |
| Grafika 3D, modele | `docs/ART-SPEC.md` | `assets/`, `src/render/palette.js` |
| UI, HUD, UX | `docs/UI-SPEC.md` | `src/styles.css`, `src/ui/`, `index.html` |
| Proces, kolejność prac | `docs/ROADMAP.md` | `docs/DECISIONS.md` |

Szczegółowe instrukcje dla agenta w każdej z ról: `docs/AGENTS.md`.
