"use client";

import { useState } from "react";

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
        className="fade-in w-full max-w-sm rounded-3xl border border-line bg-card p-8 text-center shadow-sm"
      >
        <div className="ig-gradient mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl text-2xl">
          🥐
        </div>
        <h1 className="text-xl font-semibold">Post Planner</h1>
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
        {error && <p className="mt-2 text-sm text-red-500">That passcode isn’t right.</p>}
        <button
          disabled={busy || !code}
          className="ig-gradient mt-4 w-full rounded-xl py-3 font-semibold text-white transition disabled:opacity-50"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}
