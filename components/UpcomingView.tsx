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
    <section>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Upcoming</h1>

      {groups.length === 0 && (
        <div className="mx-auto max-w-2xl rounded-lg border border-dashed border-line px-6 py-16 text-center">
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
            <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {g.posts.map((p) => (
                <li key={p.id} className="min-w-0">
                  <button onClick={() => openPost(p.id)} className="tap tap-surface group block w-full text-left">
                    <PostThumb
                      post={p}
                      showBadge
                      className="aspect-[4/5] w-full rounded-lg border border-line transition-colors group-hover:border-edge"
                    />
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{p.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <StatusChip status={p.status} />
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <TypeIcon type={p.post_type} /> {TYPE_META[p.post_type].label}
                      </span>
                    </div>
                    <p className={`mt-1 text-xs font-medium ${g.tone === "overdue" ? "text-hl" : "text-ink2"}`}>
                      {p.planned_at ? format(wall(p.planned_at), "EEE d MMM · h:mm a") : "Pick a date"}
                    </p>
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
