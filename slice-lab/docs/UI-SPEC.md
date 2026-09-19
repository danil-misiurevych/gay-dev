# Specyfikacja interfejsu

Dokument dla osoby od UX/UI i dla jej agenta. Warstwa 2D gry jest w całości
Twoja — HUD, ekrany, onboarding, mikrokopia.

## Gdzie to mieszka w kodzie

```
src/styles.css        tokeny i cała warstwa wizualna
index.html            struktura HUD-u
src/ui/hud.js         wpisywanie wartości do liczników (nie wygląd)
src/ui/overlay.js     ślad ostrza, błysk cięcia, wyskakujące punkty
src/ui/tuning-panel.js panel strojenia (narzędzie zespołu, nie część gry)
```

Zmiana wyglądu HUD-u to zmiana w `styles.css` i `index.html`. Nie musisz
dotykać JavaScriptu.

## Tokeny

Zdefiniowane w `:root` w `src/styles.css`. Gra jest **świadomie jednomotywowa**
— ciemny ekran, bez wersji jasnej. Powód jest rozgrywkowy: kontrast lecących
obiektów wobec tła jest elementem czytelności, nie dekoracją.

| Token | Wartość | Rola |
|---|---|---|
| `--bg` | `#070912` | tło, najciemniejszy punkt |
| `--ink` | `#ECEAFF` | tekst podstawowy |
| `--dim` | `#8B89A9` | etykiety, tekst drugorzędny |
| `--amber` | `#F2A93B` | akcent główny, punkty, wartości liczbowe |
| `--violet` | `#9D7CFF` | akcent drugorzędny, combo, obramowania |
| `--teal` | `#4FD1C5` | dane techniczne, podgląd hitboxów |
| `--bad` | `#FF6B6B` | błąd, nietrafienie |

Kroje: **Chakra Petch** (interfejs) i **Azeret Mono** (liczby). Pliki są
lokalnie w `src/fonts/`, tylko `woff2`, podzbiory `latin` i `latin-ext`.
**Nie usuwaj `latin-ext`** — bez niego polskie znaki lecą na krój zastępczy.

Liczby, które się zmieniają, mają `font-variant-numeric: tabular-nums`. Bez tego
licznik punktów drga przy każdej zmianie cyfry.

## Zasady, które wynikają z tego, że to gra na telefon

**1. Interfejs nie może zasłaniać pola gry.** Poniżej 620 px przyciski schodzą
do prawego dolnego rogu. Góra ekranu to liczniki i nic więcej — obiekty lecą
przez środek.

**2. Wszystko klikalne ma minimum 36 px wysokości.** Gracz trzyma telefon
jedną ręką i celuje kciukiem.

**3. `touch-action: none` na polu gry.** Bez tego przeglądarka przechwytuje
pionowy swipe jako przewijanie strony i cięcie w górę przestaje działać.
To nie jest detal — to całkowicie psuje sterowanie.

**4. Safe-area.** Wcięcia na notch i pasek gestów są obsłużone przez
`env(safe-area-inset-*)`. Element przypięty do krawędzi musi dodawać ten
margines do własnego paddingu, nie ustawiać `0`.

**5. Feedback musi być natychmiastowy i widoczny peryferyjnie.** Gracz patrzy
na obiekt, nie na licznik. Dlatego punkty pojawiają się **w miejscu cięcia**,
a nie tylko w HUD-zie.

## Mikrokopia

Język polski, forma bezosobowa lub druga osoba, bez wykrzykników. Przyciski
mówią, co się stanie („Pauza", „Zamknij"), nie jak się nazywa stan.

Komunikat startowy jest jednym zdaniem i znika po pierwszym dotknięciu —
onboarding w tej grze to jedno zdanie, bo mechanika jest jedna.

## Do zaprojektowania

Kolejność wynika z [`ROADMAP.md`](ROADMAP.md):

1. **Karta zamówienia** — najważniejszy element interfejsu w całej grze.
   Musi pokazać wymagane składniki i upływający czas tak, żeby dało się to
   odczytać kątem oka, w trakcie cięcia. To jest prawdziwe zadanie projektowe,
   nie ozdoba.
2. **Klient przy barze** — stan oczekiwania, zadowolenia, zniecierpliwienia.
3. **Ekran końca rundy** — wynik, zachęta do powtórki, miejsce na reklamę
   z nagrodą.
4. **Ekran startowy** — wymagany przez platformy: dźwięk wolno włączyć dopiero
   po geście użytkownika.

Zanim zaczniesz projektować kartę zamówienia, przeczytaj `GDD.md` — kształt
danych zamówienia decyduje o tym, co w ogóle da się pokazać.

## Dostępność

Nie jest to formalność w grze opartej na kolorze: część graczy nie odróżnia
czerwieni od zieleni. Stąd zasada z `ART-SPEC.md` o różnicowaniu **jasnością**,
nie odcieniem. Dotyczy tak samo interfejsu — stan „udane" i „nieudane" nie może
różnić się wyłącznie barwą.

Fokus klawiaturowy ma widoczny stan (`:focus-visible`). Animacje respektują
`prefers-reduced-motion`.
