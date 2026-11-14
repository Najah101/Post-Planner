"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardPaste, Loader2, Plus, X } from "lucide-react";
import { uploadImage } from "@/lib/image";

const isEditable = (el: Element | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

/** First image in a paste event's clipboard data, as a File. */
function imageFromPaste(e: ClipboardEvent): File | null {
  for (const item of Array.from(e.clipboardData?.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) return item.getAsFile();
  }
  return null;
}

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
  const box = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const [busy, setBusy] = useState(false);

  async function pick(file?: File | null) {
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

  /** Paste button: read an image straight from the clipboard (the browser may ask first). */
  async function pasteFromClipboard() {
    const shortcut = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘V" : "Ctrl+V";
    if (!navigator.clipboard?.read) {
      onError(`Hover the image area and press ${shortcut} to paste.`);
      return;
    }
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await item.getType(type);
          return pick(new File([blob], `pasted.${type.split("/")[1]}`, { type }));
        }
      }
      onError("There’s no image on the clipboard.");
    } catch {
      onError(`Couldn’t read the clipboard. Hover the image area and press ${shortcut}.`);
    }
  }

  // Ctrl/⌘+V pastes into this field while the pointer is over it or focus is inside it,
  // unless the user is pasting text into some other field.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const active = document.activeElement;
      const inside = box.current?.contains(active) ?? false;
      if (!inside && (!hovered.current || isEditable(active))) return;
      const file = imageFromPaste(e);
      if (!file) return;
      e.preventDefault();
      pick(file);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  });

  const trayButton = "tap flex items-center justify-center rounded-md bg-white/90 py-1.5 text-black hover:bg-white";

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
      <div
        ref={box}
        onPointerEnter={() => (hovered.current = true)}
        onPointerLeave={() => (hovered.current = false)}
        className="group relative aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-lg"
      >
        {value ? (
          <div className="size-full rounded-lg border border-line bg-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="size-full rounded-lg object-cover" />
            <div className="hover-reveal absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 pt-8">
              <button
                type="button"
                onClick={() => input.current?.click()}
                disabled={busy}
                className={`${trayButton} flex-1 text-xs font-semibold`}
              >
                {busy ? "Uploading…" : "Replace"}
              </button>
              <button
                type="button"
                onClick={pasteFromClipboard}
                disabled={busy}
                className={`${trayButton} px-2.5`}
                aria-label={`Paste ${label} from clipboard`}
                title="Paste from clipboard"
              >
                <ClipboardPaste size={14} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={busy}
                className={`${trayButton} px-2.5`}
                aria-label={`Remove ${label}`}
                title="Remove"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy}
              className="tap tap-surface flex size-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-edge px-4 pb-10 text-center text-sm text-muted hover:border-hl hover:bg-hl/5 hover:text-ink"
            >
              {busy ? <Loader2 size={24} aria-hidden className="animate-spin" /> : <Plus size={24} aria-hidden />}
              <span className="font-medium">{busy ? "Uploading…" : "Add image"}</span>
              <span className="text-xs">{hint}</span>
            </button>
            {!busy && (
              <button
                type="button"
                onClick={pasteFromClipboard}
                className="btn btn-ghost absolute bottom-3 left-1/2 !h-8 -translate-x-1/2 !px-3 text-xs"
              >
                <ClipboardPaste size={14} aria-hidden /> Paste
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
