# Slice Lab

Gra przeglądarkowa: międzygalaktyczny bar, w którym gracz tnie lecące składniki,
żeby realizować zamówienia obcych klientów. Cel: Playgama, następnie YouTube
Playables. Monetyzacja wyłącznie reklamowa.

**Stan projektu:** mechanika cięcia działa i daje się stroić na urządzeniu.
Warstwa zamówień jeszcze nie istnieje — to następny kamień milowy i to ona ma
odróżnić grę od klonów. Patrz [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Start

Wymagany Node 20 lub nowszy.

```bash
npm install
npm run dev        # http://localhost:5173, dostępne też z telefonu w tej samej sieci
```

```bash
npm test           # testy rdzenia, bez przeglądarki
npm run build      # produkcyjna paczka w dist/
npm run size       # budżet rozmiaru paczki
npm run preview    # podgląd zbudowanej wersji
```

W grze: `P` — pauza, `H` — podgląd hitboxów. Przycisk **Parametry** otwiera panel
strojenia mechaniki na żywo; eksportuje ustawienia jako JSON do wklejenia
w `config/tuning.js`.

## Struktura

```
config/tuning.js       parametry rozgrywki — właściciel: gameplay
src/core/              logika gry, bez Three.js i bez DOM, testowalna w node
src/render/            Three.js: scena, obiekty, efekty
src/input/             obsługa wskaźnika (mysz, dotyk, rysik)
src/ui/                HUD, nakładka 2D, panel strojenia
src/platform/          adapter platform (web, Playgama)
src/fonts/             kroje pisma, lokalnie — zero zapytań na zewnątrz
tests/                 testy rdzenia
docs/                  dokumentacja — patrz niżej
assets/                źródła i eksporty grafiki
scripts/check-size.mjs kontrola budżetu paczki
```

## Dokumentacja

| Dokument | Dla kogo | O czym |
|---|---|---|
| [`CLAUDE.md`](CLAUDE.md) | każdy agent AI | zasady, których nie łamiemy |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | dev | podział warstw, przepływ danych, wydajność |
| [`docs/GDD.md`](docs/GDD.md) | gameplay | koncept, pętla rozgrywki, parametry |
| [`docs/ART-SPEC.md`](docs/ART-SPEC.md) | art | kontrakt na modele i kolory |
| [`docs/UI-SPEC.md`](docs/UI-SPEC.md) | UX/UI | HUD, tokeny, zasady interfejsu |
| [`docs/AGENTS.md`](docs/AGENTS.md) | każdy | jak pracować ze swoim agentem w swojej roli |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | wszyscy | kolejność prac i dlaczego taka |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | wszyscy | log decyzji |

## Jak pracujemy

Repozytorium jest jedynym źródłem prawdy. Ustalenie, którego nie ma w repo,
nie istnieje — cztery osoby pracują z czterema agentami o osobnej pamięci
i to jedyny sposób, żeby się nie rozjechać.

1. Koncept opisany na piśmie w `docs/GDD.md` → zatwierdzony przez zespół.
2. Branch na zmianę, PR do `main`. Opis PR-a mówi **co i dlaczego**, nie jak.
3. CI uruchamia testy, build i kontrolę rozmiaru. Czerwone CI = PR nie wchodzi.
4. Merge do `main` publikuje na GitHub Pages automatycznie.
5. Wszyscy grają na opublikowanym linku. Wnioski wracają do `docs/DECISIONS.md`.

Powierzchnią recenzji jest działająca gra pod linkiem, nie zrzuty ekranu.

## Publikacja

Po włączeniu GitHub Pages (Settings → Pages → Source: GitHub Actions) każdy
merge do `main` wdraża `dist/` automatycznie. Build używa ścieżek względnych,
więc ta sama paczka działa w podkatalogu na Pages, w korzeniu na Netlify
i w zipie dla Playgamy.
