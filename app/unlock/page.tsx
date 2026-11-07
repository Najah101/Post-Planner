"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

export default function UnlockPage() {
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
        className="sheet-in w-full max-w-sm rounded-lg border border-line bg-card p-8 text-center"
      >
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-lg bg-accent text-white">
          <CalendarDays size={22} aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Post Planner</h1>
        <p className="mt-1 text-sm text-muted">Enter the passcode to continue</p>
        <input
          type="password"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Passcode"
          className="field mt-6 text-center"
          aria-invalid={error}
        />
        {error && <p className="mt-2 text-sm text-hl">That passcode isn’t right.</p>}
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
