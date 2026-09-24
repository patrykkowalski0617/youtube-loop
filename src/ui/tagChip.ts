import { findTag, type Tag } from "../core";
import { t } from "../i18n";
import { store } from "../player";

import { el } from "./dom";

const HUE_PROPERTY = "--ytloop-tag-hue";
const CHIP_CLASS = "ytloop-tag";
const LABEL_CLASS = "ytloop-tag-name";
const UNKNOWN_HUE = 0;

export const hueOf = (name: string): number => findTag(store.tags, name)?.hue ?? UNKNOWN_HUE;

export function paintHue(node: HTMLElement, hue: number): void {
  node.style.setProperty(HUE_PROPERTY, String(hue));
}

export const tagLabel = (chip: HTMLElement): HTMLElement | null =>
  chip.querySelector(`.${LABEL_CLASS}`);

export function tagChip(name: string, hue: number, extraClass?: string): HTMLElement {
  const chip = el("span", extraClass ? `${CHIP_CLASS} ${extraClass}` : CHIP_CLASS);
  paintHue(chip, hue);
  chip.appendChild(el("span", LABEL_CLASS, name));
  return chip;
}

export interface ChipActions {
  onRemove: (name: string) => void;
  onEdit: (name: string, chip: HTMLElement) => void;
}

export function removableTagChip(name: string, actions: ChipActions): HTMLElement {
  const chip = tagChip(name, hueOf(name));
  const label = tagLabel(chip);
  if (label) {
    label.title = t.tags.edit(name);
    label.addEventListener("click", () => {
      actions.onEdit(name, chip);
    });
  }
  const remove = el("button", "ytloop-tag-remove", t.common.close);
  remove.title = t.tags.remove(name);
  remove.addEventListener("click", (ev) => {
    ev.stopPropagation();
    actions.onRemove(name);
  });
  chip.appendChild(remove);
  return chip;
}

export function toggleTagChip(
  tag: Tag,
  selected: boolean,
  onToggle: (name: string) => void,
): HTMLElement {
  const chip = tagChip(tag.name, tag.hue, selected ? "is-selected" : undefined);
  chip.setAttribute("role", "button");
  chip.tabIndex = 0;
  chip.title = t.tags.filterBy(tag.name);
  chip.addEventListener("click", () => {
    onToggle(tag.name);
  });
  return chip;
}
