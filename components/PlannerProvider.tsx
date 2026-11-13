"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import type { Account, Post, PostInput } from "@/lib/types";
import {
  createAccountAction,
  deletePostAction,
  restorePostAction,
  savePostAction,
  updateAccountAction,
} from "@/app/actions";
import { DUR_EXIT } from "@/lib/motion";
import PostDrawer from "./PostDrawer";

interface DrawerState {
  postId: string | null; // null = new post
  defaults: Partial<Post>;
}

type Undo = () => void | Promise<void>;

interface Ctx {
  account: Account;
  /** Unlocked with the passcode. Guests (share link) can only work in their shared account(s). */
  isOwner: boolean;
  accounts: Account[];
  posts: Post[];
  openPost: (id: string) => void;
  newPost: (defaults?: Partial<Post>) => void;
  closeDrawer: () => void;
  /** Optimistic update for an existing post (drag & drop). Pass a message to offer Undo. */
  patchPost: (id: string, patch: Partial<Post>, undoMessage?: string) => void;
  /** Saves from the drawer. Offers Undo (revert the edit, or remove the new post). */
  savePost: (input: PostInput) => Promise<Post | null>;
  /** Deletes, then offers Undo, which puts the post back exactly as it was. */
  removePost: (id: string) => Promise<void>;
  addAccount: (name: string, emoji: string) => Promise<Account>;
  editAccount: (id: string, patch: { name?: string; emoji?: string }) => Promise<void>;
  /** Bottom-left notice. With `undo`, it shows an Undo button (and Ctrl/⌘+Z) for a few seconds. */
  toast: (msg: string, undo?: Undo) => void;
}

const PlannerContext = createContext<Ctx | null>(null);

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside PlannerProvider");
  return ctx;
}

const TOAST_MS = 3200;
const UNDO_MS = 6000;

/** The editable fields of a post, for writing a snapshot back. */
const asInput = ({ created_at: _c, updated_at: _u, ...rest }: Post): PostInput => {
  void _c;
  void _u;
  return rest;
};

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
  const [notice, setNotice] = useState<{ id: number; msg: string; undo?: Undo } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const noticeId = useRef(0);

  // Undo needs the state as it was before a change, read synchronously.
  const postsRef = useRef(posts);
  const accountsRef = useRef(accounts);
  useEffect(() => {
    postsRef.current = posts;
    accountsRef.current = accounts;
  }, [posts, accounts]);

  const dismiss = useCallback(() => {
    timers.current.forEach(clearTimeout);
    setLeaving(true);
    timers.current = [setTimeout(() => setNotice(null), DUR_EXIT)];
  }, []);

  const toast = useCallback(
    (msg: string, undo?: Undo) => {
      timers.current.forEach(clearTimeout);
      setLeaving(false);
      setNotice({ id: ++noticeId.current, msg, undo });
      const ms = undo ? UNDO_MS : TOAST_MS;
      timers.current = [setTimeout(() => setLeaving(true), ms), setTimeout(() => setNotice(null), ms + DUR_EXIT)];
    },
    [],
  );

  const upsertLocal = (saved: Post) =>
    setPosts((ps) => (ps.some((p) => p.id === saved.id) ? ps.map((p) => (p.id === saved.id ? saved : p)) : [...ps, saved]));

  const patchPost = useCallback(
    (id: string, patch: Partial<Post>, undoMessage?: string) => {
      const previous = postsRef.current.find((p) => p.id === id);
      if (!previous) return;
      const apply = (change: Partial<Post>, before: Post) => {
        setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, ...change } : p)));
        savePostAction({ id, account_id: account.id, ...change }).catch(() => {
          setPosts((ps) => ps.map((p) => (p.id === id ? before : p)));
          toast("Couldn’t save that change.");
        });
      };
      apply(patch, previous);
      if (undoMessage) {
        const back = Object.fromEntries(Object.keys(patch).map((k) => [k, previous[k as keyof Post]])) as Partial<Post>;
        toast(undoMessage, () => apply(back, { ...previous, ...patch }));
      }
    },
    [account.id, toast],
  );

  const savePost = useCallback(
    async (input: PostInput) => {
      const previous = input.id ? postsRef.current.find((p) => p.id === input.id) : undefined;
      try {
        const saved = await savePostAction(input);
        upsertLocal(saved);
        if (previous) {
          toast("Changes saved", async () => {
            try {
              upsertLocal(await savePostAction(asInput(previous)));
            } catch {
              toast("Couldn’t undo that.");
            }
          });
        } else {
          toast("Post added", async () => {
            try {
              await deletePostAction(saved.id);
              setPosts((ps) => ps.filter((p) => p.id !== saved.id));
            } catch {
              toast("Couldn’t undo that.");
            }
          });
        }
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
      const previous = postsRef.current.find((p) => p.id === id);
      try {
        await deletePostAction(id);
        setPosts((ps) => ps.filter((p) => p.id !== id));
        if (previous) {
          toast("Post deleted", async () => {
            try {
              upsertLocal(await restorePostAction(previous));
            } catch {
              toast("Couldn’t bring the post back.");
            }
          });
        }
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

  const editAccount = useCallback(
    async (id: string, patch: { name?: string; emoji?: string }) => {
      const previous = accountsRef.current.find((a) => a.id === id);
      const apply = async (p: { name?: string; emoji?: string }) => {
        setAccounts((a) => a.map((x) => (x.id === id ? { ...x, ...p } : x)));
        setAccounts(await updateAccountAction(id, p));
      };
      await apply(patch);
      if (previous) {
        toast("Account renamed", () =>
          apply({ name: previous.name, emoji: previous.emoji }).catch(() => toast("Couldn’t undo that.")),
        );
      }
    },
    [toast],
  );

  // Ctrl/⌘+Z triggers the visible Undo, unless the user is undoing typing in a field.
  useEffect(() => {
    const undo = notice?.undo;
    if (!undo || leaving) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "z" || !(e.ctrlKey || e.metaKey) || e.shiftKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault();
      dismiss();
      undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notice, leaving, dismiss]);

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
      {notice && (
        <div className="pointer-events-none fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[60] flex md:bottom-6 md:left-6 md:right-auto">
          <div
            role="status"
            key={notice.id}
            data-closing={leaving}
            className="reveal-up pointer-events-auto flex max-w-sm items-center gap-3 rounded-lg border border-edge bg-soft py-2 pl-4 pr-2 text-sm text-ink shadow-[var(--shadow-overlay)] origin-bottom-left"
          >
            <span className="py-0.5">{notice.msg}</span>
            {notice.undo && (
              <button
                type="button"
                onClick={() => {
                  dismiss();
                  notice.undo?.();
                }}
                className="btn btn-quiet !h-8 !px-2.5 !text-hl"
              >
                <Undo2 size={15} aria-hidden /> Undo
              </button>
            )}
          </div>
        </div>
      )}
    </PlannerContext.Provider>
  );
}
