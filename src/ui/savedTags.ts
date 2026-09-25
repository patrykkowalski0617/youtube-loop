import { TAG_NAME_MAX } from "../core";
import { t } from "../i18n";
import { addTagTo, removeTagFrom } from "../player";

import { el } from "./dom";
import { shieldKeys } from "./keyShield";
import { removableTagChip, tagLabel } from "./tagChip";
import { renameField } from "./tagRename";
import { renderSuggestions } from "./tagSuggest";

const ENTER_KEY = "Enter";
const ESCAPE_KEY = "Escape";

function beginRename(chip: HTMLElement, name: string, done: () => void): void {
  const label = tagLabel(chip);
  if (!label) return;
  const input = renameField(name, done);
  label.replaceWith(input);
  input.focus();
  input.select();
}

function editor(videoId: string, names: string[], done: () => void): HTMLElement {
  const host = el("span", "ytloop-tag-editor");
  const input = el("input", "ytloop-tag-input");
  input.type = "text";
  input.maxLength = TAG_NAME_MAX;
  input.placeholder = t.tags.placeholder;
  const options = el("div", "ytloop-tag-options");

  let closed = false;
  const close = (commit: boolean): void => {
    if (closed) return;
    closed = true;
    unshield();
    if (commit) void addTagTo(videoId, names, input.value);
    done();
  };

  const unshield = shieldKeys(input, (ev) => {
    if (ev.key === ENTER_KEY) close(true);
    if (ev.key === ESCAPE_KEY) close(false);
  });
  const suggest = (): void => {
    renderSuggestions(options, input.value, names, (name) => {
      input.value = name;
      close(true);
    });
  };
  input.addEventListener("input", suggest);
  input.addEventListener("blur", () => {
    close(true);
  });

  host.append(input, options);
  suggest();
  return host;
}

function addChip(videoId: string, names: string[], done: () => void): HTMLElement {
  const add = el("button", "ytloop-tag ytloop-tag-add", t.tags.add);
  add.title = t.tags.addTitle;
  add.addEventListener("click", () => {
    const field = editor(videoId, names, done);
    add.replaceWith(field);
    field.querySelector("input")?.focus();
  });
  return add;
}

export function savedTagsRow(videoId: string, names: string[]): HTMLElement {
  const row = el("div", "ytloop-saved-tags");
  const refresh = (): void => {
    row.replaceWith(savedTagsRow(videoId, names));
  };
  row.addEventListener("click", (ev) => {
    ev.stopPropagation();
  });
  for (const name of names)
    row.appendChild(
      removableTagChip(name, {
        onRemove: (taken) => void removeTagFrom(videoId, names, taken),
        onEdit: (taken, chip) => {
          beginRename(chip, taken, refresh);
        },
      }),
    );
  row.appendChild(addChip(videoId, names, refresh));
  return row;
}
