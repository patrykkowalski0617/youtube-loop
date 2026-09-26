import { PERCENT } from "../core";

import { el } from "./dom";

export interface BarRow {
  label: string;
  value: string;
  share: number;
  note?: string;
  accent?: boolean;
}

const LIST_CLASS = "ytloop-bar-list";
const ROW_CLASS = "ytloop-bar-row";
const LABEL_CLASS = "ytloop-bar-label";
const TRACK_CLASS = "ytloop-bar-track";
const FILL_CLASS = "ytloop-bar-fill";
const VALUE_CLASS = "ytloop-bar-value";
const NOTE_CLASS = "ytloop-bar-note";
const ACCENT_CLASS = "accent";

function barRow(row: BarRow): HTMLElement {
  const node = el("div", ROW_CLASS);
  const track = el("div", TRACK_CLASS);
  const fill = el("div", FILL_CLASS);
  fill.style.width = `${row.share * PERCENT}%`;
  if (row.accent) fill.classList.add(ACCENT_CLASS);
  track.append(fill);
  node.append(el("span", LABEL_CLASS, row.label), track, el("span", VALUE_CLASS, row.value));
  if (row.note) node.append(el("span", NOTE_CLASS, row.note));
  return node;
}

export function barList(rows: BarRow[]): HTMLElement {
  const list = el("div", LIST_CLASS);
  for (const row of rows) list.append(barRow(row));
  return list;
}
