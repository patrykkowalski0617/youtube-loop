import { persistPanelPosition, setPanelPosition } from "../player";

const HEADER_CONTROLS_SELECTOR = "input, button, label";
const MIN_VISIBLE_WIDTH = 60;
const MIN_VISIBLE_HEIGHT = 30;

function clampToViewport(x: number, y: number, width: number, height: number): [number, number] {
  return [
    Math.max(0, Math.min(width - MIN_VISIBLE_WIDTH, x)),
    Math.max(0, Math.min(height - MIN_VISIBLE_HEIGHT, y)),
  ];
}

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
    const [x, y] = clampToViewport(
      e.clientX - offX,
      e.clientY - offY,
      window.innerWidth,
      window.innerHeight,
    );
    placePanel(target, x, y);
    setPanelPosition(x, y);
  });
  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    persistPanelPosition();
  });
}
