import { t } from "../i18n";
import {
  isSyncConfigured,
  messaging,
  SYNC_MESSAGE,
  type SyncMessage,
  type SyncState,
} from "../sync";

import { el } from "./dom";
import { ids } from "./panelTemplate";

const SIGNED_IN_CLASS = "signed-in";

let state: SyncState | null = null;

const send = async (type: SyncMessage["type"]): Promise<SyncState | null> => {
  const runtime = messaging();
  if (!isSyncConfigured || !runtime) return null;
  try {
    return await runtime.sendMessage({ type });
  } catch {
    return null;
  }
};

function accountLabel(s: SyncState): string {
  if (s.status === "signed-in") return s.account?.email ?? s.account?.displayName ?? t.account.on;
  if (s.status === "loading") return t.account.checking;
  return t.account.off;
}

export function renderAccount(panel: HTMLElement): void {
  const row = panel.querySelector<HTMLElement>(`#${ids.account}`);
  if (!row) return;
  if (!isSyncConfigured || !state || state.status === "unconfigured") {
    row.hidden = true;
    return;
  }
  row.hidden = false;
  row.innerHTML = "";
  row.classList.toggle(SIGNED_IN_CLASS, state.status === "signed-in");

  const label = el("span", "ytloop-account-label", accountLabel(state));
  label.title = state.lastError ?? accountLabel(state);
  row.appendChild(label);

  const signedIn = state.status === "signed-in";
  const button = el(
    "button",
    "ytloop-account-btn",
    signedIn ? t.account.signOut : t.account.signIn,
  );
  button.disabled = state.status === "loading";
  button.addEventListener("click", () => {
    button.disabled = true;
    void send(signedIn ? SYNC_MESSAGE.signOut : SYNC_MESSAGE.signIn).then((next) => {
      if (next) state = next;
      renderAccount(panel);
    });
  });
  row.appendChild(button);

  if (state.lastError) {
    const error = el("span", "ytloop-account-error", t.account.error);
    error.title = state.lastError;
    row.appendChild(error);
  }
}

export function watchAccount(onChange: () => void): void {
  const runtime = messaging();
  if (!isSyncConfigured || !runtime) return;
  runtime.onMessage.addListener((message: unknown) => {
    const m = message as SyncMessage | undefined;
    if (m?.type !== SYNC_MESSAGE.stateChanged) return;
    state = m.state;
    onChange();
  });
  void send(SYNC_MESSAGE.getState).then((next) => {
    if (!next) return;
    state = next;
    onChange();
  });
}
