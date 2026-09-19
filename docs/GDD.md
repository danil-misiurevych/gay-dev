# Koncept gry

Dokument dla osoby od gameplayu i dla jej agenta. Zawiera to, co **zatwierdzone**.
Pomysły niezatwierdzone trzymajcie poza tym plikiem, żeby nie wyglądały na
ustalenia.

## Pitch

Międzygalaktyczny bar. Obcy klienci składają zamówienia. Składniki lecą
w powietrze, gracz tnie te właściwe swipe'em. Pomyłka kosztuje.

## Co jest mechaniką, a co produktem

Cięcie swipe'em to jedna z najczęściej klonowanych mechanik w historii gier
mobilnych. **Samo w sobie nie wyróżnia niczego**, a zamiana owoców na inne
obiekty to reskin, nie różnicowanie. Poprzedni projekt zespołu został przez
Playgamę odrzucony właśnie za podobieństwo do katalogu.

Wyróżnikiem ma być **warstwa zamówień**: presja wyboru właściwego składnika,
klient, konsekwencja pomyłki. Cięcie jest sposobem wprowadzania danych,
nie treścią gry.

Wniosek operacyjny, obowiązujący cały zespół: warstwa zamówień powstaje
**wcześnie i brzydko**, zanim ktokolwiek zacznie polerować efekty cięcia.
Szczegóły w [`ROADMAP.md`](ROADMAP.md).

## Pętla rozgrywki (docelowa)

1. Klient siada przy barze i składa zamówienie: 1–3 składniki.
2. Składniki lecą w powietrze, wymieszane z niepasującymi.
3. Gracz tnie te z zamówienia. Cięcie właściwego — postęp. Cięcie złego — kara.
4. Zamówienie zrealizowane przed upływem cierpliwości klienta → punkty.
5. Tempo rośnie: więcej klientów naraz, krótsza cierpliwość, więcej dystraktorów.

**Nierozstrzygnięte:** czy przepuszczenie właściwego składnika (spadł nietknięty)
karze tak samo jak przecięcie złego. To zmienia całe odczucie gry — pierwsza
wersja kara tylko za przecięcie złego, jako łagodniejsza. Do sprawdzenia
na żywym prototypie.

## Stan obecny

Zaimplementowane: wyrzut balistyczny, cięcie swipe'em, połówki, cząsteczki,
punktacja z combo, licznik nietrafień.

Niezaimplementowane: zamówienia, klienci, rozróżnianie składników, bomby,
progresja trudności, dźwięk, ekran końca rundy.

## Combo

Liczy się w obrębie **jednego ciągłego pociągnięcia**, nie w oknie czasowym.
Decyzja świadoma: okno czasowe nagradza młócenie palcem na oślep, a ciągłość
pociągnięcia nagradza celowanie w kilka obiektów jednym ruchem — czyli
umiejętność, którą chcemy premiować.

Punktacja: `scoreBase` za pierwsze cięcie, `+comboBonus` za każde kolejne
w tym samym pociągnięciu.

## Parametry i strojenie

Wszystkie liczby regulujące odczucie są w [`../config/tuning.js`](../config/tuning.js),
z komentarzem przy każdej. **To jest Twój plik.** Zmiana wartości nie wymaga
dewelopera i nie blokuje nikogo.

Tryb pracy:

1. Otwórz grę na telefonie, wejdź w **Parametry**.
2. Stroj na żywo, grając.
3. Kiedy odczucie jest dobre — **Kopiuj**, wklej liczby do `config/tuning.js`,
   zacommituj.
4. Napisz w commicie, **co** się zmieniło w odczuciu, nie które liczby.

### Para, którą stroi się razem

`minSwipeSpeed` i `hitScale` decydują o tym, czy gra czuje się precyzyjnie, czy
przypadkowo. Nie stroj ich osobno.

- Za niski próg prędkości → da się wygrać powolnym pełzaniem palcem, napięcie znika.
- Za wysoki próg → krótkie, precyzyjne cięcia przestają działać, gra frustruje.
- Za duży hitbox → trafienia „obok" obiektu; gracz nie wie, za co dostał punkty.
- Za mały hitbox → gra wydaje się niesprawiedliwa, choć matematycznie jest uczciwa.

Włącz **Hitboxy** (klawisz `H`), żeby zobaczyć, co faktycznie testuje kod.

## Docelowa grupa i kontekst

Gra przeglądarkowa, głównie telefon, sesje krótkie (1–3 minuty), często jedną
ręką. To ogranicza projekt: żadnego sterowania wymagającego dwóch rąk, żadnych
długich tutoriali, czytelność przy małym ekranie ważniejsza od bogactwa.

## Monetyzacja

Wyłącznie reklamy. Dwa naturalne miejsca:

- **Interstitial** między rundami, nigdy w trakcie.
- **Rewarded** za wznowienie po przegranej albo za bonus na start.

Integracja przez adapter w `src/platform/`. Nie wplatajcie wywołań SDK w pętlę
gry — uzasadnienie w [`ARCHITECTURE.md`](ARCHITECTURE.md).
