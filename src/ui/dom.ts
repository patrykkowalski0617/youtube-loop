export const PANEL_ID = "ytloop-panel";
export const PLAYER_BUTTON_ID = "ytloop-toggle-btn";
export const DRAWER_ID = "ytloop-drawer";
export const DRAWER_HANDLE_ID = "ytloop-drawer-handle";
export const DRAWER_LIST_ID = "ytloop-drawer-list";

export const LOOP_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>' +
  "</svg>";

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function query(root: ParentNode, selector: string): HTMLElement {
  const node = root.querySelector(selector);
  if (!(node instanceof HTMLElement)) throw new Error(`Missing element: ${selector}`);
  return node;
}

export function inputById(root: ParentNode, id: string): HTMLInputElement {
  const node = query(root, `#${id}`);
  if (!(node instanceof HTMLInputElement)) throw new Error(`Not an input: ${id}`);
  return node;
}

export function byId(root: ParentNode, id: string): HTMLElement {
  return query(root, `#${id}`);
}

export function flashText(button: HTMLElement, text: string, ms: number): void {
  const prev = button.textContent;
  button.textContent = text;
  setTimeout(() => {
    button.textContent = prev;
  }, ms);
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

const ENTER_KEY = "Enter";

function blurOnEnter(input: HTMLInputElement): void {
  input.addEventListener("keydown", (e) => {
    if (e.key === ENTER_KEY) input.blur();
    e.stopPropagation();
  });
}

export function onCommit(input: HTMLInputElement, commit: () => void): void {
  input.addEventListener("change", commit);
  input.addEventListener("blur", commit);
  blurOnEnter(input);
}

export function setIfNotFocused(input: HTMLInputElement, value: string): void {
  if (document.activeElement !== input) input.value = value;
}
