import { t } from "../i18n";

import { renderAccount } from "./account";
import { ACCOUNT_ID, el } from "./dom";
import { languageRow } from "./languageSelect";
import { statSection } from "./statTiles";

const ACCOUNT_CLASS = "ytloop-account";
const ROWS_CLASS = "ytloop-setting-rows";

export function renderSettingsTab(body: HTMLElement): void {
  body.innerHTML = "";
  const rows = el("div", ROWS_CLASS);
  rows.append(languageRow());
  body.append(statSection(t.settings.heading, rows, t.settings.languageHint));
  const account = el("div", ACCOUNT_CLASS);
  account.id = ACCOUNT_ID;
  account.hidden = true;
  body.append(statSection(t.settings.accountHeading, account));
  renderAccount(body);
}
