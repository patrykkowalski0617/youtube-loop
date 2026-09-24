import { suggestTags } from "../core";
import { store } from "../player";

import { el } from "./dom";
import { paintHue } from "./tagChip";

const OPTION_CLASS = "ytloop-tag-option";
const SWATCH_CLASS = "ytloop-tag-swatch";

export function renderSuggestions(
  host: HTMLElement,
  query: string,
  onPick: (name: string) => void,
): void {
  host.innerHTML = "";
  const matches = suggestTags(store.tags, query, store.settings.tags);
  host.hidden = !matches.length;
  for (const tag of matches) {
    const option = el("button", OPTION_CLASS);
    const swatch = el("span", SWATCH_CLASS);
    paintHue(swatch, tag.hue);
    option.append(swatch, el("span", undefined, tag.name));
    option.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      onPick(tag.name);
    });
    host.appendChild(option);
  }
}
