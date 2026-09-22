type Runtime = typeof chrome.runtime;

interface MaybeExtensionGlobal {
  chrome?: { runtime?: Runtime };
}

export const messaging = (): Runtime | null =>
  (globalThis as MaybeExtensionGlobal).chrome?.runtime ?? null;
