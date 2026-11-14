"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, Columns3, Copy, Link2, ListTodo, Pencil, Plus, RotateCcw } from "lucide-react";
import { getShareTokenAction, resetShareTokenAction } from "@/app/actions";
import { useDismiss } from "@/lib/useDismiss";
import { useExit } from "@/lib/useExit";
import { VIEWS as VIEW_ORDER, type View } from "@/lib/views";
import Logo from "./Logo";
import { usePlanner } from "./PlannerProvider";

const META: Record<View, { label: string; Icon: typeof CalendarDays }> = {
  calendar: { label: "Calendar", Icon: CalendarDays },
  board: { label: "Board", Icon: Columns3 },
  upcoming: { label: "Upcoming", Icon: ListTodo },
};
const VIEWS = VIEW_ORDER.map((slug) => ({ slug, ...META[slug] }));

/**
 * Switch views without a server round trip: every view renders from data already in the
 * browser, so just change the URL (ViewSwitcher follows it). Modified clicks (new tab etc.)
 * fall through to the normal link.
 */
function switchView(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  if (window.location.pathname !== href) window.history.pushState(null, "", href);
}

export default function TopBar() {
  const { account, newPost } = usePlanner();
  const pathname = usePathname();
  const current = VIEWS.find((v) => pathname.endsWith(`/${v.slug}`))?.slug ?? "calendar";
  const index = VIEWS.findIndex((v) => v.slug === current);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Logo size={32} className="hidden shrink-0 md:block" />
          <AccountSwitcher view={current} />
          <nav
            className="relative mx-auto hidden grid-cols-3 rounded-lg border border-line bg-card p-1 md:grid"
            aria-label="Views"
          >
            <span
              aria-hidden
              className="t-move absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-md bg-soft transition-transform"
              style={{ transform: `translateX(${index * 100}%)` }}
            />
            {VIEWS.map((v) => (
              <Link
                key={v.slug}
                href={`/${account.id}/${v.slug}`}
                prefetch={false}
                onClick={(e) => switchView(e, `/${account.id}/${v.slug}`)}
                aria-current={v.slug === current ? "page" : undefined}
                className={`tap relative z-10 flex w-28 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium no-underline ${
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
        <span
          aria-hidden
          className="t-move absolute left-0 top-0 flex h-0.5 w-1/3 justify-center transition-transform"
          style={{ transform: `translateX(${index * 100}%)` }}
        >
          <span className="h-full w-12 rounded-full bg-accent" />
        </span>
        {VIEWS.map((v) => (
          <Link
            key={v.slug}
            href={`/${account.id}/${v.slug}`}
            prefetch={false}
            onClick={(e) => switchView(e, `/${account.id}/${v.slug}`)}
            aria-current={v.slug === current ? "page" : undefined}
            className={`tap flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium no-underline ${
              v.slug === current ? "text-ink" : "text-muted"
            }`}
          >
            <v.Icon size={20} strokeWidth={2} aria-hidden />
            {v.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

function AccountSwitcher({ view }: { view: string }) {
  const { account, accounts, isOwner, addAccount, editAccount } = usePlanner();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"add" | "rename" | "share" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useDismiss(ref, open, () => setOpen(false));

  // A guest with a single shared account has nothing to switch to.
  if (!isOwner && accounts.length <= 1) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line bg-card py-1 pl-1 pr-3">
        <span className="flex size-8 items-center justify-center rounded-md bg-soft text-base">{account.emoji}</span>
        <span className="max-w-[9rem] truncate text-sm font-semibold">{account.name}</span>
      </div>
    );
  }

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="tap tap-surface flex min-w-0 items-center gap-2 rounded-lg border border-line bg-card py-1 pl-1 pr-2.5 hover:border-edge hover:bg-soft"
      >
        <span className="flex size-8 items-center justify-center rounded-md bg-soft text-base">{account.emoji}</span>
        <span className="max-w-[9rem] truncate text-sm font-semibold">{account.name}</span>
        <ChevronDown
          size={14}
          aria-hidden
          className={`t-move shrink-0 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        role="menu"
        data-open={open}
        aria-hidden={!open}
        className="menu absolute left-0 top-12 z-40 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-card p-1.5 shadow-[var(--shadow-overlay)]"
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
            aria-current={a.id === account.id}
            className="menu-item"
          >
            <span className="text-lg">{a.emoji}</span>
            <span className="flex-1 truncate">{a.name}</span>
            {a.id === account.id && <Check size={16} aria-hidden className="text-hl" />}
          </button>
        ))}
        {isOwner && (
          <>
            <div className="my-1 border-t border-line" />
            <button
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setOpen(false);
                setDialog("share");
              }}
              className="menu-item"
            >
              <Link2 size={16} aria-hidden className="text-muted" /> Share this account
            </button>
            <button
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setOpen(false);
                setDialog("rename");
              }}
              className="menu-item"
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
              className="menu-item"
            >
              <Plus size={16} aria-hidden className="text-muted" /> Add account
            </button>
          </>
        )}
      </div>

      {dialog === "share" && (
        <ShareDialog accountId={account.id} accountName={account.name} onClose={() => setDialog(null)} />
      )}

      {(dialog === "add" || dialog === "rename") && (
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
        className="reveal relative w-full max-w-sm rounded-lg border border-line bg-card p-6 shadow-[var(--shadow-overlay)]"
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

function ShareDialog({
  accountId,
  accountName,
  onClose: finish,
}: {
  accountId: string;
  accountName: string;
  onClose: () => void;
}) {
  const { toast } = usePlanner();
  const { closing, close } = useExit(finish);
  const [token, setToken] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getShareTokenAction(accountId)
      .then(setToken)
      .catch(() => toast("Couldn’t load the share link."));
  }, [accountId, toast]);

  const link = token ? `${window.location.origin}/s/${token}` : "";

  async function reset() {
    setBusy(true);
    try {
      setToken(await resetShareTokenAction(accountId));
      toast("New link created. The old one no longer works.");
    } catch {
      toast("Couldn’t reset the link.");
    }
    setBusy(false);
    setConfirmReset(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={close} data-closing={closing} className="scrim absolute inset-0" />
      <div
        data-closing={closing}
        className="reveal relative w-full max-w-md rounded-lg border border-line bg-card p-6 shadow-[var(--shadow-overlay)]"
      >
        <h2 className="text-xl font-semibold tracking-tight">Share {accountName}</h2>
        <p className="mt-1 text-sm text-muted">
          Anyone with this link can plan and edit posts for this account only. They won’t see your other accounts.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            readOnly
            aria-label="Share link"
            className="field min-w-0 flex-1"
            value={link || "Creating link…"}
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            disabled={!link}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                toast("Link copied.");
              } catch {
                toast("Couldn’t copy. Select the link instead.");
              }
            }}
            className="btn btn-primary"
          >
            <Copy size={15} aria-hidden /> Copy
          </button>
        </div>
        <div className="mt-6 flex items-center justify-between gap-2">
          {confirmReset ? (
            <p key="warn" className="reveal text-sm text-ink2">The old link will stop working.</p>
          ) : (
            <button type="button" disabled={!link} onClick={() => setConfirmReset(true)} className="btn btn-quiet">
              <RotateCcw size={15} aria-hidden /> Reset link
            </button>
          )}
          <div key={String(confirmReset)} className={`flex gap-2 ${confirmReset ? "reveal" : ""}`}>
            {confirmReset ? (
              <>
                <button type="button" onClick={() => setConfirmReset(false)} className="btn btn-quiet">
                  Cancel
                </button>
                <button type="button" disabled={busy} onClick={reset} className="btn btn-primary">
                  Reset
                </button>
              </>
            ) : (
              <button type="button" onClick={close} className="btn btn-quiet">
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
