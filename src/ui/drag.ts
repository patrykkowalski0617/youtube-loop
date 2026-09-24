import { clampToBox, toPanelSpot } from "../core";
import { persistPanelPosition, setPanelSpot } from "../player";

import { boxOf, viewportBox } from "./viewport";

const HEADER_CONTROLS_SELECTOR = "input, button, label";

export function placePanel(target: HTMLElement, left: number, top: number): void {
  target.style.left = `${left}px`;
  target.style.top = `${top}px`;
  target.style.right = "auto";
  target.style.bottom = "auto";
}

export function enableDrag(handle: HTMLElement, target: HTMLElement): void {
  let dragging = false;
  let offX = 0;
  let offY = 0;
  handle.addEventListener("mousedown", (e) => {
    if (e.target instanceof Element && e.target.closest(HEADER_CONTROLS_SELECTOR)) return;
    dragging = true;
    const rect = target.getBoundingClientRect();
    offX = e.clientX - rect.left;
    offY = e.clientY - rect.top;
    target.style.right = "auto";
    target.style.bottom = "auto";
    e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const panel = boxOf(target);
    const viewport = viewportBox();
    const point = clampToBox({ left: e.clientX - offX, top: e.clientY - offY }, panel, viewport);
    placePanel(target, point.left, point.top);
    setPanelSpot(toPanelSpot(point, panel, viewport));
  });
  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    persistPanelPosition();
  });
}
