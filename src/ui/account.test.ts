// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SYNC_MESSAGE, type SyncState, unconfiguredState } from "../sync";
import { type ChromeMock, installChromeMock, uninstallChromeMock } from "../testing/chromeMock";
import { flushAsync } from "../testing/flush";

import { renderAccount, watchAccount } from "./account";
import { byId } from "./dom";
import { ids } from "./panelTemplate";

const EMAIL = "someone@example.com";
const ERROR_TEXT = "Missing or insufficient permissions";

const signedIn = (over: Partial<SyncState> = {}): SyncState => ({
  status: "signed-in",
  account: { uid: "uid", displayName: "Someone", email: EMAIL, photoURL: null },
  lastError: null,
  lastSyncedAt: null,
  ...over,
});

const signedOut = (): SyncState => ({
  status: "signed-out",
  account: null,
  lastError: null,
  lastSyncedAt: null,
});

let mock: ChromeMock;
let panel: HTMLElement;

const row = (): HTMLElement => byId(document, ids.account);
const button = (): HTMLButtonElement | null => row().querySelector("button");
const label = (): string => row().querySelector(".ytloop-account-label")?.textContent ?? "";

async function arrive(state: SyncState): Promise<void> {
  mock.respondWith.value = state;
  watchAccount(() => {
    renderAccount(panel);
  });
  await flushAsync();
}

describe("account row", () => {
  beforeEach(() => {
    mock = installChromeMock();
    document.body.innerHTML = `<div id="panel"><div id="${ids.account}" hidden></div></div>`;
    panel = byId(document, "panel");
  });

  afterEach(uninstallChromeMock);

  it("stays hidden until the worker answers", () => {
    renderAccount(panel);
    expect(row().hidden).toBe(true);
  });

  it("stays hidden when the build has no Firebase credentials", async () => {
    await arrive(unconfiguredState());
    expect(row().hidden).toBe(true);
  });

  it("offers sign-in when signed out", async () => {
    await arrive(signedOut());
    expect(row().hidden).toBe(false);
    expect(button()?.textContent).toBe("Sign in with Google");
    expect(label()).toContain("Not signed in");
  });

  it("shows the account and offers sign-out once signed in", async () => {
    await arrive(signedIn());
    expect(button()?.textContent).toBe("Sign out");
    expect(label()).toBe(EMAIL);
    expect(row().classList.contains("signed-in")).toBe(true);
  });

  it("asks the worker to sign in, and disables the button while it waits", async () => {
    await arrive(signedOut());
    mock.respondWith.value = signedIn();
    button()?.click();
    expect(button()?.disabled).toBe(true);
    await flushAsync();
    expect(mock.sent.map((m) => m.type)).toContain(SYNC_MESSAGE.signIn);
    expect(button()?.textContent).toBe("Sign out");
  });

  it("asks the worker to sign out", async () => {
    await arrive(signedIn());
    mock.respondWith.value = signedOut();
    button()?.click();
    await flushAsync();
    expect(mock.sent.map((m) => m.type)).toContain(SYNC_MESSAGE.signOut);
    expect(button()?.textContent).toBe("Sign in with Google");
  });

  it("surfaces a sync failure with the message in the tooltip", async () => {
    await arrive(signedIn({ lastError: ERROR_TEXT }));
    const error = row().querySelector<HTMLElement>(".ytloop-account-error");
    expect(error?.textContent).toBe("Sync error");
    expect(error?.title).toBe(ERROR_TEXT);
  });

  it("follows state the worker pushes on its own", async () => {
    await arrive(signedOut());
    mock.emit({ type: SYNC_MESSAGE.stateChanged, state: signedIn() });
    expect(button()?.textContent).toBe("Sign out");
  });

  it("ignores unrelated messages", async () => {
    await arrive(signedIn());
    mock.emit({ type: SYNC_MESSAGE.pulled });
    expect(button()?.textContent).toBe("Sign out");
  });
});
