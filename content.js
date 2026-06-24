/* YouTube Loop - content script
 * Pozwala wyznaczyć początek i koniec pętli i odtwarzać fragment filmu w kółko.
 */
(() => {
  "use strict";

  const PANEL_ID = "ytloop-panel";
  const BTN_ID = "ytloop-toggle-btn";

  /** Stan dla aktualnego filmu. */
  const state = {
    start: null, // sekundy lub null
    end: null, // sekundy lub null
    enabled: false,
    videoId: null,
    tail: 1, // sekundy pauzy między odtworzeniami (ustawienie globalne)
    // Stopniowa zmiana prędkości (per film):
    speedEnabled: false,
    speedStart: 1, // prędkość pierwszej pętli
    speedTarget: 1.5, // prędkość docelowa
    speedStep: 0.1, // o ile zmienić co pętlę
  };

  const GLOBAL_KEY = "ytloop:settings";
  const DEFAULT_TAIL = 1;
  const SPEED_MIN = 0.25;
  const SPEED_MAX = 2;

  let video = null;
  let panel = null;
  let inTail = false; // czy trwa pauza między odtworzeniami
  let tailTimer = null;
  let currentSpeed = 1; // aktualna prędkość bieżącej sesji pętli
  let applyingSpeed = false; // strażnik przed pętlą zdarzeń ratechange
  let desiredPlayState = null; // "play" | "pause" - wymuszane po naciśnięciu spacji

  // ---------- Pomocnicze: czas ----------

  /** Sekundy -> "m:ss" lub "h:mm:ss". */
  function fmt(sec) {
    if (sec == null || isNaN(sec)) return "--:--";
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  /** "1:23" / "1:02:03" / "83" / "83.5" -> sekundy (number) lub null. */
  function parseTime(str) {
    if (str == null) return null;
    str = String(str).trim();
    if (str === "") return null;
    if (str.includes(":")) {
      const parts = str.split(":").map((p) => p.trim());
      if (parts.some((p) => p === "" || isNaN(Number(p)))) return null;
      let total = 0;
      for (const p of parts) total = total * 60 + Number(p);
      return total;
    }
    const n = Number(str);
    return isNaN(n) ? null : n;
  }

  // ---------- Wideo ----------

  function getVideo() {
    return document.querySelector(
      "#movie_player video.html5-main-video, video.html5-main-video, #movie_player video"
    );
  }

  function getVideoId() {
    try {
      return new URL(location.href).searchParams.get("v");
    } catch {
      return null;
    }
  }

  // ---------- Trwałość (per film) ----------

  function storageKey(id) {
    return "ytloop:" + id;
  }

  function saveState() {
    if (!state.videoId || !chrome?.storage?.local) return;
    chrome.storage.local.set({
      [storageKey(state.videoId)]: {
        start: state.start,
        end: state.end,
        enabled: state.enabled,
        speedEnabled: state.speedEnabled,
        speedStart: state.speedStart,
        speedTarget: state.speedTarget,
        speedStep: state.speedStep,
      },
    });
  }

  function loadState(id, cb) {
    if (!id || !chrome?.storage?.local) {
      cb(null);
      return;
    }
    chrome.storage.local.get(storageKey(id), (res) => {
      cb(res ? res[storageKey(id)] : null);
    });
  }

  function saveGlobalSettings() {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.set({ [GLOBAL_KEY]: { tail: state.tail } });
  }

  function loadGlobalSettings(cb) {
    if (!chrome?.storage?.local) {
      cb(null);
      return;
    }
    chrome.storage.local.get(GLOBAL_KEY, (res) => cb(res ? res[GLOBAL_KEY] : null));
  }

  // ---------- Logika pętli ----------

  // ---------- Prędkość odtwarzania ----------

  function clampSpeed(v) {
    return Math.min(SPEED_MAX, Math.max(SPEED_MIN, v));
  }

  /** Ustaw prędkość bieżącej sesji na początkową. */
  function resetSpeed() {
    currentSpeed = clampSpeed(state.speedStart);
  }

  /** Wymuś prędkość na elemencie wideo (z ochroną przed pętlą zdarzeń). */
  function applySpeed() {
    if (!video) return;
    applyingSpeed = true;
    try {
      video.playbackRate = currentSpeed;
    } catch {}
    applyingSpeed = false;
    updateStatus();
  }

  /** Zwiększ/zmniejsz prędkość o krok w stronę celu (z zatrzymaniem na celu). */
  function stepSpeed() {
    const start = clampSpeed(state.speedStart);
    const target = clampSpeed(state.speedTarget);
    const step = Math.abs(state.speedStep) || 0;
    if (step === 0 || target === start) {
      currentSpeed = target;
      return;
    }
    const dir = target > start ? 1 : -1;
    let next = currentSpeed + dir * step;
    next = dir > 0 ? Math.min(next, target) : Math.max(next, target);
    currentSpeed = clampSpeed(next);
  }

  function restartLoop() {
    if (!video) return;
    if (state.speedEnabled) {
      stepSpeed();
      applySpeed();
    }
    video.currentTime = state.start != null ? state.start : 0;
    if (video.paused) video.play().catch(() => {});
  }

  /** Skok na początek fragmentu + odtwarzanie od prędkości początkowej. */
  function gotoStartAndPlay() {
    if (!video) return;
    cancelTail();
    resetSpeed();
    if (state.speedEnabled) applySpeed();
    video.currentTime = state.start != null ? state.start : 0;
    video.play().catch(() => {});
    syncInputs();
  }

  /** Wymuś docelowy stan play/pause przez kilka klatek, by pobić handler YT. */
  function enforceDesiredState() {
    let tries = 0;
    const enforce = () => {
      if (!video || desiredPlayState == null) return;
      if (desiredPlayState === "pause" && !video.paused) video.pause();
      if (desiredPlayState === "play" && video.paused)
        video.play().catch(() => {});
      if (++tries < 6) setTimeout(enforce, 40);
      else desiredPlayState = null;
    };
    enforce();
  }

  /** Spacja: jeśli gra -> stop + reset prędkości; jeśli stoi -> od początku. */
  function toggleLoopPlayback() {
    if (!video) return;
    cancelTail();
    if (!video.paused) {
      // Gra -> stop. Prędkość zostaje (widoczna w UI), reset dopiero przy starcie.
      desiredPlayState = "pause";
    } else {
      // Stoi -> od początku fragmentu, prędkość początkowa.
      desiredPlayState = "play";
      resetSpeed();
      if (state.speedEnabled) applySpeed();
      video.currentTime = state.start != null ? state.start : 0;
    }
    enforceDesiredState();
    syncInputs();
  }

  function cancelTail() {
    if (tailTimer) {
      clearTimeout(tailTimer);
      tailTimer = null;
    }
    inTail = false;
  }

  function onTimeUpdate() {
    if (!state.enabled || !video || inTail) return;
    const { start, end } = state;
    if (end == null) return;
    // Gdy przekroczymy koniec -> przerwa (tail), potem wróć do początku.
    if (video.currentTime >= end - 0.05) {
      const tail = state.tail > 0 ? state.tail : 0;
      if (tail > 0) {
        inTail = true;
        video.pause();
        tailTimer = setTimeout(() => {
          tailTimer = null;
          inTail = false;
          if (state.enabled) restartLoop();
        }, tail * 1000);
      } else {
        restartLoop();
      }
    } else if (start != null && video.currentTime < start - 0.5) {
      // Jeśli użytkownik przewinął przed początek, podciągnij do startu.
      video.currentTime = start;
    }
  }

  // ---------- Markery na pasku postępu ----------

  function updateMarkers() {
    const bar = document.querySelector(".ytp-progress-bar");
    let layer = document.getElementById("ytloop-markers");
    if (!bar) return;
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "ytloop-markers";
      layer.innerHTML =
        '<div class="ytloop-marker ytloop-marker-start"></div>' +
        '<div class="ytloop-marker ytloop-marker-end"></div>' +
        '<div class="ytloop-range"></div>';
      bar.appendChild(layer);
    }
    const dur = video?.duration;
    const mStart = layer.querySelector(".ytloop-marker-start");
    const mEnd = layer.querySelector(".ytloop-marker-end");
    const range = layer.querySelector(".ytloop-range");
    layer.style.display = state.enabled ? "block" : "none";
    if (!dur || !isFinite(dur)) return;
    const pct = (t) => Math.min(100, Math.max(0, (t / dur) * 100));
    if (state.start != null) {
      mStart.style.display = "block";
      mStart.style.left = pct(state.start) + "%";
    } else mStart.style.display = "none";
    if (state.end != null) {
      mEnd.style.display = "block";
      mEnd.style.left = pct(state.end) + "%";
    } else mEnd.style.display = "none";
    if (state.start != null && state.end != null && state.end > state.start) {
      range.style.display = "block";
      range.style.left = pct(state.start) + "%";
      range.style.width = pct(state.end) - pct(state.start) + "%";
    } else range.style.display = "none";
  }

  // ---------- Panel UI ----------

  function buildPanel() {
    const el = document.createElement("div");
    el.id = PANEL_ID;
    el.innerHTML = `
      <div class="ytloop-header" id="ytloop-drag">
        <span class="ytloop-title">🔁 Pętla fragmentu</span>
        <div class="ytloop-header-right">
          <label class="ytloop-switch">
            <input type="checkbox" id="ytloop-enable">
            <span>Włącz</span>
          </label>
          <button id="ytloop-close" class="ytloop-close" title="Ukryj panel">✕</button>
        </div>
      </div>
      <div class="ytloop-row">
        <div class="ytloop-field">
          <label>Początek</label>
          <div class="ytloop-input-group">
            <input type="text" id="ytloop-start" placeholder="0:00" autocomplete="off">
            <button id="ytloop-set-start" title="Ustaw na aktualny czas">⏱ Teraz</button>
          </div>
        </div>
        <div class="ytloop-field">
          <label>Koniec</label>
          <div class="ytloop-input-group">
            <input type="text" id="ytloop-end" placeholder="0:00" autocomplete="off">
            <button id="ytloop-set-end" title="Ustaw na aktualny czas">⏱ Teraz</button>
          </div>
        </div>
      </div>
      <div class="ytloop-row">
        <div class="ytloop-field">
          <label>Przerwa między pętlami (s)</label>
          <div class="ytloop-input-group">
            <input type="text" id="ytloop-tail" placeholder="1" autocomplete="off" inputmode="decimal">
          </div>
        </div>
      </div>
      <div class="ytloop-speed">
        <label class="ytloop-switch ytloop-speed-toggle">
          <input type="checkbox" id="ytloop-speed-enable">
          <span>Stopniowo zmieniaj prędkość</span>
        </label>
        <div class="ytloop-row" id="ytloop-speed-fields">
          <div class="ytloop-field">
            <label>Początkowa</label>
            <input type="text" id="ytloop-speed-start" autocomplete="off" inputmode="decimal">
          </div>
          <div class="ytloop-field">
            <label>Docelowa</label>
            <input type="text" id="ytloop-speed-target" autocomplete="off" inputmode="decimal">
          </div>
          <div class="ytloop-field">
            <label>Krok</label>
            <input type="text" id="ytloop-speed-step" autocomplete="off" inputmode="decimal">
          </div>
        </div>
        <div class="ytloop-hint">Zakres 0.25–2x (jak YouTube).</div>
      </div>
      <div class="ytloop-actions">
        <button id="ytloop-goto-start" class="ytloop-secondary">⏮ Do początku</button>
        <button id="ytloop-clear" class="ytloop-secondary">✕ Wyczyść</button>
      </div>
      <div class="ytloop-status" id="ytloop-status"></div>
    `;
    return el;
  }

  function syncInputs() {
    if (!panel) return;
    panel.querySelector("#ytloop-enable").checked = state.enabled;
    const startInput = panel.querySelector("#ytloop-start");
    const endInput = panel.querySelector("#ytloop-end");
    if (document.activeElement !== startInput)
      startInput.value = state.start != null ? fmt(state.start) : "";
    if (document.activeElement !== endInput)
      endInput.value = state.end != null ? fmt(state.end) : "";
    const tailInput = panel.querySelector("#ytloop-tail");
    if (tailInput && document.activeElement !== tailInput)
      tailInput.value = String(state.tail);

    const speedEnable = panel.querySelector("#ytloop-speed-enable");
    const speedStartInput = panel.querySelector("#ytloop-speed-start");
    const speedTargetInput = panel.querySelector("#ytloop-speed-target");
    const speedStepInput = panel.querySelector("#ytloop-speed-step");
    if (speedEnable) speedEnable.checked = state.speedEnabled;
    const setIf = (inp, val) => {
      if (inp && document.activeElement !== inp) inp.value = String(val);
    };
    setIf(speedStartInput, state.speedStart);
    setIf(speedTargetInput, state.speedTarget);
    setIf(speedStepInput, state.speedStep);
    const fields = panel.querySelector("#ytloop-speed-fields");
    if (fields) fields.style.opacity = state.speedEnabled ? "1" : "0.45";

    updateStatus();
    updateMarkers();
  }

  function updateStatus() {
    const status = panel?.querySelector("#ytloop-status");
    if (!status) return;
    if (state.enabled && state.end != null) {
      let txt = `Pętla: ${fmt(state.start ?? 0)} – ${fmt(state.end)}`;
      if (state.speedEnabled) txt += ` · ${currentSpeed.toFixed(2)}x`;
      status.textContent = txt;
      status.className = "ytloop-status active";
    } else if (state.start != null || state.end != null) {
      status.textContent = "Pętla wyłączona (zaznacz „Włącz”)";
      status.className = "ytloop-status";
    } else {
      status.textContent = "Ustaw początek i koniec fragmentu.";
      status.className = "ytloop-status";
    }
  }

  function wirePanel() {
    const enable = panel.querySelector("#ytloop-enable");
    const startInput = panel.querySelector("#ytloop-start");
    const endInput = panel.querySelector("#ytloop-end");

    enable.addEventListener("change", () => {
      state.enabled = enable.checked;
      if (!state.enabled) {
        cancelTail();
      } else if (state.speedEnabled) {
        resetSpeed();
        applySpeed();
      }
      saveState();
      syncInputs();
    });

    panel.querySelector("#ytloop-set-start").addEventListener("click", () => {
      if (video) {
        state.start = Math.round(video.currentTime * 10) / 10;
        saveState();
        syncInputs();
      }
    });
    panel.querySelector("#ytloop-set-end").addEventListener("click", () => {
      if (video) {
        state.end = Math.round(video.currentTime * 10) / 10;
        saveState();
        syncInputs();
      }
    });

    const commitStart = () => {
      const v = parseTime(startInput.value);
      state.start = v;
      saveState();
      syncInputs();
    };
    const commitEnd = () => {
      const v = parseTime(endInput.value);
      state.end = v;
      saveState();
      syncInputs();
    };
    // --- Prędkość ---
    const speedEnable = panel.querySelector("#ytloop-speed-enable");
    const speedStartInput = panel.querySelector("#ytloop-speed-start");
    const speedTargetInput = panel.querySelector("#ytloop-speed-target");
    const speedStepInput = panel.querySelector("#ytloop-speed-step");
    const parseNum = (s) => parseFloat(String(s).replace(",", "."));

    speedEnable.addEventListener("change", () => {
      state.speedEnabled = speedEnable.checked;
      saveState();
      if (state.speedEnabled) {
        resetSpeed();
        if (state.enabled) applySpeed();
      } else if (video) {
        applyingSpeed = true;
        try {
          video.playbackRate = 1;
        } catch {}
        applyingSpeed = false;
      }
      syncInputs();
    });

    const commitSpeedStart = () => {
      const v = parseNum(speedStartInput.value);
      state.speedStart = !isNaN(v) ? clampSpeed(v) : 1;
      if (state.speedEnabled) {
        resetSpeed();
        if (state.enabled) applySpeed();
      }
      saveState();
      syncInputs();
    };
    const commitSpeedTarget = () => {
      const v = parseNum(speedTargetInput.value);
      state.speedTarget = !isNaN(v) ? clampSpeed(v) : 1.5;
      saveState();
      syncInputs();
    };
    const commitSpeedStep = () => {
      const v = parseNum(speedStepInput.value);
      state.speedStep = !isNaN(v) && v > 0 ? v : 0.1;
      saveState();
      syncInputs();
    };
    speedStartInput.addEventListener("change", commitSpeedStart);
    speedStartInput.addEventListener("blur", commitSpeedStart);
    speedTargetInput.addEventListener("change", commitSpeedTarget);
    speedTargetInput.addEventListener("blur", commitSpeedTarget);
    speedStepInput.addEventListener("change", commitSpeedStep);
    speedStepInput.addEventListener("blur", commitSpeedStep);
    [speedStartInput, speedTargetInput, speedStepInput].forEach((inp) =>
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") inp.blur();
        e.stopPropagation();
      })
    );

    const tailInput = panel.querySelector("#ytloop-tail");
    const commitTail = () => {
      const v = parseFloat(String(tailInput.value).replace(",", "."));
      state.tail = !isNaN(v) && v >= 0 ? v : DEFAULT_TAIL;
      saveGlobalSettings();
      syncInputs();
    };
    tailInput.addEventListener("change", commitTail);
    tailInput.addEventListener("blur", commitTail);

    startInput.addEventListener("change", commitStart);
    startInput.addEventListener("blur", commitStart);
    endInput.addEventListener("change", commitEnd);
    endInput.addEventListener("blur", commitEnd);
    [startInput, endInput, tailInput].forEach((inp) =>
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") inp.blur();
        e.stopPropagation(); // nie wyzwalaj skrótów YouTube
      })
    );

    panel.querySelector("#ytloop-goto-start").addEventListener("click", () => {
      gotoStartAndPlay();
    });
    panel.querySelector("#ytloop-clear").addEventListener("click", () => {
      state.start = null;
      state.end = null;
      state.enabled = false;
      cancelTail();
      saveState();
      syncInputs();
    });

    panel.querySelector("#ytloop-close").addEventListener("click", () => {
      setPanelVisible(false);
    });

    enableDrag(panel.querySelector("#ytloop-drag"), panel);
  }

  // ---------- Widoczność i przeciąganie ----------

  function setPanelVisible(visible) {
    if (!panel) return;
    panel.style.display = visible ? "block" : "none";
    const btn = document.getElementById(BTN_ID);
    if (btn) btn.classList.toggle("ytloop-active", visible);
  }

  function isPanelVisible() {
    return panel && panel.style.display !== "none";
  }

  function enableDrag(handle, target) {
    if (!handle) return;
    let dragging = false;
    let offX = 0;
    let offY = 0;
    handle.addEventListener("mousedown", (e) => {
      // Nie przeciągaj, gdy klikamy w kontrolki w nagłówku.
      if (e.target.closest("input, button, label")) return;
      dragging = true;
      const rect = target.getBoundingClientRect();
      offX = e.clientX - rect.left;
      offY = e.clientY - rect.top;
      target.style.right = "auto";
      target.style.bottom = "auto";
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - offX));
      const y = Math.max(0, Math.min(window.innerHeight - 30, e.clientY - offY));
      target.style.left = x + "px";
      target.style.top = y + "px";
    });
    window.addEventListener("mouseup", () => {
      dragging = false;
    });
  }

  // ---------- Przycisk w pasku odtwarzacza ----------

  function injectPlayerButton() {
    const controls = document.querySelector(".ytp-right-controls");
    if (!controls || document.getElementById(BTN_ID)) return;
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.className = "ytp-button ytloop-ytp-button";
    btn.title = "Pętla fragmentu (YouTube Loop)";
    btn.textContent = "🔁";
    btn.addEventListener("click", () => {
      if (!panel) mountPanel();
      if (!panel) return;
      const show = !isPanelVisible();
      setPanelVisible(show);
      if (show) {
        panel.classList.add("ytloop-flash");
        setTimeout(() => panel.classList.remove("ytloop-flash"), 900);
      }
    });
    controls.insertBefore(btn, controls.firstChild);
    btn.classList.toggle("ytloop-active", isPanelVisible());
  }

  // ---------- Montaż panelu ----------

  function mountPanel() {
    const existing = document.getElementById(PANEL_ID);
    if (existing) {
      panel = existing;
      return;
    }
    if (!document.body) return;
    panel = buildPanel();
    document.body.appendChild(panel);
    wirePanel();
    syncInputs();
  }

  // ---------- Inicjalizacja / nawigacja SPA ----------

  function attachVideo() {
    const v = getVideo();
    if (v && v !== video) {
      video = v;
      video.addEventListener("timeupdate", onTimeUpdate);
      video.addEventListener("loadedmetadata", () => updateMarkers());
      video.addEventListener("ratechange", () => {
        // Gdy aktywny tryb prędkości, przywróć naszą wartość po resecie YT.
        if (!state.enabled || !state.speedEnabled || applyingSpeed) return;
        if (Math.abs(video.playbackRate - currentSpeed) > 0.001) applySpeed();
      });
    }
  }

  function loadForCurrentVideo() {
    const id = getVideoId();
    state.videoId = id;
    cancelTail();
    loadState(id, (saved) => {
      state.start = saved?.start ?? null;
      state.end = saved?.end ?? null;
      state.enabled = saved?.enabled ?? false;
      state.speedEnabled = saved?.speedEnabled ?? false;
      state.speedStart = saved?.speedStart ?? 1;
      state.speedTarget = saved?.speedTarget ?? 1.5;
      state.speedStep = saved?.speedStep ?? 0.1;
      resetSpeed();
      if (state.enabled && state.speedEnabled) applySpeed();
      syncInputs();
    });
  }

  function init() {
    if (!location.pathname.startsWith("/watch")) {
      // Usuń panel poza stroną filmu.
      document.getElementById(PANEL_ID)?.remove();
      document.getElementById("ytloop-markers")?.remove();
      panel = null;
      return;
    }
    attachVideo();
    mountPanel();
    injectPlayerButton();
    loadGlobalSettings((g) => {
      state.tail = g && typeof g.tail === "number" ? g.tail : DEFAULT_TAIL;
      syncInputs();
    });
    loadForCurrentVideo();
  }

  // YouTube to SPA - nasłuchuj zmian nawigacji.
  window.addEventListener("yt-navigate-finish", () => setTimeout(init, 300));
  document.addEventListener("yt-navigate-finish", () => setTimeout(init, 300));

  // Spacja steruje pętlą (gdy pętla aktywna). Przechwytujemy na window w fazie
  // capture (najwcześniej), żeby ubiec natywny skrót YouTube.
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.code !== "Space" && e.key !== " ") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!location.pathname.startsWith("/watch")) return;
      const t = e.target;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      if (!video || !state.enabled || state.start == null) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleLoopPlayback();
    },
    true
  );

  // Obserwuj DOM dopóki kluczowe elementy się nie pojawią (pierwsze wejście).
  const observer = new MutationObserver(() => {
    if (!location.pathname.startsWith("/watch")) return;
    if (!getVideo() || !document.getElementById(PANEL_ID)) init();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Pętla aktualizacji markerów (lekka).
  function tick() {
    if (panel && state.enabled) updateMarkers();
    requestAnimationFrame(() => setTimeout(tick, 500));
  }
  tick();

  init();
})();
