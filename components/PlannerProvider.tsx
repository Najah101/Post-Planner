"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { Account, Post, PostInput } from "@/lib/types";
import {
  createAccountAction,
  deletePostAction,
  savePostAction,
  updateAccountAction,
} from "@/app/actions";
import PostDrawer from "./PostDrawer";

interface DrawerState {
  postId: string | null; // null = new post
  defaults: Partial<Post>;
}

interface Ctx {
  account: Account;
  /** Unlocked with the passcode. Guests (share link) can only work in their shared account(s). */
  isOwner: boolean;
  accounts: Account[];
  posts: Post[];
  openPost: (id: string) => void;
  newPost: (defaults?: Partial<Post>) => void;
  closeDrawer: () => void;
  /** Optimistic update for an existing post (drag & drop, quick edits). */
  patchPost: (id: string, patch: Partial<Post>) => void;
  savePost: (input: PostInput) => Promise<Post | null>;
  removePost: (id: string) => Promise<void>;
  addAccount: (name: string, emoji: string) => Promise<Account>;
  editAccount: (id: string, patch: { name?: string; emoji?: string }) => Promise<void>;
  toast: (msg: string) => void;
}

const PlannerContext = createContext<Ctx | null>(null);

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside PlannerProvider");
  return ctx;
}

export default function PlannerProvider({
  account,
  initialAccounts,
  initialPosts,
  isOwner,
  children,
}: {
  account: Account;
  initialAccounts: Account[];
  initialPosts: Post[];
  isOwner: boolean;
  children: React.ReactNode;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [posts, setPosts] = useState(initialPosts);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const toast = useCallback((msg: string) => {
    timers.current.forEach(clearTimeout);
    setLeaving(false);
    setMessage(msg);
    timers.current = [setTimeout(() => setLeaving(true), 3200), setTimeout(() => setMessage(null), 3500)];
  }, []);

  const patchPost = useCallback(
    (id: string, patch: Partial<Post>) => {
      let previous: Post | undefined;
      setPosts((ps) =>
        ps.map((p) => {
          if (p.id !== id) return p;
          previous = p;
          return { ...p, ...patch };
        }),
      );
      savePostAction({ id, account_id: account.id, ...patch }).catch(() => {
        if (previous) setPosts((ps) => ps.map((p) => (p.id === id ? previous! : p)));
        toast("Couldn’t save that change.");
      });
    },
    [account.id, toast],
  );

  const savePost = useCallback(
    async (input: PostInput) => {
      try {
        const saved = await savePostAction(input);
        setPosts((ps) =>
          ps.some((p) => p.id === saved.id) ? ps.map((p) => (p.id === saved.id ? saved : p)) : [...ps, saved],
        );
        return saved;
      } catch {
        toast("Couldn’t save the post. Try again.");
        return null;
      }
    },
    [toast],
  );

  const removePost = useCallback(
    async (id: string) => {
      try {
        await deletePostAction(id);
        setPosts((ps) => ps.filter((p) => p.id !== id));
      } catch {
        toast("Couldn’t delete the post.");
      }
    },
    [toast],
  );

  const addAccount = useCallback(async (name: string, emoji: string) => {
    const acc = await createAccountAction(name, emoji);
    setAccounts((a) => [...a, acc]);
    return acc;
  }, []);

  const editAccount = useCallback(async (id: string, patch: { name?: string; emoji?: string }) => {
    setAccounts((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setAccounts(await updateAccountAction(id, patch));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      account: accounts.find((a) => a.id === account.id) ?? account,
      isOwner,
      accounts,
      posts,
      openPost: (id) => setDrawer({ postId: id, defaults: {} }),
      newPost: (defaults = {}) => setDrawer({ postId: null, defaults }),
      closeDrawer: () => setDrawer(null),
      patchPost,
      savePost,
      removePost,
      addAccount,
      editAccount,
      toast,
    }),
    [account, isOwner, accounts, posts, patchPost, savePost, removePost, addAccount, editAccount, toast],
  );

  const editing = drawer?.postId ? posts.find((p) => p.id === drawer.postId) : undefined;

  return (
    <PlannerContext.Provider value={value}>
      {children}
      {drawer && (drawer.postId === null || editing) && (
        <PostDrawer
          key={drawer.postId ?? "new"}
          post={editing}
          defaults={drawer.defaults}
          onClose={() => setDrawer(null)}
        />
      )}
      {message && (
        <div
          role="status"
          key={message}
          data-closing={leaving}
          className="toast-in fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-edge bg-soft px-4 py-2.5 text-sm text-ink shadow-[var(--shadow-overlay)] md:bottom-6"
        >
          {message}
        </div>
      )}
    </PlannerContext.Provider>
  );
}
