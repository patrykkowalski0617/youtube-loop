import { type Fragment } from "../core";
import { t } from "../i18n";
import { setFragmentComment } from "../player";

import { el } from "./dom";
import { shieldKeys } from "./keyShield";

const EDITING_CLASS = "is-editing";
const ENTER_KEY = "Enter";
const ESCAPE_KEY = "Escape";

let openEditors = 0;

export const isEditingNote = (): boolean => openEditors > 0;

export interface NoteEditorOptions {
  host: HTMLElement;
  fragment: Fragment;
  close: () => void;
  onRemove?: () => void;
}

export function openNoteEditor({ host, fragment, close, onRemove }: NoteEditorOptions): void {
  host.classList.add(EDITING_CLASS);
  host.innerHTML = "";
  const input = el("input", "ytloop-note-input");
  input.type = "text";
  input.value = fragment.comment;
  input.placeholder = t.fragments.notePlaceholder;

  let committed = false;
  const commit = (save: boolean): void => {
    if (committed) return;
    committed = true;
    openEditors -= 1;
    unshield();
    if (save) setFragmentComment(fragment.id, input.value);
    close();
  };

  openEditors += 1;
  const unshield = shieldKeys(input, (e) => {
    if (e.key === ENTER_KEY) commit(true);
    if (e.key === ESCAPE_KEY) commit(false);
  });
  input.addEventListener("blur", () => {
    commit(true);
  });
  input.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  host.appendChild(input);
  if (onRemove) {
    const remove = el("button", "ytloop-note-remove", t.common.close);
    remove.title = t.fragments.remove;
    remove.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      commit(false);
      onRemove();
    });
    host.appendChild(remove);
  }
  input.focus();
  input.select();
}

export const noteGestureTitle = (fragment: Fragment): string =>
  fragment.comment ? t.fragments.editNoteOnBar : t.fragments.addNoteOnBar;
