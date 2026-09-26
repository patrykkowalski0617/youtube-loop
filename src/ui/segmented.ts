import { el } from "./dom";

export interface Choice<T extends string | number> {
  value: T;
  label: string;
  title?: string;
}

const GROUP_CLASS = "ytloop-segmented";
const BUTTON_CLASS = "ytloop-segmented-btn";
const SELECTED_CLASS = "selected";

export function segmented<T extends string | number>(
  choices: Choice<T>[],
  current: T,
  pick: (value: T) => void,
  extraClass?: string,
): HTMLElement {
  const group = el("div", extraClass ? `${GROUP_CLASS} ${extraClass}` : GROUP_CLASS);
  for (const choice of choices) {
    const button = el("button", BUTTON_CLASS, choice.label);
    if (choice.title) button.title = choice.title;
    if (choice.value === current) button.classList.add(SELECTED_CLASS);
    button.addEventListener("click", () => {
      pick(choice.value);
    });
    group.append(button);
  }
  return group;
}
