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
  };

  let video = null;
  let panel = null;
  let rafScheduled = false;

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

  // ---------- Logika pętli ----------

  function onTimeUpdate() {
    if (!state.enabled || !video) return;
    const { start, end } = state;
    if (end == null) return;
    // Gdy przekroczymy koniec -> wróć do początku.
    if (video.currentTime >= end - 0.05) {
      video.currentTime = start != null ? start : 0;
      if (video.paused) video.play().catch(() => {});
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
      <div class="ytloop-header">
        <span class="ytloop-title">🔁 Pętla fragmentu</span>
        <label class="ytloop-switch">
          <input type="checkbox" id="ytloop-enable">
          <span>Włącz</span>
        </label>
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
    updateStatus();
    updateMarkers();
  }

  function updateStatus() {
    const status = panel?.querySelector("#ytloop-status");
    if (!status) return;
    if (state.enabled && state.end != null) {
      status.textContent = `Pętla: ${fmt(state.start ?? 0)} – ${fmt(state.end)}`;
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
      if (state.enabled && state.end == null && video?.duration) {
        // Domyślnie: brak końca -> ustaw na koniec filmu nie ma sensu; wymagaj końca.
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
    startInput.addEventListener("change", commitStart);
    startInput.addEventListener("blur", commitStart);
    endInput.addEventListener("change", commitEnd);
    endInput.addEventListener("blur", commitEnd);
    [startInput, endInput].forEach((inp) =>
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") inp.blur();
        e.stopPropagation(); // nie wyzwalaj skrótów YouTube
      })
    );

    panel.querySelector("#ytloop-goto-start").addEventListener("click", () => {
      if (video && state.start != null) {
        video.currentTime = state.start;
        video.play().catch(() => {});
      }
    });
    panel.querySelector("#ytloop-clear").addEventListener("click", () => {
      state.start = null;
      state.end = null;
      state.enabled = false;
      saveState();
      syncInputs();
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
      if (!panel) return;
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
      panel.classList.add("ytloop-flash");
      setTimeout(() => panel.classList.remove("ytloop-flash"), 900);
    });
    controls.insertBefore(btn, controls.firstChild);
  }

  // ---------- Montaż panelu ----------

  function mountPanel() {
    if (document.getElementById(PANEL_ID)) {
      panel = document.getElementById(PANEL_ID);
      return;
    }
    const playerContainer =
      document.querySelector("#player.ytd-watch-flexy") ||
      document.querySelector("#player");
    if (!playerContainer || !playerContainer.parentElement) return;
    panel = buildPanel();
    playerContainer.after(panel);
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
      video.addEventListener("seeking", () => {});
    }
  }

  function loadForCurrentVideo() {
    const id = getVideoId();
    state.videoId = id;
    loadState(id, (saved) => {
      state.start = saved?.start ?? null;
      state.end = saved?.end ?? null;
      state.enabled = saved?.enabled ?? false;
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
    loadForCurrentVideo();
  }

  // YouTube to SPA - nasłuchuj zmian nawigacji.
  window.addEventListener("yt-navigate-finish", () => setTimeout(init, 300));
  document.addEventListener("yt-navigate-finish", () => setTimeout(init, 300));

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
