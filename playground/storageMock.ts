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

export function installStorageMock(): void {
  const local = {
    get(keys: string | string[], cb: (items: Items) => void): void {
      const all = read();
      const wanted = Array.isArray(keys) ? keys : [keys];
      cb(Object.fromEntries(wanted.filter((k) => k in all).map((k) => [k, all[k]])));
    },
    set(items: Items, cb?: () => void): void {
      write({ ...read(), ...items });
      cb?.();
    },
  };
  Object.assign(globalThis, { chrome: { storage: { local } } });
}
