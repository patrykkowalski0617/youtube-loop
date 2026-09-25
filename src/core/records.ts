export function withoutKeys<T>(map: Record<string, T>, keys: Iterable<string>): Record<string, T> {
  const dropped = new Set(keys);
  return Object.fromEntries(Object.entries(map).filter(([key]) => !dropped.has(key)));
}
