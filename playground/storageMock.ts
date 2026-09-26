const STORAGE_KEY = "ytloop-playground:storage";

type Items = Record<string, unknown>;

const read = (): Items => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Items;
  } catch {
    return {};
  }
};

const write = (items: Items): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const readStored = read;

export const writeStored = write;

export function installStorageMock(): void {
  const local = {
    get(keys: string | string[] | null, cb: (items: Items) => void): void {
      const all = read();
      if (keys === null) {
        cb(all);
        return;
      }
      const wanted = Array.isArray(keys) ? keys : [keys];
      cb(Object.fromEntries(wanted.filter((k) => k in all).map((k) => [k, all[k]])));
    },
    set(items: Items, cb?: () => void): void {
      write({ ...read(), ...items });
      cb?.();
    },
    remove(keys: string | string[], cb?: () => void): void {
      const dropped = new Set(Array.isArray(keys) ? keys : [keys]);
      write(Object.fromEntries(Object.entries(read()).filter(([k]) => !dropped.has(k))));
      cb?.();
    },
  };
  Object.assign(globalThis, { chrome: { storage: { local } } });
}
