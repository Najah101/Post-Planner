"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, Columns3, ListTodo, Pencil, Plus } from "lucide-react";
import { useExit } from "@/lib/useExit";
import { usePlanner } from "./PlannerProvider";

const VIEWS = [
  { slug: "calendar", label: "Calendar", Icon: CalendarDays },
  { slug: "board", label: "Board", Icon: Columns3 },
  { slug: "upcoming", label: "Upcoming", Icon: ListTodo },
] as const;

export default function TopBar() {
  const { account, newPost } = usePlanner();
  const pathname = usePathname();
  const current = VIEWS.find((v) => pathname.endsWith(`/${v.slug}`))?.slug ?? "calendar";
  const index = VIEWS.findIndex((v) => v.slug === current);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <AccountSwitcher view={current} />
          <nav
            className="relative mx-auto hidden grid-cols-3 rounded-lg border border-line bg-card p-1 md:grid"
            aria-label="Views"
          >
            <span
              aria-hidden
              className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-md bg-soft transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(${index * 100}%)` }}
            />
            {VIEWS.map((v) => (
              <Link
                key={v.slug}
                href={`/${account.id}/${v.slug}`}
                aria-current={v.slug === current ? "page" : undefined}
                className={`relative z-10 flex w-28 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium no-underline transition-colors duration-200 ${
                  v.slug === current ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <v.Icon size={15} strokeWidth={2} aria-hidden />
                {v.label}
              </Link>
            ))}
          </nav>
          <button onClick={() => newPost()} className="btn btn-primary ml-auto md:ml-0">
            <Plus size={16} strokeWidth={2} aria-hidden /> New post
          </button>
        </div>
      </header>

      <nav
        aria-label="Views"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {VIEWS.map((v) => (
          <Link
            key={v.slug}
            href={`/${account.id}/${v.slug}`}
            aria-current={v.slug === current ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium no-underline transition-colors duration-200 ${
              v.slug === current ? "text-ink" : "text-muted"
            }`}
          >
            <span
              aria-hidden
              className={`absolute inset-x-6 top-0 h-0.5 rounded-full bg-accent transition-opacity duration-300 ${
                v.slug === current ? "opacity-100" : "opacity-0"
              }`}
            />
            <v.Icon size={20} strokeWidth={2} aria-hidden />
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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-soft";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-line bg-card py-1 pl-1 pr-2.5 transition-colors duration-200 hover:border-edge hover:bg-soft"
      >
        <span className="flex size-8 items-center justify-center rounded-md bg-soft text-base">{account.emoji}</span>
        <span className="max-w-[9rem] truncate text-sm font-semibold">{account.name}</span>
        <ChevronDown
          size={14}
          aria-hidden
          className={`text-muted transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        role="menu"
        data-open={open}
        aria-hidden={!open}
        className="menu absolute left-0 top-12 z-40 w-64 rounded-lg border border-line bg-card p-1.5 shadow-[var(--shadow-overlay)]"
      >
        {accounts.map((a) => (
          <button
            key={a.id}
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={() => {
              setOpen(false);
              router.push(`/${a.id}/${view}`);
            }}
            className={`${item} ${a.id === account.id ? "font-semibold" : "text-ink2"}`}
          >
            <span className="text-lg">{a.emoji}</span>
            <span className="flex-1 truncate">{a.name}</span>
            {a.id === account.id && <Check size={16} aria-hidden className="text-hl" />}
          </button>
        ))}
        <div className="my-1 border-t border-line" />
        <button
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={() => {
            setOpen(false);
            setDialog("rename");
          }}
          className={`${item} text-ink2`}
        >
          <Pencil size={16} aria-hidden className="text-muted" /> Rename this account
        </button>
        <button
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={() => {
            setOpen(false);
            setDialog("add");
          }}
          className={`${item} text-ink2`}
        >
          <Plus size={16} aria-hidden className="text-muted" /> Add account
        </button>
      </div>

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
  onClose: finish,
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
  const { closing, close } = useExit(finish);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={close} data-closing={closing} className="scrim absolute inset-0" />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setBusy(true);
          await onSubmit(name.trim(), emoji.trim() || "📸");
        }}
        data-closing={closing}
        className="sheet-in relative w-full max-w-sm rounded-lg border border-line bg-card p-6 shadow-[var(--shadow-overlay)]"
      >
        <h2 className="text-xl font-semibold tracking-tight">{mode === "add" ? "Add an account" : "Rename account"}</h2>
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
          <button type="button" onClick={close} className="btn btn-quiet">
            Cancel
          </button>
          <button disabled={busy || !name.trim()} className="btn btn-primary">
            {mode === "add" ? "Add" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
