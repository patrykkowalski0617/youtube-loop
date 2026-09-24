import { type Box } from "../core";

export const boxOf = (node: HTMLElement): Box => ({
  width: node.offsetWidth,
  height: node.offsetHeight,
});

export const viewportBox = (): Box => ({
  width: window.innerWidth,
  height: window.innerHeight,
});
