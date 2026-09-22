import {
  SAVED_LIST_KEY,
  SYNC_META_KEY,
  videoIdFromSettingsKey,
  videoIdFromStatsKey,
} from "../storage";
import {
  type AccountSnapshot,
  isSyncConfigured,
  observeAccount,
  pushVideos,
  requestGoogleIdToken,
  runFullSync,
  savedListChangedIds,
  signInWithGoogleIdToken,
  signOutAccount,
  SYNC_MESSAGE,
  type SyncMessage,
  type SyncState,
  unconfiguredState,
} from "../sync/internal";

const PUSH_DEBOUNCE_MS = 1500;

let state: SyncState = isSyncConfigured
  ? { status: "loading", account: null, lastError: null, lastSyncedAt: null }
  : unconfiguredState();

let applyingRemote = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
const pendingVideoIds = new Set<string>();

function setState(patch: Partial<SyncState>): void {
  state = { ...state, ...patch };
  chrome.runtime
    .sendMessage({ type: SYNC_MESSAGE.stateChanged, state } satisfies SyncMessage)
    .catch(() => undefined);
}

const errorText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

async function withRemoteGuard(run: () => Promise<number | null>): Promise<void> {
  applyingRemote = true;
  try {
    const syncedAt = await run();
    setState({ lastSyncedAt: syncedAt ?? state.lastSyncedAt, lastError: null });
  } catch (e) {
    console.error("[ytloop] sync failed", e);
    setState({ lastError: errorText(e) });
  } finally {
    applyingRemote = false;
  }
}

function broadcastPulled(): void {
  chrome.runtime
    .sendMessage({ type: SYNC_MESSAGE.pulled } satisfies SyncMessage)
    .catch(() => undefined);
}

function onAccountChanged(account: AccountSnapshot | null): void {
  setState({ account, status: account ? "signed-in" : "signed-out" });
  if (!account) return;
  void withRemoteGuard(runFullSync).then(broadcastPulled);
}

function flushPush(): void {
  pushTimer = null;
  const ids = [...pendingVideoIds];
  pendingVideoIds.clear();
  if (!ids.length || state.status !== "signed-in") return;
  void withRemoteGuard(() => pushVideos(ids));
}

function queuePush(videoIds: string[]): void {
  for (const id of videoIds) pendingVideoIds.add(id);
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(flushPush, PUSH_DEBOUNCE_MS);
}

function changedVideoIds(changes: Record<string, chrome.storage.StorageChange>): string[] {
  const ids: string[] = [];
  for (const [key, change] of Object.entries(changes)) {
    if (key === SYNC_META_KEY) continue;
    if (key === SAVED_LIST_KEY) {
      ids.push(...savedListChangedIds(change.oldValue, change.newValue));
      continue;
    }
    const id = videoIdFromSettingsKey(key) ?? videoIdFromStatsKey(key);
    if (id) ids.push(id);
  }
  return ids;
}

async function signIn(): Promise<void> {
  try {
    await signInWithGoogleIdToken(await requestGoogleIdToken());
  } catch (e) {
    console.error("[ytloop] sign-in failed", e);
    setState({ lastError: errorText(e) });
  }
}

function handleMessage(message: unknown, sendResponse: (response: SyncState) => void): boolean {
  const type = (message as SyncMessage | undefined)?.type;
  if (type === SYNC_MESSAGE.getState) {
    sendResponse(state);
    return false;
  }
  if (type === SYNC_MESSAGE.signIn) {
    void signIn().then(() => {
      sendResponse(state);
    });
    return true;
  }
  if (type === SYNC_MESSAGE.signOut) {
    void signOutAccount().then(() => {
      sendResponse(state);
    });
    return true;
  }
  return false;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) =>
  handleMessage(message, sendResponse),
);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || applyingRemote || state.status !== "signed-in") return;
  const ids = changedVideoIds(changes);
  if (ids.length) queuePush(ids);
});

if (isSyncConfigured) observeAccount(onAccountChanged);
