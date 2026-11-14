"use client";

import { use, useState } from "react";
import Logo from "@/components/Logo";

export default function UnlockPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const expired = use(searchParams).expired !== undefined;
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      window.location.href = "/";
    } else {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="reveal w-full max-w-sm rounded-lg border border-line bg-card p-8 text-center"
      >
        <Logo size={48} className="mx-auto mb-5" />
        <h1 className="text-xl font-semibold tracking-tight">Metabasis</h1>
        <p className="mt-1 text-sm text-muted">
          {expired
            ? "That share link no longer works. Ask for a new one, or enter the passcode."
            : "Enter the passcode to continue"}
        </p>
        <input
          type="password"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Passcode"
          className="field mt-6 text-center"
          aria-invalid={error}
        />
        {error && <p className="reveal mt-2 text-sm text-hl">That passcode isn’t right.</p>}
        <button
          disabled={busy || !code}
          className="btn btn-primary mt-4 !h-11 w-full"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}
