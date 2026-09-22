type Items = Record<string, unknown>;

export interface ChromeMock {
  store: Items;
  sent: { type: string }[];
  respondWith: { value: unknown };
  emit: (message: unknown) => void;
}

export function installChromeMock(initial: Items = {}): ChromeMock {
  const listeners = new Set<(message: unknown) => void>();
  const mock: ChromeMock = {
    store: { ...initial },
    sent: [],
    respondWith: { value: null },
    emit: (message) => {
      for (const l of listeners) l(message);
    },
  };

  const local = {
    get(keys: string | string[] | null, cb: (items: Items) => void): void {
      if (keys == null) {
        cb({ ...mock.store });
        return;
      }
      const wanted = Array.isArray(keys) ? keys : [keys];
      cb(Object.fromEntries(wanted.filter((k) => k in mock.store).map((k) => [k, mock.store[k]])));
    },
    set(items: Items, cb?: () => void): void {
      Object.assign(mock.store, items);
      cb?.();
    },
  };

  const runtime = {
    sendMessage(message: { type: string }): Promise<unknown> {
      mock.sent.push(message);
      return Promise.resolve(mock.respondWith.value);
    },
    onMessage: {
      addListener(listener: (message: unknown) => void): void {
        listeners.add(listener);
      },
    },
  };

  Object.assign(globalThis, { chrome: { storage: { local }, runtime } });
  return mock;
}

export function uninstallChromeMock(): void {
  Reflect.deleteProperty(globalThis, "chrome");
}
