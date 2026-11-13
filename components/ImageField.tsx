"use client";

import { useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { uploadImage } from "@/lib/image";

export default function ImageField({
  label,
  hint,
  value,
  onChange,
  accept = "image/*",
  onError,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  onError: (msg: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {value ? (
        <div className="group relative aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-lg border border-line bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="size-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 pt-8">
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="tap flex-1 rounded-md bg-white/90 py-1.5 text-xs font-semibold text-black hover:bg-white"
            >
              {busy ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="tap flex items-center rounded-md bg-white/90 px-2.5 py-1.5 text-black hover:bg-white"
              aria-label={`Remove ${label}`}
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="tap tap-surface flex aspect-[4/5] w-full max-w-[220px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-edge px-4 text-center text-sm text-muted hover:border-hl hover:bg-hl/5 hover:text-ink"
        >
          {busy ? <Loader2 size={24} aria-hidden className="animate-spin" /> : <Plus size={24} aria-hidden />}
          <span className="font-medium">{busy ? "Uploading…" : "Add image"}</span>
          <span className="text-xs">{hint}</span>
        </button>
      )}
    </div>
  );
}
