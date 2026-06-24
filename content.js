/* YouTube Loop - content script
 * Lets you mark the start and end of a loop and replay a video segment over and over.
 */
(() => {
  "use strict";

  const PANEL_ID = "ytloop-panel";
  const BTN_ID = "ytloop-toggle-btn";

  // Monochrome loop icon (inherits currentColor).
  const LOOP_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>' +
    "</svg>";

  /** State for the current video. */
  const state = {
    start: null, // seconds or null
    end: null, // seconds or null
    enabled: false,
    videoId: null,
    tail: 1, // pause in seconds between replays (global setting)
    // Gradual speed change (per video):
    speedEnabled: false,
    speedStart: 0.65, // speed of the first loop
    speedTarget: 1, // target speed
    speedStep: 0.05, // how much to change each loop
  };

  const GLOBAL_KEY = "ytloop:settings";
  const SAVED_KEY = "ytloop:saved";
  const DEFAULT_TAIL = 1;
  const SPEED_MIN = 0.25;
  const SPEED_MAX = 2;

  let video = null;
  let panel = null;
  let inTail = false; // whether a pause between replays is in progress
  let tailTimer = null;
  let currentSpeed = 1; // current speed of the active loop session
  let applyingSpeed = false; // guard against a ratechange event loop
  let desiredPlayState = null; // "play" | "pause" - enforced after pressing space

  // ---------- Helpers: time ----------

  /** Seconds -> "m:ss" or "h:mm:ss". */
  function fmt(sec) {
    if (sec == null || isNaN(sec)) return "--:--";
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  /** "1:23" / "1:02:03" / "83" / "83.5" -> seconds (number) or null. */
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

  // ---------- Video ----------

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

  // ---------- Persistence (per video) ----------

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

  // ---------- Saved videos list ----------

  function loadSavedList(cb) {
    if (!chrome?.storage?.local) {
      cb([]);
      return;
    }
    chrome.storage.local.get(SAVED_KEY, (res) =>
      cb((res && res[SAVED_KEY]) || [])
    );
  }

  function writeSavedList(list, cb) {
    if (!chrome?.storage?.local) {
      cb && cb();
      return;
    }
    chrome.storage.local.set({ [SAVED_KEY]: list }, cb || (() => {}));
  }

  /** Best-effort video title from the watch page. */
  function getVideoTitle() {
    const h = document.querySelector(
      "ytd-watch-metadata #title h1, #title h1.ytd-watch-metadata, h1.ytd-watch-metadata"
    );
    let t = h && h.textContent ? h.textContent.trim() : "";
    if (!t) t = (document.title || "").replace(/\s*-\s*YouTube\s*$/, "").trim();
    return t || state.videoId || "(no title)";
  }

  /** Snapshot of the current per-video settings + identifying info. */
  function currentSnapshot() {
    return {
      videoId: state.videoId,
      title: getVideoTitle(),
      start: state.start,
      end: state.end,
      enabled: state.enabled,
      speedEnabled: state.speedEnabled,
      speedStart: state.speedStart,
      speedTarget: state.speedTarget,
      speedStep: state.speedStep,
      savedAt: Date.now(),
    };
  }

  /** Add/update the current video in the saved list. */
  function saveCurrentToList() {
    if (!state.videoId) return;
    const entry = currentSnapshot();
    loadSavedList((list) => {
      const i = list.findIndex((e) => e.videoId === entry.videoId);
      if (i >= 0) list[i] = entry;
      else list.unshift(entry);
      writeSavedList(list, renderSavedList);
    });
  }

  function removeSaved(videoId) {
    loadSavedList((list) => {
      writeSavedList(
        list.filter((e) => e.videoId !== videoId),
        renderSavedList
      );
    });
  }

  /** Apply a saved snapshot to the current (already matching) video. */
  function applySnapshot(e) {
    state.start = e.start ?? null;
    state.end = e.end ?? null;
    state.enabled = e.enabled ?? false;
    state.speedEnabled = e.speedEnabled ?? false;
    state.speedStart = e.speedStart ?? 0.65;
    state.speedTarget = e.speedTarget ?? 1;
    state.speedStep = e.speedStep ?? 0.05;
    cancelTail();
    resetSpeed();
    if (state.enabled && state.speedEnabled) applySpeed();
    saveState();
    syncInputs();
  }

  /** Load a saved entry; navigate to its video first if not already there. */
  function loadEntry(e) {
    if (e.videoId === state.videoId) {
      applySnapshot(e);
      setDrawerOpen(false);
      return;
    }
    const settings = {
      start: e.start,
      end: e.end,
      enabled: e.enabled,
      speedEnabled: e.speedEnabled,
      speedStart: e.speedStart,
      speedTarget: e.speedTarget,
      speedStep: e.speedStep,
    };
    const go = () => {
      location.href =
        "https://www.youtube.com/watch?v=" + encodeURIComponent(e.videoId);
    };
    if (chrome?.storage?.local)
      chrome.storage.local.set({ [storageKey(e.videoId)]: settings }, go);
    else go();
  }

  // ---------- Playback speed ----------

  function clampSpeed(v) {
    return Math.min(SPEED_MAX, Math.max(SPEED_MIN, v));
  }

  /** Reset the current session speed to the start speed. */
  function resetSpeed() {
    currentSpeed = clampSpeed(state.speedStart);
  }

  /** Force the speed on the video element (guarded against an event loop). */
  function applySpeed() {
    if (!video) return;
    applyingSpeed = true;
    try {
      video.playbackRate = currentSpeed;
    } catch {}
    applyingSpeed = false;
    updateStatus();
  }

  /** Step the speed toward the target by one step (stopping at the target). */
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

  /** Jump to the segment start + play from the start speed. */
  function gotoStartAndPlay() {
    if (!video) return;
    cancelTail();
    resetSpeed();
    if (state.speedEnabled) applySpeed();
    video.currentTime = state.start != null ? state.start : 0;
    video.play().catch(() => {});
    syncInputs();
  }

  /** Enforce the desired play/pause state for a few frames to beat YT's handler. */
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

  /** Space: if playing -> stop + reset speed; if stopped -> from the start. */
  function toggleLoopPlayback() {
    if (!video) return;
    cancelTail();
    if (!video.paused) {
      // Playing -> stop. Speed stays (visible in the UI), reset only on start.
      desiredPlayState = "pause";
    } else {
      // Stopped -> from the segment start, start speed.
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
    // When we pass the end -> pause (tail), then return to the start.
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
      // If the user scrubbed before the start, pull back to the start.
      video.currentTime = start;
    }
  }

  // ---------- Markers on the progress bar ----------

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
        <span class="ytloop-title"><span class="ytloop-title-icon">${LOOP_SVG}</span>Loop segment</span>
        <div class="ytloop-header-right">
          <label class="ytloop-switch">
            <input type="checkbox" id="ytloop-enable">
            <span>Enable</span>
          </label>
          <button id="ytloop-close" class="ytloop-close" title="Hide panel">✕</button>
        </div>
      </div>
      <div class="ytloop-row">
        <div class="ytloop-field">
          <label>Start</label>
          <div class="ytloop-input-group">
            <input type="text" id="ytloop-start" placeholder="0:00" autocomplete="off">
            <button id="ytloop-set-start" title="Set to current time">⏱ Now</button>
          </div>
        </div>
        <div class="ytloop-field">
          <label>End</label>
          <div class="ytloop-input-group">
            <input type="text" id="ytloop-end" placeholder="0:00" autocomplete="off">
            <button id="ytloop-set-end" title="Set to current time">⏱ Now</button>
          </div>
        </div>
      </div>
      <div class="ytloop-row">
        <div class="ytloop-field">
          <label>Gap between loops (s)</label>
          <div class="ytloop-input-group">
            <input type="text" id="ytloop-tail" placeholder="1" autocomplete="off" inputmode="decimal">
          </div>
        </div>
      </div>
      <div class="ytloop-speed">
        <label class="ytloop-switch ytloop-speed-toggle">
          <input type="checkbox" id="ytloop-speed-enable">
          <span>Gradually change speed</span>
        </label>
        <div class="ytloop-row" id="ytloop-speed-fields">
          <div class="ytloop-field">
            <label>Start speed</label>
            <input type="text" id="ytloop-speed-start" autocomplete="off" inputmode="decimal">
          </div>
          <div class="ytloop-field">
            <label>Target speed</label>
            <input type="text" id="ytloop-speed-target" autocomplete="off" inputmode="decimal">
          </div>
          <div class="ytloop-field">
            <label>Step</label>
            <input type="text" id="ytloop-speed-step" autocomplete="off" inputmode="decimal">
          </div>
        </div>
        <div class="ytloop-hint">Range 0.25–2x (same as YouTube).</div>
      </div>
      <div class="ytloop-actions">
        <button id="ytloop-goto-start" class="ytloop-secondary">⏮ To start</button>
        <button id="ytloop-clear" class="ytloop-secondary">✕ Clear</button>
      </div>
      <div class="ytloop-actions">
        <button id="ytloop-save" class="ytloop-secondary">★ Save</button>
        <button id="ytloop-open-saved" class="ytloop-secondary">☰ Saved</button>
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

  /** Whether the speed ramp has reached the target speed. */
  function isAtSpeedTarget() {
    if (!state.enabled || !state.speedEnabled) return false;
    const start = clampSpeed(state.speedStart);
    const target = clampSpeed(state.speedTarget);
    if (target === start) return false; // no ramp = no effect
    return Math.abs(currentSpeed - target) < 0.001;
  }

  function updateGlow() {
    if (!panel) return;
    panel.classList.toggle("ytloop-maxed", isAtSpeedTarget());
  }

  function updateStatus() {
    const status = panel?.querySelector("#ytloop-status");
    if (!status) return;
    if (state.enabled && state.end != null) {
      let txt = `Loop: ${fmt(state.start ?? 0)} – ${fmt(state.end)}`;
      if (state.speedEnabled) {
        txt += ` · ${currentSpeed.toFixed(2)}x`;
        if (isAtSpeedTarget()) txt += " ✓";
      }
      status.textContent = txt;
      status.className = "ytloop-status active";
    } else if (state.start != null || state.end != null) {
      status.textContent = "Loop disabled (toggle “Enable”)";
      status.className = "ytloop-status";
    } else {
      status.textContent = "Set the start and end of the segment.";
      status.className = "ytloop-status";
    }
    updateGlow();
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
    // --- Speed ---
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
      state.speedStart = !isNaN(v) ? clampSpeed(v) : 0.65;
      if (state.speedEnabled) {
        resetSpeed();
        if (state.enabled) applySpeed();
      }
      saveState();
      syncInputs();
    };
    const commitSpeedTarget = () => {
      const v = parseNum(speedTargetInput.value);
      state.speedTarget = !isNaN(v) ? clampSpeed(v) : 1;
      saveState();
      syncInputs();
    };
    const commitSpeedStep = () => {
      const v = parseNum(speedStepInput.value);
      state.speedStep = !isNaN(v) && v > 0 ? v : 0.05;
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
        e.stopPropagation(); // do not trigger YouTube shortcuts
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

    panel.querySelector("#ytloop-save").addEventListener("click", (e) => {
      saveCurrentToList();
      const b = e.currentTarget;
      const prev = b.textContent;
      b.textContent = "★ Saved!";
      setTimeout(() => (b.textContent = prev), 1200);
    });
    panel.querySelector("#ytloop-open-saved").addEventListener("click", () => {
      setDrawerOpen(true);
    });

    enableDrag(panel.querySelector("#ytloop-drag"), panel);
  }

  // ---------- Visibility and dragging ----------

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
      // Do not drag when clicking the controls in the header.
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

  // ---------- Button in the player control bar ----------

  function injectPlayerButton() {
    const controls = document.querySelector(".ytp-right-controls");
    if (!controls || document.getElementById(BTN_ID)) return;
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.className = "ytp-button ytloop-ytp-button";
    btn.title = "Loop segment (YouTube Loop)";
    btn.innerHTML = LOOP_SVG;
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

  // ---------- Mounting the panel ----------

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

  // ---------- Saved videos drawer ----------

  function mountDrawer() {
    if (!document.body || document.getElementById("ytloop-drawer")) return;

    const handle = document.createElement("button");
    handle.id = "ytloop-drawer-handle";
    handle.title = "Saved videos";
    handle.innerHTML = "<span>★ Saved</span>";
    handle.addEventListener("click", toggleDrawer);
    document.body.appendChild(handle);

    const d = document.createElement("div");
    d.id = "ytloop-drawer";
    d.innerHTML =
      '<div class="ytloop-drawer-head">' +
      "<span>★ Saved videos</span>" +
      '<button id="ytloop-drawer-close" class="ytloop-close" title="Close">✕</button>' +
      "</div>" +
      '<ul id="ytloop-drawer-list"></ul>';
    document.body.appendChild(d);
    d.querySelector("#ytloop-drawer-close").addEventListener("click", () =>
      setDrawerOpen(false)
    );
    renderSavedList();
  }

  function setDrawerOpen(open) {
    const d = document.getElementById("ytloop-drawer");
    if (!d) return;
    d.classList.toggle("open", open);
    if (open) renderSavedList();
  }

  function toggleDrawer() {
    const d = document.getElementById("ytloop-drawer");
    if (d) setDrawerOpen(!d.classList.contains("open"));
  }

  function updateSavedCount(n) {
    const b = panel && panel.querySelector("#ytloop-open-saved");
    if (b) b.textContent = `☰ Saved (${n})`;
  }

  function renderSavedList() {
    const ul = document.getElementById("ytloop-drawer-list");
    loadSavedList((list) => {
      updateSavedCount(list.length);
      if (!ul) return;
      ul.innerHTML = "";
      if (!list.length) {
        const li = document.createElement("li");
        li.className = "ytloop-empty";
        li.textContent = "No saved videos yet.";
        ul.appendChild(li);
        return;
      }
      for (const e of list) {
        const li = document.createElement("li");
        li.className = "ytloop-saved-item";
        if (e.videoId === state.videoId) li.classList.add("current");
        const range =
          e.start != null || e.end != null
            ? `${fmt(e.start ?? 0)} – ${fmt(e.end)}`
            : "no range";
        const spd = e.speedEnabled
          ? ` · ${Number(e.speedStart).toFixed(2)}→${Number(
              e.speedTarget
            ).toFixed(2)}x`
          : "";
        const main = document.createElement("div");
        main.className = "ytloop-saved-main";
        const title = document.createElement("div");
        title.className = "ytloop-saved-title";
        title.textContent = e.title || e.videoId;
        const sub = document.createElement("div");
        sub.className = "ytloop-saved-sub";
        sub.textContent = range + spd;
        main.appendChild(title);
        main.appendChild(sub);
        main.addEventListener("click", () => loadEntry(e));
        const del = document.createElement("button");
        del.className = "ytloop-saved-del";
        del.title = "Remove";
        del.textContent = "✕";
        del.addEventListener("click", (ev) => {
          ev.stopPropagation();
          removeSaved(e.videoId);
        });
        li.appendChild(main);
        li.appendChild(del);
        ul.appendChild(li);
      }
    });
  }

  // ---------- Initialization / SPA navigation ----------

  function attachVideo() {
    const v = getVideo();
    if (v && v !== video) {
      video = v;
      video.addEventListener("timeupdate", onTimeUpdate);
      video.addEventListener("loadedmetadata", () => updateMarkers());
      video.addEventListener("ratechange", () => {
        // When speed mode is active, restore our value after a YT reset.
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
      state.speedStart = saved?.speedStart ?? 0.65;
      state.speedTarget = saved?.speedTarget ?? 1;
      state.speedStep = saved?.speedStep ?? 0.05;
      resetSpeed();
      if (state.enabled && state.speedEnabled) applySpeed();
      syncInputs();
    });
  }

  function init() {
    if (!location.pathname.startsWith("/watch")) {
      // Remove the panel and drawer outside of a video page.
      document.getElementById(PANEL_ID)?.remove();
      document.getElementById("ytloop-markers")?.remove();
      document.getElementById("ytloop-drawer")?.remove();
      document.getElementById("ytloop-drawer-handle")?.remove();
      panel = null;
      return;
    }
    attachVideo();
    mountPanel();
    injectPlayerButton();
    mountDrawer();
    loadGlobalSettings((g) => {
      state.tail = g && typeof g.tail === "number" ? g.tail : DEFAULT_TAIL;
      syncInputs();
    });
    loadForCurrentVideo();
    renderSavedList();
  }

  // YouTube is a SPA - listen for navigation changes.
  window.addEventListener("yt-navigate-finish", () => setTimeout(init, 300));
  document.addEventListener("yt-navigate-finish", () => setTimeout(init, 300));

  // Space controls the loop (when the loop is active). We capture on window in the
  // capture phase (earliest) to beat YouTube's native shortcut.
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

  // Watch the DOM until the key elements appear (first entry).
  const observer = new MutationObserver(() => {
    if (!location.pathname.startsWith("/watch")) return;
    if (!getVideo() || !document.getElementById(PANEL_ID)) init();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Lightweight marker update loop.
  function tick() {
    if (panel && state.enabled) updateMarkers();
    requestAnimationFrame(() => setTimeout(tick, 500));
  }
  tick();

  init();
})();
