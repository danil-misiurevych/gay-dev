# Specyfikacja artystyczna

Kontrakt między grafiką a kodem. Dokument dla osoby od artu i dla jej agenta.

> **Otwarta decyzja (D-006).** Nie ustalono jeszcze, czy modele 3D powstają
> u nas w Blenderze, czy bierzemy assety CC0 i stylizujemy je kolorem. Sekcja
> „Modele 3D" obowiązuje w obu wariantach — różni się tylko to, kto produkuje
> siatkę. Zamknijcie to przed pierwszym modelem, nie po dziesiątym.

## Podział ról w grafice

Dziesięć lat w UX/UI to nie to samo co art do gry 3D. To dwie różne roboty i
lepiej rozdzielić je świadomie.

**Warstwa 2D** — HUD, ekrany zamówień, onboarding, ikony, typografia, feedback
wizualny. Naturalne terytorium projektanta UI, może wziąć w całości.
Specyfikacja: [`UI-SPEC.md`](UI-SPEC.md).

**Warstwa 3D** — cięte składniki i tło baru. Wymaga narzędzi i nawyków
z gamedevu, nie z projektowania interfejsów. Poniżej.

## Najważniejsza zasada: sylwetka, nie detal

Obiekt leci przez ekran telefonu przez około sekundę, obracając się, na ciemnym
tle. Gracz czyta go **konturem i kolorem**. Detal tekstury jest niewidoczny
i jest czystym kosztem — pamięci, rozmiaru paczki i czasu.

Bramka akceptacyjna dla modelu brzmi:

> Czy to się czyta przy 120 px, w ruchu, w obrocie?

a nie „czy ładnie wygląda w podglądzie przy 100%". To nawyk, który trzeba
świadomie zmienić, przechodząc z projektowania interfejsów.

Praktyczny test: wyrenderuj model w 120 px, w trzech losowych obrotach, na tle
`#070912`. Jeśli w którymkolwiek obrocie nie da się go odróżnić od innego
składnika — sylwetka jest za słaba.

## Wymagania dla modelu ciętego składnika

Model, który nie spełnia tych punktów, **nie da się przeciąć** — a to wyjdzie
dopiero przy integracji, po tygodniu Twojej pracy.

| Wymóg | Wartość | Dlaczego |
|---|---|---|
| Podział na połówki | dwie osobne siatki, oś cięcia = lokalne Z | kod obraca połówki tak, by lokalne +Z pokryło się z kierunkiem cięcia |
| Zaślepka przekroju | osobna siatka i osobny materiał | przekrój dostaje własną emisję; to sygnał „cięcie się udało" |
| Origin | środek masy całego obiektu, ten sam dla obu połówek | inaczej połówki „odskakują" w bok przy cięciu |
| Skala | najdłuższy wymiar = 1.0 jednostki | kod skaluje obiekt jedną liczbą (`radius`) |
| Budżet trójkątów | do 400 na cały obiekt (obie połówki razem) | na ekranie bywa 4–8 obiektów plus połówki |
| Tekstury | docelowo brak; jeśli konieczne — jeden atlas 512×512 | rozmiar paczki i liczba wywołań rysowania |
| Cieniowanie | płaskie (flat shading), bez map normalnych | styl jest stylizowany, a płaskie ścianki czytają obrót |
| Format | glTF 2.0 binarny (`.glb`), Y w górę, metry | jedyny format ładowany bez dodatkowych wtyczek |
| Nazewnictwo | `<skladnik>_half_a.glb`, `<skladnik>_half_b.glb` | kod paruje połówki po nazwie |

Eksport z Blendera: **Apply Modifiers** włączone, **+Y Up** włączone, kamery
i światła wyłączone, animacje wyłączone (na tym etapie).

Pliki źródłowe (`.blend`) → `assets/source/`. Eksporty (`.glb`) → `assets/models/`.

## Kolory

Paleta składników żyje w `src/render/palette.js` i to jest plik należący do
artu. Indeks koloru jest tym, co przechowuje logika gry — rdzeń nie wie nic
o wartościach hex, więc podmiana palety nie dotyka kodu.

Zasada doboru, ważniejsza niż estetyka: **kolory muszą różnić się jasnością,
nie tylko odcieniem.** Obiekt jest widoczny ułamek sekundy na ciemnym tle
i czyta się kontrastem. Dwa kolory o tej samej jasności, a różnym odcieniu,
w ruchu zlewają się w jedno.

Kolor przekroju powstaje automatycznie: kolor skórki rozjaśniony o `FLESH_MIX`.
Jeśli któryś składnik ma mieć inny miąższ, to jest zmiana w `palette.js`, nie
w modelu.

## Czego nie robić

- Nie modeluj detalu, którego nie widać przy 120 px.
- Nie dodawaj map normalnych ani PBR — styl jest płaski i celowo.
- Nie zwiększaj rozdzielczości tekstur „na zapas". Budżet paczki jest twardy
  i sprawdzany przez CI.
- Nie zmieniaj skali ani origin po tym, jak model trafił do kodu, bez wpisu
  w `DECISIONS.md` — to cicho psuje strojenie rozgrywki.
- Nie oddawaj modelu, którego nie obejrzałeś w obrocie na docelowym tle.

## Tło i atmosfera baru

Jeszcze niezaprojektowane. Ograniczenie z góry: tło nie może konkurować
kontrastem z lecącymi składnikami. Wszystko, co jasne i kontrastowe w tle,
odbiera czytelność temu, w co gracz faktycznie celuje. Bezpieczny kierunek to
ciemne, niskokontrastowe otoczenie z punktowymi akcentami świetlnymi.
