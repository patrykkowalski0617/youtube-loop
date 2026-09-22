import { describe, expect, it } from "vitest";

import { buildAuthUrl, idTokenFromRedirect } from "./googleAuth";

const REDIRECT_URI = "https://abcdef.chromiumapp.org/";
const NONCE = "0123456789abcdef";

describe("buildAuthUrl", () => {
  it("asks Google for an id_token that comes back to the extension", () => {
    const url = new URL(buildAuthUrl(REDIRECT_URI, NONCE));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("response_type")).toBe("id_token");
    expect(url.searchParams.get("redirect_uri")).toBe(REDIRECT_URI);
    expect(url.searchParams.get("nonce")).toBe(NONCE);
    expect(url.searchParams.get("scope")).toContain("openid");
  });
});

describe("idTokenFromRedirect", () => {
  it("reads the token out of the URL fragment", () => {
    expect(idTokenFromRedirect(`${REDIRECT_URI}#id_token=abc.def.ghi&token_type=bearer`)).toBe(
      "abc.def.ghi",
    );
  });

  it("returns null when the flow was cancelled or failed", () => {
    expect(idTokenFromRedirect(`${REDIRECT_URI}#error=access_denied`)).toBeNull();
    expect(idTokenFromRedirect(REDIRECT_URI)).toBeNull();
  });
});
