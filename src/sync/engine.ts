import { type SavedEntry, withoutKeys } from "../core";
import {
  loadAllVideos,
  loadSavedList,
  loadSyncMeta,
  type LocalVideoRecord,
  saveSavedList,
  saveSyncMeta,
  type SyncMeta,
  writeVideoRecord,
} from "../storage";

import { currentUid, firestore } from "./firebase";
import { deleteRemoteVideo, fetchRemoteVideos, pushRemoteVideo } from "./firestoreVideos";
import { fromRemoteVideo, mergeSavedList, pickWinner, toRemoteVideo } from "./merge";

interface SyncContext {
  uid: string;
  meta: SyncMeta;
  local: Map<string, LocalVideoRecord>;
  remote: Record<string, unknown>;
}

async function context(): Promise<SyncContext | null> {
  const db = firestore();
  const uid = currentUid();
  if (!db || !uid) return null;
  const [meta, records, remote] = await Promise.all([
    loadSyncMeta(),
    loadAllVideos(),
    fetchRemoteVideos(db, uid),
  ]);
  return { uid, meta, local: new Map(records.map((r) => [r.videoId, r])), remote };
}

export async function runFullSync(): Promise<number | null> {
  const db = firestore();
  const ctx = await context();
  if (!db || !ctx) return null;
  const now = Date.now();
  const ids = new Set([...ctx.local.keys(), ...Object.keys(ctx.remote)]);
  const pulledEntries: SavedEntry[] = [];
  const removed = new Set(ctx.meta.removed);
  const videos: Record<string, number> = withoutKeys(ctx.meta.videos, removed);

  for (const videoId of removed) await deleteRemoteVideo(db, ctx.uid, videoId);

  for (const videoId of ids) {
    if (removed.has(videoId)) continue;
    const local = ctx.local.get(videoId);
    const hasRemote = videoId in ctx.remote;
    const remote = hasRemote ? fromRemoteVideo(videoId, ctx.remote[videoId]) : null;
    const localUpdatedAt = local ? (ctx.meta.videos[videoId] ?? now) : null;
    const winner = pickWinner(localUpdatedAt, remote?.updatedAt ?? null);

    if (winner === "remote" && remote) {
      await writeVideoRecord(remote);
      if (remote.saved) pulledEntries.push(remote.saved);
      videos[videoId] = remote.updatedAt;
    } else if (local) {
      const updatedAt = localUpdatedAt ?? now;
      await pushRemoteVideo(db, ctx.uid, videoId, toRemoteVideo(local, updatedAt));
      videos[videoId] = updatedAt;
    }
  }

  if (pulledEntries.length) {
    await saveSavedList(mergeSavedList(await loadSavedList(), pulledEntries));
  }
  await saveSyncMeta({ videos, removed: [], lastSyncedAt: now });
  return now;
}

export async function pushVideos(videoIds: string[]): Promise<number | null> {
  const db = firestore();
  const uid = currentUid();
  if (!db || !uid || !videoIds.length) return null;
  const [meta, records] = await Promise.all([loadSyncMeta(), loadAllVideos()]);
  const byId = new Map(records.map((r) => [r.videoId, r]));
  const now = Date.now();
  const videos = { ...meta.videos };
  const removed = new Set(meta.removed);
  const dropped: string[] = [];
  for (const videoId of videoIds) {
    const local = byId.get(videoId);
    if (!local) {
      await deleteRemoteVideo(db, uid, videoId);
      dropped.push(videoId);
      removed.delete(videoId);
      continue;
    }
    await pushRemoteVideo(db, uid, videoId, toRemoteVideo(local, now));
    videos[videoId] = now;
  }
  await saveSyncMeta({
    videos: withoutKeys(videos, dropped),
    removed: [...removed],
    lastSyncedAt: now,
  });
  return now;
}
