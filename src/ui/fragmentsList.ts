import { formatTime, isSameRange } from "../core";
import { t } from "../i18n";
import { loadFragment, removeFragment, store } from "../player";

import { el } from "./dom";

const CURRENT_CLASS = "current";

export function renderFragments(list: HTMLElement): void {
  list.innerHTML = "";
  const { fragments, start, end } = store.settings;
  if (!fragments.length) {
    list.appendChild(el("li", "ytloop-frag-empty", t.fragments.empty));
    return;
  }
  for (const f of fragments) {
    const li = el("li", "ytloop-frag-item");
    const label = t.fragments.range(formatTime(f.start), formatTime(f.end));
    if (start != null && end != null && isSameRange(f, start, end)) li.classList.add(CURRENT_CLASS);

    const load = el("button", "ytloop-frag-btn", label);
    load.title = t.fragments.load(label);
    load.addEventListener("click", () => {
      loadFragment(f);
    });

    const del = el("button", "ytloop-frag-del", t.common.close);
    del.title = t.fragments.remove;
    del.addEventListener("click", (ev) => {
      ev.stopPropagation();
      removeFragment(f.id);
    });

    li.append(load, del);
    list.appendChild(li);
  }
}
