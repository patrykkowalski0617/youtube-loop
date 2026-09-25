import { hasTagName, keptTagNames, withoutTagName, withTagName } from "../core";
import { t } from "../i18n";
import { store } from "../player";

import { el } from "./dom";
import { toggleTagChip } from "./tagChip";

let selected: string[] = [];

export const selectedTags = (): string[] => selected;

export function clearTagFilter(): void {
  selected = [];
}

export function renderTagFilter(row: HTMLElement, onChange: () => void): void {
  row.innerHTML = "";
  selected = keptTagNames(selected, store.tags);
  if (!store.tags.length) {
    row.appendChild(el("span", "ytloop-tag-empty", t.tags.none));
    return;
  }
  const toggle = (name: string): void => {
    selected = hasTagName(selected, name)
      ? withoutTagName(selected, name)
      : withTagName(selected, name);
    onChange();
  };
  for (const tag of store.tags) {
    const isSelected = hasTagName(selected, tag.name);
    row.appendChild(toggleTagChip(tag, isSelected, toggle));
  }
}
