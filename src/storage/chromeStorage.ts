type StorageArea = chrome.storage.StorageArea;

interface MaybeExtensionGlobal {
  chrome?: { storage?: { local?: StorageArea } };
}

const area = (): StorageArea | null =>
  (globalThis as MaybeExtensionGlobal).chrome?.storage?.local ?? null;

export async function readKeys(keys: string[]): Promise<Record<string, unknown>> {
  const a = area();
  if (!a || keys.length === 0) return {};
  return new Promise((resolve) => {
    a.get(keys, (res) => {
      resolve(res);
    });
  });
}

export async function readKey<T>(key: string): Promise<T | undefined> {
  const res = await readKeys([key]);
  return res[key] as T | undefined;
}

export async function writeKeys(items: Record<string, unknown>): Promise<void> {
  const a = area();
  if (!a) return;
  return new Promise((resolve) => {
    a.set(items, () => {
      resolve();
    });
  });
}

export async function removeKeys(keys: string[]): Promise<void> {
  const a = area();
  if (!a || keys.length === 0) return;
  return new Promise((resolve) => {
    a.remove(keys, () => {
      resolve();
    });
  });
}

export async function readAll(): Promise<Record<string, unknown>> {
  const a = area();
  if (!a) return {};
  return new Promise((resolve) => {
    a.get(null, (res) => {
      resolve(res);
    });
  });
}
