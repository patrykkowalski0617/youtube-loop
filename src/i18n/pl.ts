import { type Dictionary } from "./types";

const REP_FEW_MIN = 2;
const REP_FEW_MAX = 4;
const REP_TEEN_MIN = 12;
const REP_TEEN_MAX = 14;
const DECIMAL_BASE = 10;
const HUNDRED = 100;

function repetitions(count: number): string {
  const last = count % DECIMAL_BASE;
  const teen = count % HUNDRED;
  if (count === 1) return "powtórzenie";
  if (last >= REP_FEW_MIN && last <= REP_FEW_MAX && (teen < REP_TEEN_MIN || teen > REP_TEEN_MAX))
    return "powtórzenia";
  return "powtórzeń";
}

export const pl: Dictionary = {
  panel: {
    title: "Pętla",
    enable: "Zapętl fragment",
    hidePanel: "Ukryj panel",
    start: "Początek",
    end: "Koniec",
    now: "⏱",
    setToCurrentTime: (mark: string) => `Ustaw ${mark.toLowerCase()} na bieżący czas`,
    timePlaceholder: "0:00.00",
    gap: "Przerwa (s)",
    speedMode: {
      off: "Pełna prędkość",
      fixed: "Stałe",
      ramp: "Narastające",
    },
    speed: "Tempo",
    startSpeed: "Od",
    targetSpeed: "Do",
    step: "Krok",
    playFromBeginning: "Odtwarzaj od początku",
    stop: "Zatrzymaj",
    version: (v: string) => `v${v}`,
  },
  status: {
    noPractice: "Nic jeszcze nie ćwiczone",
  },
  side: {
    handle: "◴ Pętla",
    title: "YouTube Loop",
    close: "Zamknij",
    tabStats: "Statystyki",
    tabSaved: "Zapisane filmy",
    tabSettings: "Ustawienia",
  },
  settings: {
    heading: "Ustawienia",
    languageGlyph: "◱",
    languageLabel: "Język",
    languageTitle: "Zmień język rozszerzenia",
    languageMenu: "Wybierz język",
    languageHint: "Każdy napis w panelu, szufladzie i podpowiedziach idzie za tym ustawieniem.",
    accountHeading: "Konto i synchronizacja",
    chevron: "›",
    check: "✓",
  },
  practice: {
    today: (time: string) => `Dzisiaj ${time}`,
    empty: "Nic jeszcze nie zmierzone. Włącz pętlę i pozwól jednemu przebiegowi dojść do końca.",
    scopeVideo: "Ten film",
    scopeAll: "Wszystkie filmy",
    range: (days: number) => `${days}d`,
    rangeTitle: (days: number) => `Pokaż ostatnie ${days} dni`,
    undoRep: "↶ Nie licz ostatniego powtórzenia",
    undoRepTitle: "Usuń przed chwilą policzone powtórzenie wraz z jego czasem i tempem",
  },
  chart: {
    heading: "Ćwiczenie dzień po dniu",
    hint: "Wysokość słupka to czas ćwiczenia. Liczba nad słupkiem to najwyższe tempo utrzymane przez całe powtórzenie tego dnia.",
    zeroTime: "0:00",
    dayTooltip: (day: string, weekday: string, time: string, reps: number) =>
      `${weekday}, ${day} - ${time} w ${reps} ${repetitions(reps)}`,
    bestTooltip: (tempo: string) => ` - najlepsze tempo ${tempo}x`,
    tempo: (tempo: string) => `${tempo}x`,
    legendTime: "Czas ćwiczenia",
    legendTempo: "Najlepsze tempo dnia",
  },
  stats: {
    sectionPractice: "Czas ćwiczenia",
    sectionReps: "Powtórzenia",
    sectionSessions: "Sesje",
    sectionTempo: "Tempo",
    sectionOther: "Pozostały czas",
    sectionTrend: "Ostatnie 7 dni wobec 7 wcześniejszych",
    sectionLibrary: "Biblioteka",
    none: "-",
    never: "Nigdy",
    total: {
      label: "Łącznie",
      hint: "Każde policzone powtórzenie od początku, bez ograniczeń czasu.",
    },
    inRange: {
      label: "W tym zakresie",
      hint: "Czas ćwiczenia w wybranej liczbie dni.",
    },
    today: {
      label: "Dzisiaj",
      hint: "Czas ćwiczenia liczony od północy.",
    },
    perActiveDay: {
      label: "Na dzień z ćwiczeniem",
      hint: "Średni czas ćwiczenia w dniach, w których naprawdę grasz.",
    },
    activeDays: {
      label: "Dni z ćwiczeniem",
      hint: "Dni w tym zakresie z co najmniej jednym ukończonym powtórzeniem.",
    },
    streak: {
      label: "Aktualna seria",
      hint: "Dni z rzędu z ćwiczeniem, licząc wstecz od dzisiaj.",
    },
    longestStreak: {
      label: "Najdłuższa seria",
      hint: "Najdłuższy ciąg kolejnych dni z ćwiczeniem w historii.",
    },
    reps: {
      label: "Powtórzenia",
      hint: "Przebiegi pętli, które doszły do końca fragmentu w tym zakresie.",
    },
    repsTotal: {
      label: "Powtórzenia łącznie",
      hint: "Ukończone przebiegi od pierwszego dnia, bez ograniczeń czasu.",
    },
    completion: {
      label: "Ukończone",
      hint: "Udział rozpoczętych przebiegów, które doszły do końca zamiast zostać przerwane.",
    },
    aborted: {
      label: "Przerwane",
      hint: "Przebiegi porzucone przed końcem - zatrzymane, przewinięte albo z nowymi znacznikami.",
    },
    perRep: {
      label: "Na powtórzenie",
      hint: "Średnia zmierzona długość jednego ukończonego przebiegu, razem ze zwolnieniem.",
    },
    segment: {
      label: "Długość fragmentu",
      hint: "Średnia odległość między znacznikiem początku i końca.",
    },
    sessions: {
      label: "Sesje",
      hint: "Bloki ćwiczenia rozdzielone przerwą dłuższą niż 10 minut.",
    },
    perSession: {
      label: "Średnia sesja",
      hint: "Czas ćwiczenia przypadający na jedną sesję w tym zakresie.",
    },
    longestSession: {
      label: "Najdłuższa sesja",
      hint: "Najwięcej czasu ćwiczenia w jednym nieprzerwanym bloku.",
    },
    bestTempoEver: {
      label: "Rekord tempa",
      hint: "Najwyższe tempo utrzymane przez całe powtórzenie. Nigdy nie wygasa.",
    },
    bestTempoRange: {
      label: "Najlepsze w zakresie",
      hint: "Najwyższe tempo utrzymane przez całe powtórzenie w wybranych dniach.",
    },
    targetTempo: {
      label: "Tempo docelowe",
      hint: "Tempo, do którego zmierza narastanie.",
    },
    toTarget: {
      label: "Do celu",
      hint: "Jak blisko celu jest twój rekord tempa.",
    },
    targetReached: {
      label: "Cel osiągnięty",
      hint: "Dzień, w którym tempo docelowe pierwszy raz utrzymało się przez całe powtórzenie.",
    },
    tempoEdges: {
      label: "Rozgrzewka do końca",
      hint: "Pierwsze i ostatnie tempo utrzymane w ostatnim dniu ćwiczeń.",
    },
    watched: {
      label: "Oglądane bez pętli",
      hint: "Czas, w którym film grał przy wyłączonej pętli.",
    },
    idle: {
      label: "Pauzy i przerwy",
      hint: "Czas w pauzie podczas zapętlenia oraz przerwa między powtórzeniami.",
    },
    abandoned: {
      label: "Porzucone",
      hint: "Czas spędzony w przebiegach, które nigdy nie doszły do końca.",
    },
    trendTime: {
      label: "Czas ćwiczenia",
      hint: "Ostatnie 7 dni wobec 7 dni wcześniejszych.",
    },
    trendReps: {
      label: "Powtórzenia",
      hint: "Ukończone powtórzenia w tym tygodniu wobec poprzedniego.",
    },
    trendTempo: {
      label: "Najlepsze tempo",
      hint: "Najlepsze tempo w tym tygodniu wobec poprzedniego.",
    },
    videos: {
      label: "Śledzone filmy",
      hint: "Filmy z jakimkolwiek zapisanym ćwiczeniem na tym urządzeniu.",
    },
    activeVideos: {
      label: "Aktywne w zakresie",
      hint: "Filmy ćwiczone w wybranych dniach.",
    },
    tempoHistogram: {
      label: "Powtórzenia według tempa",
      hint: "Ile ukończonych powtórzeń przypada na każde tempo.",
    },
    hours: {
      label: "Kiedy ćwiczysz",
      hint: "Czas ćwiczenia w podziale na godziny doby.",
    },
    fragments: {
      label: "Fragmenty",
      hint: "Czas ćwiczenia każdego zapisanego fragmentu, dopasowany po znacznikach.",
    },
    topVideos: {
      label: "Najwięcej ćwiczone",
      hint: "Filmy uszeregowane według czasu ćwiczenia w tym zakresie.",
    },
    tags: {
      label: "Czas według tagów",
      hint: "Czas ćwiczenia wszystkich filmów z danym tagiem.",
    },
    neglected: "Najdawniej ćwiczony",
    unnamedFragment: (start: string, end: string) => `${start} - ${end}`,
    repsShort: (count: number) => `×${count}`,
    repsCount: (count: number) => `${count} ${repetitions(count)}`,
    hourLabel: (hour: string) => `${hour}:00`,
    lastPlayed: (when: string) => `ostatnio ${when}`,
    trend: (current: string, previous: string) => `${current} wobec ${previous}`,
    percent: (value: string) => `${value}%`,
    times: (value: string) => `${value}x`,
    edges: (first: string, last: string) => `${first}x → ${last}x`,
  },
  fragments: {
    heading: "Fragmenty",
    empty: "Brak zapisanych fragmentów.",
    add: "+",
    addTitle: "Zapisz bieżący fragment",
    addNoteOnBar: "Kliknij dwukrotnie, aby dodać notatkę",
    editNoteOnBar: "Kliknij dwukrotnie, aby zmienić notatkę",
    notePlaceholder: "Twoja notatka",
    remove: "Usuń fragment",
    range: (start: string, end: string) => `${start} – ${end}`,
  },
  drawer: {
    empty: "Brak zapisanych filmów.",
    searchPlaceholder: "Szukaj w tytułach, tagach i notatkach",
    noMatches: "Nic nie pasuje.",
    played: (time: string) => `▶ ${time} ćwiczenia`,
    neverPlayed: "Nigdy nie ćwiczony",
    sortBy: "Sortuj",
    sortSaved: "Ostatnio zapisane",
    sortPlayed: "Najdłużej ćwiczone",
    sortLastPlayed: "Ostatnio ćwiczone",
    sortTitle: "Tytuł A-Z",
    moreNotes: (count: number) => `+${count}`,
    remove: "Usuń",
    removeIn: (seconds: number) => `Usuwam za ${seconds}s`,
    undo: "↶ Cofnij",
    undoTitle: "Zatrzymaj ten film",
  },
  tags: {
    add: "+ Tag",
    addTitle: "Dodaj tag do tego filmu",
    placeholder: "Nazwa tagu",
    remove: (name: string) => `Usuń ${name}`,
    edit: (name: string) => `Zmień nazwę ${name}`,
    filterBy: (name: string) => `Filtruj po ${name}`,
    filterHeading: "Filtruj po tagu",
    none: "Brak tagów",
  },
  playerButton: {
    title: "Zapętl fragment (YouTube Loop)",
  },
  account: {
    signIn: "Zaloguj przez Google",
    signOut: "Wyloguj",
    on: "Zsynchronizowane",
    off: "Niezalogowany - dane zostają na tym urządzeniu",
    checking: "Sprawdzam konto...",
    error: "Błąd synchronizacji",
  },
  common: {
    close: "✕",
    noTitle: "(bez tytułu)",
  },
};
