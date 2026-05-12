const LOGIN_KEY = "habbittodo_login_key";
const LOGIN_NAME = "habbittodo_login_name";

export async function hashLoginKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

async function signJWT(uuid: string): Promise<string> {
  const secret = process.env.NEXT_PUBLIC_SUPABASE_JWT_SECRET;
  if (!secret) throw new Error("NEXT_PUBLIC_SUPABASE_JWT_SECRET is not set");

  const encoder = new TextEncoder();

  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: uuid,
    role: "authenticated",
    aud: "authenticated",
    iat: now,
    exp: now + 60 * 60 * 24 * 365,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const toSign = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(toSign),
  );

  const signatureB64 = base64UrlEncodeBytes(new Uint8Array(signature));

  return `${toSign}.${signatureB64}`;
}

export function getStoredLoginKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOGIN_KEY);
}

export function getStoredLoginName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOGIN_NAME);
}

export function storeLoginCreds(loginKey: string, name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOGIN_KEY, loginKey);
  localStorage.setItem(LOGIN_NAME, name);
}

export function clearLoginKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOGIN_KEY);
  localStorage.removeItem(LOGIN_NAME);
}

export async function buildSession(uuid: string) {
  const jwt = await signJWT(uuid);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 60 * 60 * 24 * 365;
  return {
    access_token: jwt,
    token_type: "bearer",
    expires_in: 60 * 60 * 24 * 365,
    expires_at: expiresAt,
    refresh_token: jwt,
    user: {
      id: uuid,
      aud: "authenticated",
      role: "authenticated",
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
}
