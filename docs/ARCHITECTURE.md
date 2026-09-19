# Architektura

Dokument dla osoby od kodu i dla jej agenta.

## Główna decyzja: rdzeń oddzielony od renderowania

```
                    zdarzenia
  ┌──────────┐   spawn/slice/miss   ┌────────────┐
  │ src/core │ ───────────────────► │ src/render │──► Three.js ──► ekran
  │          │                      │  src/ui    │
  │  logika  │ ◄─────────────────── │            │
  └──────────┘   project(entity)    └────────────┘
                 segment ruchu            ▲
                                          │
                                   ┌──────────────┐
                                   │  src/input   │  Pointer Events
                                   └──────────────┘
```

`src/core/` nie importuje Three.js ani niczego z DOM. Nie jest to czystość dla
samej czystości — daje trzy konkretne rzeczy:

1. **Testy bez przeglądarki.** `npm test` uruchamia pełną pętlę gry w node
   w ułamku sekundy. Regresja w detekcji cięcia albo w punktacji wychodzi
   natychmiast, a nie po ręcznym klikaniu na telefonie.
2. **Wymiana warstwy wizualnej bez ruszania logiki.** Proceduralne kule zostaną
   zastąpione modelami. Rdzeń tego nie zauważy.
3. **Druga platforma za rozsądną cenę.** Playgama i YouTube Playables różnią się
   SDK, nie logiką. Gdyby wywołania SDK były wplecione w pętlę gry,
   utrzymywalibyśmy dwie rozjeżdżające się wersje tej samej gry.

### Jak kamera dostaje się do rdzenia

Nie dostaje się. Rdzeń przyjmuje wstrzykniętą funkcję:

```js
project(entity) -> { x, y, r }   // piksele CSS
```

To jedyny kanał, przez który logika cięcia wie cokolwiek o kamerze. W testach
podstawiamy zastępcze rzutowanie i sprawdzamy detekcję bez renderera.

Analogicznie w drugą stronę: rdzeń emituje zdarzenie `slice` z kierunkiem
swipe'a **w pikselach**, a warstwa renderowania zamienia go na płaszczyznę
cięcia w świecie (`scene.cutBasis`).

## Detekcja cięcia

Test odbywa się w przestrzeni ekranu: odcinek ruchu wskaźnika kontra okrąg
wokół rzutowanego środka obiektu.

**Dlaczego odcinek, nie punkt.** Przy szybkim swipie na 60 Hz palec przeskakuje
kilkadziesiąt pikseli między klatkami. Test punktowy przepuściłby obiekt leżący
dokładnie na trasie ruchu — a gracz widziałby, że przeciągnął przez obiekt
i nic się nie stało. Jest na to test: `tests/geometry.test.js`.

**Dlaczego przestrzeń ekranu, nie raycast w 3D.** Gracz celuje w to, co widzi —
w koło na ekranie, nie w kulę w przestrzeni. Test ekranowy jest zgodny z jego
intencją. Jest przy tym o rząd wielkości tańszy i daje się stroić jedną liczbą
(`hitScale`), a to jest główna gałka odpowiadająca za to, czy gra „czuje się"
uczciwie.

**Próg prędkości** (`minSwipeSpeed`) istnieje po to, żeby nie dało się wygrać
powolnym pełzaniem palcem po ekranie.

## Cięcie i połówki

Geometria połówek jest tworzona **raz** przy starcie, dla promienia 1.
`SphereGeometry(phi 0..π)` daje półkulę z `z ≥ 0`, `(phi π..2π)` — `z ≤ 0`.
Płaszczyzna cięcia to więc `z = 0`, a jej normalna to lokalna oś Z.

Przy cięciu liczymy w świecie:

- `cut` — kierunek swipe'a przeniesiony na osie kamery,
- `normal = cut × kierunekPatrzeniaKamery` — oś, wzdłuż której rozjeżdżają się
  połówki.

Całą połówkę obracamy kwaternionem tak, żeby lokalne `+Z` pokryło się z
`normal`. Efekt: cięcie wygląda, jakby szło dokładnie wzdłuż ruchu palca,
mimo że geometria jest zawsze ta sama. To świadoma alternatywa dla cięcia
siatki w locie (CSG) — patrz `DECISIONS.md`.

Ścianka przekroju ma własną emisję. Płaska powierzchnia potrafi być odwrócona
od wszystkich świateł i renderować się niemal czarna, a to właśnie ona jest
sygnałem zwrotnym „cięcie się udało".

**Połówki żyją poza rdzeniem.** Są czysto wizualne, nie wpływają na rozgrywkę
i nie ma sensu, żeby rdzeń je symulował.

## Wydajność

Cel: 60 FPS na średnim telefonie z ostatnich trzech lat. Dźwignie, w kolejności
od najskuteczniejszej:

| Dźwignia | Efekt | Gdzie |
|---|---|---|
| Limit device pixel ratio | 2 → 1.5 to ok. 44% mniej fragmentów | `render/scene.js`, panel |
| Liczba świateł | koszt liczony per fragment × liczba świateł | `render/scene.js` |
| Liczba cząsteczek | przezroczysty overdraw | `config/tuning.js` |
| Liczba obiektów naraz | liniowo | `config/tuning.js` |

Świadomie używamy dwóch świateł kierunkowych i jednego hemisferycznego, zero
punktowych: światła kierunkowe zachowują się identycznie niezależnie od modelu
oświetlenia Three.js, więc aktualizacja biblioteki nie wymaga przestrajania sceny.

**FPS nie jest wartością, którą się podkręca.** `requestAnimationFrame` jest
zsynchronizowany z odświeżaniem ekranu — sufit to fizyczny refresh panelu.
Stabilne 30 na iPhonie zwykle oznacza tryb oszczędzania energii, a nie problem
z kodem. Zanim zaczniesz optymalizować, ustal, czy budżet klatki jest faktycznie
przekroczony.

**Zero alokacji w pętli.** Siatki, połówki i wybuchy cząsteczek są pulowane.
Dopisując efekt, dopisz pulę.

## Budżet paczki

`npm run size` liczy rozmiar `dist/` po gzipie i wywala się po przekroczeniu
limitu. Limity są w `scripts/check-size.mjs`.

Three.js po tree-shakingu to obecnie ok. 115 kB gzip — cała biblioteka bez
tree-shakingu miałaby ok. 600 kB nieskompresowane. Stąd bundler od pierwszego
dnia, a nie „kiedyś później".

Trzymamy tylko `woff2`, bez `woff`: fallback to ok. 100 kB martwego balastu,
a przeglądarki bez obsługi `woff2` praktycznie nie występują w ruchu mobilnym.

## Warstwa platformy

`src/platform/index.js` definiuje interfejs, którego trzyma się reszta kodu.
`web.js` to implementacja bez SDK (development i testy zespołu). `playgama.js`
jest szkieletem — **nie wypełniaj go z pamięci**, patrz komentarz w pliku.

## Determinizm

`core/rng.js` to generator z ziarnem. Dzięki temu testy są powtarzalne, a przy
zgłaszaniu buga można odtworzyć dokładnie ten sam przebieg rozgrywki. Ziarno
trafia do konsoli w trybie deweloperskim.
