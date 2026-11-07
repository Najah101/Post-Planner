import { format } from "date-fns";

/*
 * Post times are "wall-clock": 3pm means 3pm for everyone, whatever their time zone.
 * They are stored as an ISO string whose UTC fields hold the wall-clock time (15:00Z = 3pm).
 * wall() turns that into a Date whose *local* fields show the same clock time, so date-fns
 * formatting and day grouping just work.
 */
export function wall(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes());
}

/** Inverse of wall(): a Date's local clock fields -> stored ISO string. */
export function toWallIso(d: Date): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes())).toISOString();
}

/** Stored value -> value for the date/time picker ("yyyy-MM-ddTHH:mm"). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  return format(wall(iso), "yyyy-MM-dd'T'HH:mm");
}

/** Picker value -> stored value. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : toWallIso(d);
}

/** Move a stored timestamp onto another calendar day, keeping the time of day. */
export function moveToDay(iso: string | null, day: Date): string {
  const base = iso ? wall(iso) : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12, 0);
  const d = new Date(day);
  d.setHours(base.getHours(), base.getMinutes(), 0, 0);
  return toWallIso(d);
}

export const dayKey = (d: Date) => format(d, "yyyy-MM-dd");
