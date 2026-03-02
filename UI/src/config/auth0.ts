const AUTH0_STATE_KEY = "auth0_state";
const AUTH0_CODE_VERIFIER_KEY = "auth0_code_verifier";
const AUTH0_REDIRECT_PATH = "/auth/callback";

type Auth0ScreenHint = "signup" | "login";

const getAuth0Config = () => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN as string | undefined;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string | undefined;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined;

  if (!domain || !clientId || !audience) {
    throw new Error(
      "Auth0 configuration missing. Set VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, and VITE_AUTH0_AUDIENCE.",
    );
  }

  return {
    domain,
    clientId,
    audience,
    redirectUri: `${window.location.origin}${AUTH0_REDIRECT_PATH}`,
  };
};

const toBase64Url = (arrayBuffer: ArrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const generateRandomString = (length = 64) => {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const random = new Uint8Array(length);
  crypto.getRandomValues(random);
  return Array.from(random, (value) => alphabet[value % alphabet.length]).join("");
};

const generateCodeChallenge = async (codeVerifier: string) => {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toBase64Url(digest);
};

export const startAuth0Login = async (screenHint: Auth0ScreenHint = "login") => {
  const { domain, clientId, audience, redirectUri } = getAuth0Config();

  const codeVerifier = generateRandomString(96);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32);

  sessionStorage.setItem(AUTH0_STATE_KEY, state);
  sessionStorage.setItem(AUTH0_CODE_VERIFIER_KEY, codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    audience,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    screen_hint: screenHint,
  });

  window.location.assign(`https://${domain}/authorize?${params.toString()}`);
};

export const exchangeAuth0CodeForAccessToken = async () => {
  const { domain, clientId, audience, redirectUri } = getAuth0Config();
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (error) {
    throw new Error(error);
  }

  if (!code || !state) {
    throw new Error("Invalid Auth0 callback response");
  }

  const storedState = sessionStorage.getItem(AUTH0_STATE_KEY);
  const codeVerifier = sessionStorage.getItem(AUTH0_CODE_VERIFIER_KEY);

  if (!storedState || storedState !== state || !codeVerifier) {
    throw new Error("Invalid Auth0 callback state");
  }

  sessionStorage.removeItem(AUTH0_STATE_KEY);
  sessionStorage.removeItem(AUTH0_CODE_VERIFIER_KEY);

  const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      audience,
    }),
  });

  if (!tokenResponse.ok) {
    const errorPayload = await tokenResponse.json().catch(() => null);
    throw new Error(errorPayload?.error_description || "Failed to exchange Auth0 code");
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error("Auth0 access token not found in callback response");
  }

  return {
    accessToken: tokenData.access_token as string,
  };
};
