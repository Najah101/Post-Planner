"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePlanner } from "./PlannerProvider";

const VIEWS = [
  { slug: "calendar", label: "Calendar", icon: "🗓️" },
  { slug: "board", label: "Board", icon: "🧱" },
  { slug: "upcoming", label: "Upcoming", icon: "⏭️" },
] as const;

export default function TopBar() {
  const { account, newPost } = usePlanner();
  const pathname = usePathname();
  const current = VIEWS.find((v) => pathname.endsWith(`/${v.slug}`))?.slug ?? "calendar";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <AccountSwitcher view={current} />
          <nav className="mx-auto hidden gap-1 rounded-full bg-soft p-1 md:flex" aria-label="Views">
            {VIEWS.map((v) => (
              <Link
                key={v.slug}
                href={`/${account.id}/${v.slug}`}
                aria-current={v.slug === current ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  v.slug === current ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {v.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => newPost()}
            className="ig-gradient ml-auto flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-95 md:ml-0"
          >
            <span className="text-base leading-none">＋</span> New post
          </button>
        </div>
      </header>

      <nav
        aria-label="Views"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        {VIEWS.map((v) => (
          <Link
            key={v.slug}
            href={`/${account.id}/${v.slug}`}
            aria-current={v.slug === current ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
              v.slug === current ? "text-ink" : "text-muted"
            }`}
          >
            <span className={`text-lg ${v.slug === current ? "" : "opacity-60 grayscale"}`}>{v.icon}</span>
            {v.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

function AccountSwitcher({ view }: { view: string }) {
  const { account, accounts, addAccount, editAccount } = usePlanner();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"add" | "rename" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 transition hover:border-accent"
      >
        <span className="ig-gradient flex size-8 items-center justify-center rounded-full text-base">
          {account.emoji}
        </span>
        <span className="max-w-[9rem] truncate text-sm font-semibold">{account.name}</span>
        <span className="text-xs text-muted">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="fade-in absolute left-0 top-12 z-40 w-64 rounded-2xl border border-line bg-card p-1.5 shadow-xl"
        >
          {accounts.map((a) => (
            <button
              key={a.id}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                router.push(`/${a.id}/${view}`);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-soft ${
                a.id === account.id ? "font-semibold" : ""
              }`}
            >
              <span className="text-lg">{a.emoji}</span>
              <span className="flex-1 truncate">{a.name}</span>
              {a.id === account.id && <span className="text-accent">✓</span>}
            </button>
          ))}
          <div className="my-1 border-t border-line" />
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setDialog("rename");
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-soft"
          >
            ✏️ Rename this account
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setDialog("add");
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-soft"
          >
            ＋ Add account
          </button>
        </div>
      )}

      {dialog && (
        <AccountDialog
          mode={dialog}
          initialName={dialog === "rename" ? account.name : ""}
          initialEmoji={dialog === "rename" ? account.emoji : "📸"}
          onClose={() => setDialog(null)}
          onSubmit={async (name, emoji) => {
            if (dialog === "rename") {
              await editAccount(account.id, { name, emoji });
            } else {
              const acc = await addAccount(name, emoji);
              router.push(`/${acc.id}/${view}`);
            }
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}

function AccountDialog({
  mode,
  initialName,
  initialEmoji,
  onClose,
  onSubmit,
}: {
  mode: "add" | "rename";
  initialName: string;
  initialEmoji: string;
  onClose: () => void;
  onSubmit: (name: string, emoji: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="fade-in absolute inset-0 bg-black/40" />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setBusy(true);
          await onSubmit(name.trim(), emoji.trim() || "📸");
        }}
        className="sheet-in relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold">{mode === "add" ? "Add an account" : "Rename account"}</h2>
        <div className="mt-4 flex gap-3">
          <div className="w-20">
            <label className="label" htmlFor="acc-emoji">Icon</label>
            <input
              id="acc-emoji"
              className="field text-center text-xl"
              value={emoji}
              maxLength={4}
              onChange={(e) => setEmoji(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="acc-name">Name</label>
            <input
              id="acc-name"
              className="field"
              autoFocus
              placeholder="e.g. Dad’s Bakery"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm text-muted">
            Cancel
          </button>
          <button
            disabled={busy || !name.trim()}
            className="ig-gradient rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {mode === "add" ? "Add" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
