import "server-only";
import { cookies } from "next/headers";
import { COOKIE_NAME, GUEST_COOKIE, isValidSession, parseGuestTokens } from "./auth";
import { getStore } from "./store";
import type { Account } from "./types";

/** Owner = unlocked with the passcode (sees everything). Guest = holds share links for specific accounts. */
export type Access = { owner: true } | { owner: false; accountIds: string[] };

export async function getAccess(): Promise<Access> {
  const jar = await cookies();
  if (await isValidSession(jar.get(COOKIE_NAME)?.value)) return { owner: true };
  const tokens = parseGuestTokens(jar.get(GUEST_COOKIE)?.value);
  const store = getStore();
  const accounts = await Promise.all(tokens.map((t) => store.findAccountByShareToken(t)));
  return { owner: false, accountIds: accounts.filter((a): a is Account => !!a).map((a) => a.id) };
}

export const canAccess = (access: Access, accountId: string) =>
  access.owner || access.accountIds.includes(accountId);

export async function requireOwner() {
  if (!(await getAccess()).owner) throw new Error("Unauthorized");
}

export async function requireAccount(accountId: string) {
  if (!canAccess(await getAccess(), accountId)) throw new Error("Unauthorized");
}

/** Never send share tokens to the browser. */
export const publicAccount = ({ share_token: _t, ...a }: Account): Account => (void _t, a);
