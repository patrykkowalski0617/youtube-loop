import { collection, doc, type Firestore, getDocs, setDoc } from "firebase/firestore/lite";

import { type RemoteVideo } from "./merge";

const USERS_COLLECTION = "users";
const VIDEOS_COLLECTION = "videos";

const videosCollection = (db: Firestore, uid: string) =>
  collection(db, USERS_COLLECTION, uid, VIDEOS_COLLECTION);

export async function fetchRemoteVideos(
  db: Firestore,
  uid: string,
): Promise<Record<string, unknown>> {
  const snap = await getDocs(videosCollection(db, uid));
  return Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
}

export async function pushRemoteVideo(
  db: Firestore,
  uid: string,
  videoId: string,
  video: RemoteVideo,
): Promise<void> {
  await setDoc(doc(videosCollection(db, uid), videoId), video);
}
