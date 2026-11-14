"use client";

import { useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useDismiss } from "@/lib/useDismiss";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

/**
 * Drop-in for a native <select> that looks like the rest of the app: a .field trigger opening
 * a .menu of .menu-item options. Keyboard: arrows/Home/End move, Enter/Space pick, Escape closes.
 */
export default function Select<T extends string>({
  id,
  value,
  options,
  onChange,
}: {
  id?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  useDismiss(ref, open, () => setOpen(false));

  function show() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function pick(i: number) {
    onChange(options[i].value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const last = options.length - 1;
    const move = (i: number) => {
      e.preventDefault();
      if (open) setActive(i);
      else show();
    };
    if (e.key === "ArrowDown") move(Math.min(last, active + 1));
    else if (e.key === "ArrowUp") move(Math.max(0, active - 1));
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(last);
    else if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      pick(active);
    } else if (e.key === "Tab") setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className="field flex items-center gap-2.5 text-left"
      >
        {selected.icon && <span className="shrink-0 text-muted">{selected.icon}</span>}
        <span className="flex-1 truncate">{selected.label}</span>
        <ChevronDown
          size={16}
          aria-hidden
          className={`t-move shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id={listId}
        role="listbox"
        data-open={open}
        aria-hidden={!open}
        className="menu absolute inset-x-0 top-full z-20 mt-2 rounded-lg border border-line bg-card p-1.5 shadow-[var(--shadow-overlay)]"
      >
        {options.map((o, i) => (
          <div
            key={o.value}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={o.value === value}
            data-active={open && i === active}
            onPointerEnter={() => setActive(i)}
            onClick={() => pick(i)}
            className="menu-item"
          >
            {o.icon && <span className="shrink-0 text-muted">{o.icon}</span>}
            <span className="flex-1 truncate">{o.label}</span>
            {o.value === value && <Check size={16} aria-hidden className="text-hl" />}
          </div>
        ))}
      </div>
    </div>
  );
}
