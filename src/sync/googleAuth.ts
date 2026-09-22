import { googleOAuthClientId } from "./config";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = "openid email profile";
const RESPONSE_TYPE = "id_token";
const NONCE_BYTES = 16;
const HEX_RADIX = 16;
const HEX_PAD = 2;
const ID_TOKEN_PARAM = "id_token";

const randomNonce = (): string =>
  [...crypto.getRandomValues(new Uint8Array(NONCE_BYTES))]
    .map((b) => b.toString(HEX_RADIX).padStart(HEX_PAD, "0"))
    .join("");

export function buildAuthUrl(redirectUri: string, nonce: string): string {
  const params = new URLSearchParams({
    client_id: googleOAuthClientId,
    response_type: RESPONSE_TYPE,
    redirect_uri: redirectUri,
    scope: SCOPES,
    nonce,
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export function idTokenFromRedirect(redirectUrl: string): string | null {
  const fragment = redirectUrl.split("#")[1];
  if (!fragment) return null;
  return new URLSearchParams(fragment).get(ID_TOKEN_PARAM);
}

export async function requestGoogleIdToken(): Promise<string> {
  const redirectUri = chrome.identity.getRedirectURL();
  const url = buildAuthUrl(redirectUri, randomNonce());
  const redirect = await chrome.identity.launchWebAuthFlow({ url, interactive: true });
  const idToken = redirect ? idTokenFromRedirect(redirect) : null;
  if (!idToken) throw new Error("Google sign-in returned no id_token");
  return idToken;
}
