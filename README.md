# YouTube Loop 🔁

Wtyczka do przeglądarki (Chrome / Edge / Brave – Manifest V3), która pozwala
zdefiniować **początek** i **koniec** pętli na filmie YouTube i odtwarzać
wybrany fragment w kółko.

## Funkcje

- Ustawianie początku i końca pętli przyciskiem **⏱ Teraz** (bierze aktualny czas
  filmu) lub ręcznie w polu tekstowym (format `m:ss`, `h:mm:ss` albo same sekundy).
- Włącznik pętli – po dojściu do końca film automatycznie wraca do początku.
- Markery zaznaczające fragment na pasku postępu odtwarzacza.
- Przycisk 🔁 w pasku odtwarzacza, który przewija do panelu sterowania.
- Ustawienia zapamiętywane osobno dla każdego filmu (`chrome.storage.local`).
- Działa z nawigacją SPA YouTube (zmiana filmu bez przeładowania strony).

## Instalacja (tryb deweloperski)

1. Otwórz `chrome://extensions` (lub `edge://extensions`).
2. Włącz **Tryb dewelopera** (Developer mode) w prawym górnym rogu.
3. Kliknij **Wczytaj rozpakowane** (Load unpacked) i wskaż ten folder.
4. Wejdź na dowolny film: `https://www.youtube.com/watch?v=...`.

Panel „🔁 Pętla fragmentu" pojawi się pod odtwarzaczem.

## Użycie

1. Przewiń film do momentu, w którym pętla ma się zaczynać → kliknij
   **⏱ Teraz** przy „Początek".
2. Przewiń do końca fragmentu → kliknij **⏱ Teraz** przy „Koniec".
   (Możesz też wpisać czasy ręcznie, np. `1:30` i `2:05`.)
3. Zaznacz **Włącz**. Film będzie odtwarzał fragment w pętli.

- **⏮ Do początku** – skok na początek fragmentu.
- **✕ Wyczyść** – kasuje ustawienia pętli dla bieżącego filmu.

## Pliki

- `manifest.json` – konfiguracja wtyczki (MV3).
- `content.js` – logika pętli + panel sterowania, wstrzykiwane na stronie YT.
- `content.css` – style panelu i markerów.
- `icons/` – ikony wtyczki.
