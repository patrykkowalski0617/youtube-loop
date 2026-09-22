import { formatTime, type Fragment, type FragmentNode, isSameRange, nestFragments } from "../core";
import { t } from "../i18n";
import { loadFragment, removeFragment, setFragmentComment, store } from "../player";

import { el } from "./dom";

const CURRENT_CLASS = "current";
const EDITING_CLASS = "is-editing";
const ENTER_KEY = "Enter";
const ESCAPE_KEY = "Escape";

const isCurrent = (f: Fragment): boolean => {
  const { start, end } = store.settings;
  return start != null && end != null && isSameRange(f, start, end);
};

function openEditor(chip: HTMLElement, f: Fragment, list: HTMLElement): void {
  chip.classList.add(EDITING_CLASS);
  chip.innerHTML = "";
  const input = el("input", "ytloop-frag-input");
  input.type = "text";
  input.value = f.comment;
  input.placeholder = t.fragments.notePlaceholder;

  let committed = false;
  const commit = (save: boolean): void => {
    if (committed) return;
    committed = true;
    if (save) setFragmentComment(f.id, input.value);
    else renderFragments(list);
  };

  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === ENTER_KEY) commit(true);
    if (e.key === ESCAPE_KEY) commit(false);
  });
  input.addEventListener("blur", () => {
    commit(true);
  });

  chip.appendChild(input);
  input.focus();
  input.select();
}

function fragmentChip(f: Fragment, list: HTMLElement): HTMLElement {
  const chip = el("div", "ytloop-frag-item");
  if (isCurrent(f)) chip.classList.add(CURRENT_CLASS);
  const label = t.fragments.range(formatTime(f.start), formatTime(f.end));

  const load = el("button", "ytloop-frag-btn");
  load.title = t.fragments.load(label);
  if (f.comment) load.appendChild(el("span", "ytloop-frag-comment", f.comment));
  load.appendChild(el("span", "ytloop-frag-time", label));
  load.addEventListener("click", () => {
    loadFragment(f);
  });

  const note = el("button", "ytloop-frag-note", "✎");
  note.title = f.comment ? t.fragments.editNote : t.fragments.addNote;
  note.addEventListener("click", (e) => {
    e.stopPropagation();
    openEditor(chip, f, list);
  });

  const del = el("button", "ytloop-frag-del", t.common.close);
  del.title = t.fragments.remove;
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    removeFragment(f.id);
  });

  chip.append(load, note, del);
  return chip;
}

function fragmentGroup(node: FragmentNode, list: HTMLElement): HTMLElement {
  const group = el("li", "ytloop-frag-group");
  group.appendChild(fragmentChip(node.fragment, list));
  if (node.children.length) {
    const subs = el("ul", "ytloop-frag-subs");
    for (const child of node.children) subs.appendChild(fragmentGroup(child, list));
    group.appendChild(subs);
  }
  return group;
}

export function renderFragments(list: HTMLElement): void {
  list.innerHTML = "";
  const { fragments } = store.settings;
  if (!fragments.length) {
    list.appendChild(el("li", "ytloop-frag-empty", t.fragments.empty));
    return;
  }
  for (const node of nestFragments(fragments)) list.appendChild(fragmentGroup(node, list));
}
