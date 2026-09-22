import { burstGeometry } from "../core";

import { el } from "./dom";

const BURST_CLASS = "ytloop-burst";
const REACH_PROPERTY = "--burst-reach";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

let known: boolean | null = null;

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches;

function removeBurst(panel: HTMLElement): void {
  panel.querySelector(`.${BURST_CLASS}`)?.remove();
}

function fireBurst(panel: HTMLElement): void {
  removeBurst(panel);
  const geometry = burstGeometry(panel.getBoundingClientRect(), {
    width: window.innerWidth,
    height: window.innerHeight,
  });
  if (!geometry) return;
  const burst = el("div", BURST_CLASS);
  burst.style.animationDuration = `${geometry.durationMs}ms`;
  burst.style.setProperty(REACH_PROPERTY, String(geometry.reach));
  panel.appendChild(burst);
  setTimeout(() => {
    burst.remove();
  }, geometry.durationMs);
}

export function updateBurst(panel: HTMLElement, atTarget: boolean): void {
  const wasAtTarget = known;
  known = atTarget;
  if (wasAtTarget === null || wasAtTarget || !atTarget) return;
  if (prefersReducedMotion()) return;
  fireBurst(panel);
}

export function resetBurst(panel: HTMLElement | null): void {
  known = null;
  if (panel) removeBurst(panel);
}
