"use server";

import { cookies } from "next/headers";
import { COOKIE_NAME, isValidSession } from "@/lib/auth";
import { ensureAccounts, getStore } from "@/lib/store";
import type { Account, Post, PostInput } from "@/lib/types";

async function requireSession() {
  const jar = await cookies();
  if (!(await isValidSession(jar.get(COOKIE_NAME)?.value))) throw new Error("Unauthorized");
}

export async function savePostAction(input: PostInput): Promise<Post> {
  await requireSession();
  return getStore().upsertPost(input);
}

export async function deletePostAction(id: string): Promise<void> {
  await requireSession();
  await getStore().deletePost(id);
}

export async function createAccountAction(name: string, emoji: string): Promise<Account> {
  await requireSession();
  return getStore().createAccount(name.trim() || "New account", emoji || "📸");
}

export async function updateAccountAction(
  id: string,
  patch: { name?: string; emoji?: string },
): Promise<Account[]> {
  await requireSession();
  await getStore().updateAccount(id, patch);
  return ensureAccounts();
}
