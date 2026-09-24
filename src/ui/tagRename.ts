import { TAG_NAME_MAX } from "../core";
import { renameTag } from "../player";

import { el } from "./dom";
import { shieldKeys } from "./keyShield";

const ENTER_KEY = "Enter";
const ESCAPE_KEY = "Escape";
const INPUT_CLASS = "ytloop-tag-rename";

let editing: string | null = null;

export const isRenamingTag = (): boolean => editing != null;

export function renameField(name: string, done: () => void): HTMLInputElement {
  const input = el("input", INPUT_CLASS);
  input.type = "text";
  input.value = name;
  input.maxLength = TAG_NAME_MAX;
  editing = name;

  let unshield: (() => void) | null = null;
  const close = (save: boolean): void => {
    if (editing == null) return;
    editing = null;
    unshield?.();
    if (save) void renameTag(name, input.value);
    done();
  };

  unshield = shieldKeys(input, (ev) => {
    if (ev.key === ENTER_KEY) close(true);
    if (ev.key === ESCAPE_KEY) close(false);
  });
  input.addEventListener("blur", () => {
    close(true);
  });
  input.addEventListener("click", (ev) => {
    ev.stopPropagation();
  });
  return input;
}
