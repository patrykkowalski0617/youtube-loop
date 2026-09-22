import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
} from "firebase/auth/web-extension";
import { type Firestore, initializeFirestore } from "firebase/firestore/lite";

import { firebaseConfig, isSyncConfigured } from "./config";
import { type AccountSnapshot } from "./messages";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

function firebaseApp(): FirebaseApp | null {
  if (!isSyncConfigured) return null;
  app ??= getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

function firebaseAuth(): Auth | null {
  const a = firebaseApp();
  return a ? getAuth(a) : null;
}

export function firestore(): Firestore | null {
  const a = firebaseApp();
  if (!a) return null;
  db ??= initializeFirestore(a, { ignoreUndefinedProperties: true });
  return db;
}

const toSnapshot = (user: { uid: string } & Partial<AccountSnapshot>): AccountSnapshot => ({
  uid: user.uid,
  displayName: user.displayName ?? null,
  email: user.email ?? null,
  photoURL: user.photoURL ?? null,
});

export function observeAccount(onChange: (account: AccountSnapshot | null) => void): void {
  const auth = firebaseAuth();
  if (!auth) return;
  onAuthStateChanged(auth, (user) => {
    onChange(user ? toSnapshot(user) : null);
  });
}

export async function signInWithGoogleIdToken(idToken: string): Promise<void> {
  const auth = firebaseAuth();
  if (!auth) return;
  await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}

export async function signOutAccount(): Promise<void> {
  const auth = firebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export const currentUid = (): string | null => firebaseAuth()?.currentUser?.uid ?? null;
