const SHIELDED_EVENTS = ["keydown", "keyup", "keypress"] as const;

export function shieldKeys(field: HTMLElement, onKeyDown?: (e: KeyboardEvent) => void): () => void {
  const shield = (e: Event): void => {
    if (e.target !== field) return;
    e.stopImmediatePropagation();
    if (e.type === "keydown" && e instanceof KeyboardEvent) onKeyDown?.(e);
  };
  for (const type of SHIELDED_EVENTS) window.addEventListener(type, shield, true);
  return () => {
    for (const type of SHIELDED_EVENTS) window.removeEventListener(type, shield, true);
  };
}
