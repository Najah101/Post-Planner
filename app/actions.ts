"use server";

import { randomBytes } from "node:crypto";
import { publicAccount, requireAccount, requireOwner } from "@/lib/access";
import { ensureAccounts, getStore } from "@/lib/store";
import type { Account, Post, PostInput } from "@/lib/types";

/** The post must exist in an account the caller can access (stops editing other accounts' posts by id). */
async function requirePost(id: string): Promise<Post> {
  const post = await getStore().getPost(id);
  if (!post) throw new Error("Not found");
  await requireAccount(post.account_id);
  return post;
}

export async function savePostAction(input: PostInput): Promise<Post> {
  await requireAccount(input.account_id);
  if (input.id) await requirePost(input.id);
  return getStore().upsertPost(input);
}

export async function deletePostAction(id: string): Promise<void> {
  await requirePost(id);
  await getStore().deletePost(id);
}

/** Undo for a delete. Only re-creates a post whose id is free, in an account the caller can access. */
export async function restorePostAction(post: Post): Promise<Post> {
  await requireAccount(post.account_id);
  if (await getStore().getPost(post.id)) throw new Error("Post already exists");
  return getStore().restorePost(post);
}

export async function createAccountAction(name: string, emoji: string): Promise<Account> {
  await requireOwner();
  return publicAccount(await getStore().createAccount(name.trim() || "New account", emoji || "📸"));
}

export async function updateAccountAction(
  id: string,
  patch: { name?: string; emoji?: string },
): Promise<Account[]> {
  await requireOwner();
  await getStore().updateAccount(id, { name: patch.name, emoji: patch.emoji });
  return (await ensureAccounts()).map(publicAccount);
}

const newToken = () => randomBytes(24).toString("base64url");

/** Owner only: the account's share token, created on first use. */
export async function getShareTokenAction(accountId: string): Promise<string> {
  await requireOwner();
  const account = (await getStore().listAccounts()).find((a) => a.id === accountId);
  if (!account) throw new Error("Not found");
  if (account.share_token) return account.share_token;
  const token = newToken();
  await getStore().setShareToken(accountId, token);
  return token;
}

/** Owner only: replace the token so every previously shared link stops working. */
export async function resetShareTokenAction(accountId: string): Promise<string> {
  await requireOwner();
  const token = newToken();
  await getStore().setShareToken(accountId, token);
  return token;
}
