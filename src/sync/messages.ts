export interface AccountSnapshot {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type SyncStatus = "unconfigured" | "loading" | "signed-in" | "signed-out";

export interface SyncState {
  status: SyncStatus;
  account: AccountSnapshot | null;
  lastError: string | null;
  lastSyncedAt: number | null;
}

export const SYNC_MESSAGE = {
  getState: "ytloop:sync:get-state",
  signIn: "ytloop:sync:sign-in",
  signOut: "ytloop:sync:sign-out",
  stateChanged: "ytloop:sync:state-changed",
  pulled: "ytloop:sync:pulled",
} as const;

export type SyncMessage =
  | { type: typeof SYNC_MESSAGE.getState }
  | { type: typeof SYNC_MESSAGE.signIn }
  | { type: typeof SYNC_MESSAGE.signOut }
  | { type: typeof SYNC_MESSAGE.stateChanged; state: SyncState }
  | { type: typeof SYNC_MESSAGE.pulled };

export const unconfiguredState = (): SyncState => ({
  status: "unconfigured",
  account: null,
  lastError: null,
  lastSyncedAt: null,
});
