"use client";

import { addDays, format, isToday, isTomorrow, startOfDay } from "date-fns";
import { wall } from "@/lib/dates";
import type { Post } from "@/lib/types";
import { Plus, Sparkles } from "lucide-react";
import { TYPE_META } from "@/lib/types";
import { usePlanner } from "./PlannerProvider";
import PostThumb, { StatusChip } from "./PostThumb";
import TypeIcon from "./TypeIcon";

type Group = { label: string; posts: Post[]; tone?: "overdue" };

function groupPosts(posts: Post[]): Group[] {
  const todayStart = startOfDay(new Date());
  const weekEnd = addDays(todayStart, 7);
  const active = posts.filter((p) => p.status !== "posted");
  const dated = active
    .filter((p) => p.planned_at)
    .sort((a, b) => a.planned_at!.localeCompare(b.planned_at!));

  const overdue: Post[] = [];
  const today: Post[] = [];
  const tomorrow: Post[] = [];
  const week: Post[] = [];
  const later: Post[] = [];
  for (const p of dated) {
    const d = wall(p.planned_at!);
    if (d < todayStart) overdue.push(p);
    else if (isToday(d)) today.push(p);
    else if (isTomorrow(d)) tomorrow.push(p);
    else if (d < weekEnd) week.push(p);
    else later.push(p);
  }
  const groups: Group[] = [
    { label: "Overdue", posts: overdue, tone: "overdue" },
    { label: "Today", posts: today },
    { label: "Tomorrow", posts: tomorrow },
    { label: "This week", posts: week },
    { label: "Later", posts: later },
    { label: "No date yet", posts: active.filter((p) => !p.planned_at) },
  ];
  return groups.filter((g) => g.posts.length > 0);
}

export default function UpcomingView() {
  const { posts, openPost, newPost } = usePlanner();
  const groups = groupPosts(posts);

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Upcoming</h1>

      {groups.length === 0 && (
        <div className="rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <Sparkles size={28} aria-hidden className="mx-auto text-hl" />
          <p className="mt-3 font-semibold">Nothing planned yet</p>
          <p className="mt-1 text-sm text-muted">Add your first post to start filling the calendar.</p>
          <button onClick={() => newPost()} className="btn btn-primary mt-5">
            <Plus size={16} aria-hidden /> New post
          </button>
        </div>
      )}

      <div className="space-y-8">
        {groups.map((g) => (
          <div key={g.label}>
            <h2
              className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] ${
                g.tone === "overdue" ? "text-hl" : "text-muted"
              }`}
            >
              {g.label} · {g.posts.length}
            </h2>
            <ul className="space-y-3">
              {g.posts.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => openPost(p.id)}
                    className="tap tap-surface flex w-full gap-3 rounded-lg border border-line bg-card p-3 text-left hover:border-edge hover:bg-soft sm:gap-4"
                  >
                    <PostThumb post={p} showBadge className="aspect-[4/5] w-24 shrink-0 rounded-md sm:w-28" />
                    <div className="flex min-w-0 flex-1 flex-col py-0.5">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <StatusChip status={p.status} />
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                          <TypeIcon type={p.post_type} /> {TYPE_META[p.post_type].label}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 font-semibold leading-snug">{p.title}</h3>
                      {p.caption && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.caption}</p>}
                      <p className={`mt-auto pt-2 text-sm font-medium ${g.tone === "overdue" ? "text-hl" : "text-ink2"}`}>
                        {p.planned_at
                          ? format(wall(p.planned_at), "EEE d MMM · h:mm a")
                          : "Pick a date"}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
