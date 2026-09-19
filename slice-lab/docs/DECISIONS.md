# Log decyzji

Każda decyzja, o którą ktoś mógłby zapytać „czemu tak". Trzy linijki: data,
decyzja, uzasadnienie. Tylko dopisujemy — jeśli decyzja się zmienia, dodaj nowy
wpis, który unieważnia stary, zamiast edytować historię.

Wygląda na biurokrację dokładnie do momentu, w którym trzecia osoba pyta o to
samo po raz trzeci. Przy czterech agentach o osobnej pamięci to jedyne miejsce,
w którym „już to ustaliliśmy" ma pokrycie.

Format:

```
## D-NNN — tytuł
**Data:** RRRR-MM-DD · **Status:** przyjęta | unieważniona przez D-XXX
**Decyzja:** …
**Dlaczego:** …
```

---

## D-001 — Cięcie przez gotowe połówki, nie przez cięcie siatki w locie
**Data:** 2026-09-18 · **Status:** przyjęta
**Decyzja:** Przy cięciu podmieniamy obiekt na dwie przygotowane połówki
i obracamy je tak, by płaszczyzna cięcia pokryła się z kierunkiem swipe'a.
Nie tniemy geometrii w czasie rzeczywistym (CSG).
**Dlaczego:** CSG generuje geometrię w pętli gry, co oznacza alokacje i przycinki
od garbage collectora — na telefonie widoczne dokładnie w momencie cięcia.
Wizualnie różnica jest niedostrzegalna, bo kąt cięcia i tak jest odwzorowany
przez obrót. Budżet wydajności zostaje na liczbę obiektów i efekty.

## D-002 — Detekcja cięcia w przestrzeni ekranu, nie raycastem 3D
**Data:** 2026-09-18 · **Status:** przyjęta
**Decyzja:** Test to odcinek ruchu wskaźnika kontra okrąg wokół rzutowanego
środka obiektu, z progiem prędkości.
**Dlaczego:** Gracz celuje w to, co widzi na ekranie, więc test ekranowy jest
zgodny z jego intencją. Jest o rząd wielkości tańszy od raycastu i daje się
stroić jedną liczbą (`hitScale`), która jest główną gałką odczucia.

## D-003 — Test odcinkiem, nie punktem
**Data:** 2026-09-18 · **Status:** przyjęta
**Decyzja:** Sprawdzamy przecięcie odcinka między dwiema próbkami pozycji,
nie pozycji bieżącej.
**Dlaczego:** Przy szybkim swipie palec przeskakuje kilkadziesiąt pikseli między
klatkami. Test punktowy przepuszcza obiekt leżący na trasie ruchu, co gracz
odbiera jako zgubione trafienie. Pokryte testem w `tests/geometry.test.js`.

## D-004 — Rdzeń gry oddzielony od renderowania
**Data:** 2026-09-19 · **Status:** przyjęta
**Decyzja:** `src/core/` nie importuje Three.js ani DOM. Kamera dostaje się do
rdzenia wyłącznie przez wstrzykiwaną funkcję `project()`.
**Dlaczego:** Trzy konkretne zyski: testy pełnej pętli gry w node bez
przeglądarki, wymiana modeli bez ruszania logiki, druga platforma bez
utrzymywania dwóch wersji gry.

## D-005 — Bundler i tree-shaking od pierwszego dnia
**Data:** 2026-09-19 · **Status:** przyjęta
**Decyzja:** Vite + moduły ES, Three.js jako zależność npm, nie z CDN.
**Dlaczego:** Cała biblioteka to ok. 600 kB nieskompresowane; po tree-shakingu
zostaje ok. 115 kB gzip. Przy twardych limitach rozmiaru na platformach
z grami HTML5 to może być różnica między przyjęciem a odrzuceniem. Dokładanie
bundlera później oznacza przepisywanie importów w całym projekcie.

## D-006 — Podział pracy w grafice: 2D u projektanta UI, 3D nierozstrzygnięte
**Data:** 2026-09-19 · **Status:** OTWARTA — wymaga decyzji zespołu
**Decyzja:** Warstwa 2D (HUD, ekrany, ikony) należy do osoby od UX/UI.
Sposób powstawania modeli 3D **nie jest ustalony**: modelowanie u nas
w Blenderze albo assety CC0 stylizowane kolorem.
**Dlaczego:** Dziesięć lat w UX/UI to inne rzemiosło niż art do gry 3D.
Przy zerowym budżecie CC0 plus stylizacja jest realistyczna, ale musi to być
decyzja, nie dryf. Zamknąć przed pierwszym modelem — wymagania z `ART-SPEC.md`
obowiązują w obu wariantach.

## D-007 — Tylko woff2, bez fallbacku woff
**Data:** 2026-09-19 · **Status:** przyjęta
**Decyzja:** Kroje pisma bundlujemy lokalnie, wyłącznie w `woff2`, podzbiory
`latin` i `latin-ext`.
**Dlaczego:** Fallback `woff` to ok. 100 kB martwego balastu w paczce, a
przeglądarki bez obsługi `woff2` praktycznie nie występują w ruchu mobilnym.
`latin-ext` jest obowiązkowy — bez niego polskie znaki lecą na krój zastępczy.

## D-008 — Warstwa zamówień przed polerowaniem cięcia
**Data:** 2026-09-19 · **Status:** przyjęta
**Decyzja:** Kamień milowy M2 to brzydka, działająca pętla zamówień. Żadnego
polerowania efektów, modeli ani dźwięku do czasu przejścia bramki M2.
**Dlaczego:** Cięcie swipe'em to mechanika masowo klonowana i sama w sobie nie
wyróżnia gry — poprzedni projekt zespołu został odrzucony przez Playgamę za
podobieństwo do katalogu. Wyróżnikiem może być tylko warstwa zamówień, więc
trzeba ją zweryfikować, zanim czwórka ludzi zainwestuje w oprawę.
