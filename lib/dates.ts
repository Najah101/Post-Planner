import { format } from "date-fns";

/** ISO (UTC) -> value for <input type="datetime-local"> in the viewer's timezone. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

/** <input type="datetime-local"> value -> ISO (UTC). */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Move an ISO timestamp onto another calendar day, keeping the time of day. */
export function moveToDay(iso: string | null, day: Date): string {
  const base = iso ? new Date(iso) : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12, 0);
  const d = new Date(day);
  d.setHours(base.getHours(), base.getMinutes(), 0, 0);
  return d.toISOString();
}

export const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
