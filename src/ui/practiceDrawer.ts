import { formatTime } from "../core";
import { t } from "../i18n";
import { store } from "../player";

import { renderAccount, watchAccount } from "./account";
import { renderChart } from "./chart";
import {
  ACCOUNT_ID,
  CHART_ID,
  el,
  PRACTICE_DRAWER_ID,
  PRACTICE_HANDLE_ID,
  PRACTICE_TOTAL_ID,
} from "./dom";
import { mountDrawerShell, unmountDrawerShell } from "./drawerShell";

const BODY_CLASS = "ytloop-practice-body";
const CHART_CLASS = "ytloop-chart";
const ACCOUNT_CLASS = "ytloop-account";
const TOTAL_CLASS = "ytloop-drawer-value";

const practiceTotal = (): string =>
  store.stats.seconds > 0 ? formatTime(store.stats.seconds) : t.status.noPractice;

export function renderPracticeDrawer(): void {
  const drawer = document.getElementById(PRACTICE_DRAWER_ID);
  if (!drawer) return;
  const total = document.getElementById(PRACTICE_TOTAL_ID);
  if (total) total.textContent = practiceTotal();
  const chart = document.getElementById(CHART_ID);
  if (chart) renderChart(chart);
  renderAccount(drawer);
}

function practiceBody(): HTMLElement {
  const chart = el("div", CHART_CLASS);
  chart.id = CHART_ID;
  const account = el("div", ACCOUNT_CLASS);
  account.id = ACCOUNT_ID;
  account.hidden = true;
  const body = el("div", BODY_CLASS);
  body.append(chart, account);
  return body;
}

export function mountPracticeDrawer(): void {
  const total = el("span", TOTAL_CLASS);
  total.id = PRACTICE_TOTAL_ID;
  const drawer = mountDrawerShell({
    id: PRACTICE_DRAWER_ID,
    handleId: PRACTICE_HANDLE_ID,
    handleLabel: t.practice.handle,
    heading: t.practice.heading,
    closeTitle: t.practice.close,
    headValue: total,
    onOpen: renderPracticeDrawer,
  });
  if (!drawer) return;
  drawer.appendChild(practiceBody());
  watchAccount(renderPracticeDrawer);
  renderPracticeDrawer();
}

export function unmountPracticeDrawer(): void {
  unmountDrawerShell(PRACTICE_DRAWER_ID);
}
