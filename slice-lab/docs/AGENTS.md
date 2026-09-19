# Jak pracować ze swoim agentem

Cztery osoby, cztery agenty, cztery osobne pamięci. Ten dokument opisuje, jak
pracować, żeby się nie rozjechać i nie przepalić limitów.

## Zasady wspólne dla wszystkich ról

**Zacznij od repo, nie od opowiadania kontekstu.** Pierwsze polecenie w nowej
sesji brzmi mniej więcej tak:

> Przeczytaj CLAUDE.md i docs/ARCHITECTURE.md, potem powiedz, co zamierzasz
> zrobić z <zadanie>, zanim zaczniesz pisać kod.

Agent, który przeczytał dokumenty, nie potrzebuje czterdziestu wiadomości
tłumaczenia. To jest jednocześnie największa oszczędność tokenów i największa
ochrona przed rozjechaniem się zespołu.

**Jedna długa sesja na obszar, nie nowa sesja na każde pytanie.** Kontekst,
który agent już ma, jest darmowy. Odbudowywanie go kosztuje za każdym razem.

**Żądaj planu przed implementacją.** „Powiedz, co zrobisz, zanim to zrobisz"
kosztuje kilkaset tokenów, a oszczędza generowanie pliku, który idzie do kosza.

**Małe diffy.** Agent, któremu pozwolisz przepisać plik w całości, zrobi to —
i recenzja stanie się niemożliwa. Proś o zmianę konkretnych fragmentów.

**Nie pozwól agentowi zamykać otwartych decyzji.** Jeśli `DECISIONS.md` mówi,
że coś jest otwarte, agent ma o to zapytać, a nie wybrać wariant i pójść dalej.

**Weryfikuj, że testy przechodzą.** Agent potrafi napisać, że skończył, nie
uruchamiając niczego. `npm test && npm run build && npm run size` to minimum
przed uznaniem zadania za zamknięte.

---

## Rola: kod

**Twoje pliki:** `src/`, `tests/`, `scripts/`, `vite.config.js`
**Twój dokument:** [`ARCHITECTURE.md`](ARCHITECTURE.md)

Otwarcie sesji:

> Przeczytaj CLAUDE.md, docs/ARCHITECTURE.md i docs/ROADMAP.md. Pracujemy nad
> <kamień milowy>. Zaproponuj podział na kroki, każdy kończący się przechodzącymi
> testami.

Pilnuj przy każdej zmianie:

- czy coś nie przeciekło z Three.js do `src/core/`,
- czy nowy efekt ma pulę, czy alokuje w pętli,
- czy nowa liczba regulująca rozgrywkę trafiła do `config/tuning.js`, a nie do kodu,
- czy `npm run size` nadal przechodzi.

Do zmian w `src/platform/playgama.js` daj agentowi **aktualną dokumentację SDK**,
a nie polecenie „zintegruj Playgamę". Agent uzupełni to z pamięci i wyjdzie
prawdopodobnie błędnie.

---

## Rola: gameplay

**Twoje pliki:** `config/tuning.js`, `docs/GDD.md`
**Twój dokument:** [`GDD.md`](GDD.md)

Nie musisz programować. Twój obieg pracy:

1. Otwórz opublikowaną grę na telefonie → **Parametry**.
2. Stroj na żywo, grając. Włącz `H`, żeby widzieć, co faktycznie testuje kod.
3. **Kopiuj** → wklej liczby do `config/tuning.js` → commit.
4. W opisie commita napisz, **co zmieniło się w odczuciu**, nie które liczby.

Do agenta:

> Przeczytaj docs/GDD.md i config/tuning.js. Chcę, żeby <opis odczucia>.
> Które parametry to kontrolują i w którą stronę je ruszyć?

Opisuj odczucie, nie rozwiązanie. „Obiekty spadają za szybko, nie zdążam
przygotować drugiego cięcia" jest użyteczne. „Zmniejsz grawitację o 3" zamyka
agentowi możliwość powiedzenia, że problem jest gdzie indziej.

---

## Rola: grafika

**Twoje pliki:** `assets/`, `src/render/palette.js`, `src/styles.css`, `src/ui/`
**Twoje dokumenty:** [`ART-SPEC.md`](ART-SPEC.md), [`UI-SPEC.md`](UI-SPEC.md)

Warstwa 2D jest w całości Twoja i możesz nad nią pracować od zaraz. Warstwa 3D
czeka na rozstrzygnięcie decyzji D-006.

Do agenta przy pracy nad interfejsem:

> Przeczytaj docs/UI-SPEC.md i src/styles.css. Projektuję <element>.
> Powiedz, których tokenów użyć i gdzie to wpiąć, zanim napiszesz CSS.

Do agenta przy modelach:

> Przeczytaj docs/ART-SPEC.md. Sprawdź, czy ten model spełnia kontrakt:
> <opis albo plik>. Wypisz konkretnie, co jest niezgodne.

Zanim oddasz model, sprawdź go samodzielnie: render przy 120 px, trzy losowe
obroty, tło `#070912`. Jeśli nie odróżniasz go od innego składnika, sylwetka
jest za słaba — i żaden agent Ci tego nie powie.

---

## Rola: proces

**Twoje pliki:** `docs/ROADMAP.md`, `docs/DECISIONS.md`
**Twoje dokumenty:** wszystkie

Twoja robota to pilnowanie, żeby repo nadal odpowiadało rzeczywistości. Trzy
konkretne rzeczy:

1. **Czytaj opisy PR-ów, nie kod.** Opis ma mówić, co i dlaczego. Jeśli nie
   mówi — odsyłasz.
2. **Wyłapuj decyzje, których nikt nie zapisał.** Każda rozmowa kończąca się
   ustaleniem trafia do `DECISIONS.md` tego samego dnia. Po tygodniu nikt nie
   pamięta uzasadnienia, a samo ustalenie bez uzasadnienia jest bezwartościowe.
3. **Pilnuj bramek z `ROADMAP.md`.** Szczególnie bramki M2 — to jedyne
   zabezpieczenie przed tym, żeby zespół nie spędził trzech tygodni na
   polerowaniu klonu.

Do agenta:

> Przeczytaj docs/DECISIONS.md i docs/ROADMAP.md, potem przejrzyj ostatnie
> commity. Które zmiany wprowadziły decyzje, których nie ma w logu?
