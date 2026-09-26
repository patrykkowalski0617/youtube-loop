import { currentLanguage, type Language, LANGUAGE_LABELS, LANGUAGES, t } from "../i18n";
import { setAppLanguage } from "../player";

import { el } from "./dom";

const FIELD_CLASS = "ytloop-setting-field";
const ROW_CLASS = "ytloop-setting-row";
const GLYPH_CLASS = "ytloop-setting-glyph";
const LABEL_CLASS = "ytloop-setting-label";
const VALUE_CLASS = "ytloop-setting-value";
const CHEVRON_CLASS = "ytloop-setting-chevron";
const MENU_CLASS = "ytloop-lang-menu";
const OPTION_CLASS = "ytloop-lang-option";
const CHECK_CLASS = "ytloop-lang-check";
const SELECTED_CLASS = "selected";
const FLIP_CLASS = "up";
const OPEN_CLASS = "open";
const VIEWPORT_PADDING_PX = 8;

interface Menu {
  field: HTMLElement;
  row: HTMLButtonElement;
  menu: HTMLElement;
}

let current: Menu | null = null;

const options = (menu: HTMLElement): HTMLButtonElement[] => [
  ...menu.querySelectorAll<HTMLButtonElement>(`.${OPTION_CLASS}`),
];

export function closeLanguageMenu(): void {
  if (!current) return;
  const { field, row, menu } = current;
  current = null;
  menu.hidden = true;
  field.classList.remove(OPEN_CLASS, FLIP_CLASS);
  row.setAttribute("aria-expanded", "false");
}

function openMenu(target: Menu): void {
  closeLanguageMenu();
  current = target;
  target.menu.hidden = false;
  target.field.classList.add(OPEN_CLASS);
  target.row.setAttribute("aria-expanded", "true");
  const box = target.menu.getBoundingClientRect();
  if (box.bottom > window.innerHeight - VIEWPORT_PADDING_PX) target.field.classList.add(FLIP_CLASS);
  const selected = options(target.menu).find((o) => o.classList.contains(SELECTED_CLASS));
  (selected ?? options(target.menu)[0])?.focus();
}

function moveFocus(menu: HTMLElement, from: EventTarget | null, step: number): void {
  const list = options(menu);
  const index = list.findIndex((option) => option === from);
  const next = list[(index + step + list.length) % list.length];
  next?.focus();
}

function optionButton(
  code: Language,
  active: boolean,
  pick: (code: Language) => void,
): HTMLElement {
  const option = el("button", OPTION_CLASS, LANGUAGE_LABELS[code]);
  option.type = "button";
  option.role = "option";
  option.setAttribute("aria-selected", String(active));
  option.lang = code;
  if (active) {
    option.classList.add(SELECTED_CLASS);
    option.append(el("span", CHECK_CLASS, t.settings.check));
  }
  option.addEventListener("click", () => {
    pick(code);
  });
  return option;
}

function buildRow(active: Language): HTMLButtonElement {
  const row = el("button", ROW_CLASS);
  row.type = "button";
  row.setAttribute("aria-haspopup", "listbox");
  row.setAttribute("aria-expanded", "false");
  row.setAttribute("aria-label", t.settings.languageLabel);
  row.title = t.settings.languageTitle;
  const value = el("span", VALUE_CLASS, LANGUAGE_LABELS[active]);
  value.lang = active;
  row.append(
    el("span", GLYPH_CLASS, t.settings.languageGlyph),
    el("span", LABEL_CLASS, t.settings.languageLabel),
    value,
    el("span", CHEVRON_CLASS, t.settings.chevron),
  );
  return row;
}

export function languageRow(): HTMLElement {
  const active = currentLanguage();
  const field = el("div", FIELD_CLASS);
  const row = buildRow(active);
  const menu = el("div", MENU_CLASS);
  menu.role = "listbox";
  menu.hidden = true;
  menu.setAttribute("aria-label", t.settings.languageMenu);
  const pick = (code: Language): void => {
    closeLanguageMenu();
    setAppLanguage(code);
  };
  for (const code of LANGUAGES) menu.append(optionButton(code, code === active, pick));
  const target: Menu = { field, row, menu };
  row.addEventListener("click", () => {
    if (current?.field === field) closeLanguageMenu();
    else openMenu(target);
  });
  row.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    openMenu(target);
  });
  menu.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Tab") {
      closeLanguageMenu();
      row.focus();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    moveFocus(menu, e.target, e.key === "ArrowDown" ? 1 : -1);
  });
  field.append(row, menu);
  return field;
}
