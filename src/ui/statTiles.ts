import { el } from "./dom";

export interface TileText {
  label: string;
  hint: string;
}

export interface Tile {
  text: TileText;
  value: string;
}

const SECTION_CLASS = "ytloop-stat-section";
const HEADING_CLASS = "ytloop-stat-heading";
const HINT_CLASS = "ytloop-stat-hint";
const GRID_CLASS = "ytloop-stat-grid";
const TILE_CLASS = "ytloop-stat-tile";
const LABEL_CLASS = "ytloop-stat-label";
const VALUE_CLASS = "ytloop-stat-value";

export function statSection(heading: string, body: HTMLElement, hint?: string): HTMLElement {
  const section = el("section", SECTION_CLASS);
  section.append(el("h4", HEADING_CLASS, heading));
  if (hint) section.append(el("p", HINT_CLASS, hint));
  section.append(body);
  return section;
}

function tileNode(tile: Tile): HTMLElement {
  const node = el("div", TILE_CLASS);
  node.append(
    el("span", LABEL_CLASS, tile.text.label),
    el("strong", VALUE_CLASS, tile.value),
    el("span", HINT_CLASS, tile.text.hint),
  );
  return node;
}

export function tileGrid(tiles: Tile[]): HTMLElement {
  const grid = el("div", GRID_CLASS);
  for (const tile of tiles) grid.append(tileNode(tile));
  return grid;
}

export const tile = (text: TileText, value: string): Tile => ({ text, value });
