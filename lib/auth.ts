// Shared-passcode gate. Works in both the proxy (edge) and Node runtimes (Web Crypto only).
export const COOKIE_NAME = "pp_session";

/** When no passcode is configured (local dev) the gate is off. */
export const gateEnabled = () => Boolean(process.env.APP_PASSCODE);

export async function sessionToken(): Promise<string> {
  const secret = process.env.COOKIE_SECRET || process.env.APP_PASSCODE || "";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("post-planner-v1"));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidSession(value: string | undefined): Promise<boolean> {
  if (!gateEnabled()) return true;
  if (!value) return false;
  const expected = await sessionToken();
  if (value.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
