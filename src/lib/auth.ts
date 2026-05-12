const LOGIN_KEY = "habbittodo_login_key";

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

export function storeLoginKey(loginKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOGIN_KEY, loginKey);
}

export function clearLoginKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOGIN_KEY);
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
