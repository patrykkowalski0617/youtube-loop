import { TAG_NAME_MAX } from "../core";
import { t } from "../i18n";
import { addTag, removeTag, store } from "../player";

import { byId, inputById } from "./dom";
import { shieldKeys } from "./keyShield";
import { ids } from "./panelTemplate";
import { removableTagChip, tagLabel } from "./tagChip";
import { renameField } from "./tagRename";
import { renderSuggestions } from "./tagSuggest";

const OPEN_CLASS = "is-open";
const ENTER_KEY = "Enter";
const ESCAPE_KEY = "Escape";

let unshield: (() => void) | null = null;

const field = (panel: HTMLElement): HTMLInputElement => inputById(panel, ids.tagInput);

function showSuggestions(panel: HTMLElement): void {
  const input = field(panel);
  renderSuggestions(byId(panel, ids.tagOptions), input.value, (name) => {
    input.value = "";
    void addTag(name);
    showSuggestions(panel);
  });
}

function setEditorOpen(panel: HTMLElement, open: boolean): void {
  byId(panel, ids.tagEditor).classList.toggle(OPEN_CLASS, open);
  byId(panel, ids.tagOptions).hidden = !open;
  if (!open) return;
  field(panel).focus();
  showSuggestions(panel);
}

function commitTag(panel: HTMLElement): void {
  const input = field(panel);
  const name = input.value;
  input.value = "";
  void addTag(name);
}

function beginRename(panel: HTMLElement, name: string, chip: HTMLElement): void {
  const label = tagLabel(chip);
  if (!label) return;
  const input = renameField(name, () => {
    renderTagRow(panel);
  });
  label.replaceWith(input);
  input.focus();
  input.select();
}

export function renderTagRow(panel: HTMLElement): void {
  const row = byId(panel, ids.tagList);
  row.innerHTML = "";
  for (const name of store.settings.tags) {
    row.appendChild(
      removableTagChip(name, {
        onRemove: (taken) => void removeTag(taken),
        onEdit: (taken, chip) => {
          beginRename(panel, taken, chip);
        },
      }),
    );
  }
}

export function wireTags(panel: HTMLElement): void {
  const input = field(panel);
  input.maxLength = TAG_NAME_MAX;
  input.placeholder = t.tags.placeholder;
  unshield?.();
  unshield = shieldKeys(input, (ev) => {
    if (ev.key === ENTER_KEY) {
      commitTag(panel);
      showSuggestions(panel);
    }
    if (ev.key === ESCAPE_KEY) {
      input.value = "";
      setEditorOpen(panel, false);
    }
  });
  input.addEventListener("input", () => {
    showSuggestions(panel);
  });
  input.addEventListener("blur", () => {
    commitTag(panel);
    setEditorOpen(panel, false);
  });
  byId(panel, ids.tagAdd).addEventListener("click", () => {
    setEditorOpen(panel, true);
  });
}

export function unwireTags(): void {
  unshield?.();
  unshield = null;
}
