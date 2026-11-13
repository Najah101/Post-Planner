"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

const FORMAT = "yyyy-MM-dd'T'HH:mm";
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const PRESETS = ["16:00", "18:00"];

const pad = (n: number) => String(n).padStart(2, "0");

/** Value is a datetime-local string ("yyyy-MM-ddTHH:mm") or "". */
export default function DateTimePicker({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [value]);

  const [open, setOpen] = useState(false);
  const [month, setMonthState] = useState(() => startOfMonth(selected ?? new Date()));
  const [dir, setDir] = useState(0);
  // Months slide in from the side they come from, same as the main calendar.
  const setMonth = (next: Date) => {
    setDir(Math.sign(next.getTime() - month.getTime()));
    setMonthState(next);
  };
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(month, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  const hour = selected?.getHours() ?? 16;
  const minute = selected?.getMinutes() ?? 0;
  const pm = hour >= 12;
  const hour12 = hour % 12 || 12;

  function commit(date: Date, h = hour, m = minute) {
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    onChange(format(d, FORMAT));
  }

  function toggle() {
    if (!open) {
      setMonthState(startOfMonth(selected ?? new Date()));
      setDir(0);
    }
    setOpen((o) => !o);
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={toggle}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="field flex items-center gap-2.5 pr-9 text-left"
        >
          <CalendarDays size={16} aria-hidden className="shrink-0 text-muted" />
          {selected ? (
            <span className="truncate">
              {format(selected, "EEE d MMM")}
              <span className="text-muted"> · </span>
              {format(selected, "h:mm a")}
            </span>
          ) : (
            <span className="truncate text-faint">Pick date & time</span>
          )}
        </button>
        {selected && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear date"
            title="Clear date"
            className="copy-btn absolute right-1.5 top-1/2 -translate-y-1/2"
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </div>

      <div
        role="dialog"
        aria-label="Choose date and time"
        data-open={open}
        aria-hidden={!open}
        className="menu absolute left-0 top-full z-20 mt-2 w-[19rem] max-w-[calc(100vw-2.5rem)] rounded-lg border border-line bg-card p-3 shadow-[var(--shadow-overlay)]"
      >
        <div className="mb-2 flex items-center gap-1">
          <span className="mr-auto overflow-hidden pl-1 text-sm font-semibold">
            <span
              key={format(month, "yyyy-MM")}
              className={`block ${dir ? "slide-x" : ""}`}
              style={{ "--dir": dir } as React.CSSProperties}
            >
              {format(month, "MMMM yyyy")}
            </span>
          </span>
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            aria-label="Previous month"
            onClick={() => setMonth(addMonths(month, -1))}
            className="copy-btn"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}
            className="copy-btn"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="py-1 text-[11px] font-semibold uppercase text-muted">
              {d}
            </span>
          ))}
        </div>
        <div className="overflow-hidden">
          <div
            key={format(month, "yyyy-MM")}
            className={`grid grid-cols-7 text-center ${dir ? "slide-x" : ""}`}
            style={{ "--dir": dir } as React.CSSProperties}
          >
          {days.map((day) => {
            const on = selected ? isSameDay(day, selected) : false;
            return (
              <button
                key={day.toISOString()}
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => commit(day)}
                aria-pressed={on}
                aria-label={format(day, "EEEE d MMMM")}
                className={`tap mx-auto my-0.5 flex size-9 items-center justify-center rounded-full text-sm ${
                  on
                    ? "bg-accent font-semibold text-white"
                    : `hover:bg-wash ${isSameMonth(day, month) ? "text-ink" : "text-faint"} ${
                        isToday(day) ? "font-semibold ring-1 ring-inset ring-edge" : ""
                      }`
                }`}
              >
                {format(day, "d")}
              </button>
            );
          })}
          </div>
        </div>

        <div className="mt-3 border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <span className="label !mb-0 mr-auto">Time</span>
            <NumBox
              label="Hour"
              value={hour12}
              min={1}
              max={12}
              tabIndex={open ? 0 : -1}
              onCommit={(h) => commit(selected ?? new Date(), (h % 12) + (pm ? 12 : 0), minute)}
            />
            <span className="text-muted">:</span>
            <NumBox
              label="Minute"
              value={minute}
              min={0}
              max={59}
              padded
              tabIndex={open ? 0 : -1}
              onCommit={(m) => commit(selected ?? new Date(), hour, m)}
            />
            <div role="group" aria-label="AM or PM" className="flex overflow-hidden rounded-lg border border-line">
              {(["AM", "PM"] as const).map((p) => {
                const on = (p === "PM") === pm;
                return (
                  <button
                    key={p}
                    type="button"
                    tabIndex={open ? 0 : -1}
                    aria-pressed={on}
                    onClick={() => commit(selected ?? new Date(), (hour % 12) + (p === "PM" ? 12 : 0), minute)}
                    className={`tap px-2.5 py-1.5 text-xs font-semibold ${
                      on ? "bg-soft text-ink" : "text-muted hover:text-ink"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((t) => {
              const on = selected ? format(selected, "HH:mm") === t : false;
              return (
                <button
                  key={t}
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => {
                    const [h, m] = t.split(":").map(Number);
                    commit(selected ?? new Date(), h, m);
                  }}
                  className={`tap rounded-full border px-2.5 py-1 text-xs font-medium ${
                    on ? "border-[var(--hl-line)] bg-[var(--hl-soft)] text-hl" : "border-line text-muted hover:border-edge hover:text-ink"
                  }`}
                >
                  {format(new Date(2000, 0, 1, ...(t.split(":").map(Number) as [number, number])), "h:mm a")}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={() => {
              const now = new Date();
              commit(now, hour, minute);
              setMonth(startOfMonth(now));
            }}
            className="btn btn-quiet !h-8 !px-2.5 text-xs"
          >
            Today
          </button>
          <button type="button" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} className="btn btn-primary !h-8 !px-4 text-xs">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/** Small typed number box: edit freely, commit (clamped) on blur or Enter, arrows step. */
function NumBox({
  label,
  value,
  min,
  max,
  padded,
  tabIndex,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  padded?: boolean;
  tabIndex: number;
  onCommit: (n: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (padded ? pad(value) : String(value));

  function commitDraft() {
    if (draft === null) return;
    const n = parseInt(draft, 10);
    if (!Number.isNaN(n)) onCommit(Math.min(max, Math.max(min, n)));
    setDraft(null);
  }

  function step(delta: number) {
    const range = max - min + 1;
    onCommit(((value - min + delta + range) % range) + min);
    setDraft(null);
  }

  return (
    <input
      aria-label={label}
      inputMode="numeric"
      tabIndex={tabIndex}
      className="field !w-14 !px-0 !py-1 text-center"
      value={shown}
      onFocus={(e) => e.target.select()}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 2))}
      onBlur={commitDraft}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitDraft();
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          step(e.key === "ArrowUp" ? 1 : -1);
        }
      }}
    />
  );
}
