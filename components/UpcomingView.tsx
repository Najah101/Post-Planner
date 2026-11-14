"use client";

import { addDays, format, isToday, isTomorrow, startOfDay } from "date-fns";
import { wall } from "@/lib/dates";
import type { Post } from "@/lib/types";
import { Plus, Sparkles } from "lucide-react";
import { STATUS_META } from "@/lib/types";
import { usePlanner } from "./PlannerProvider";
import PostThumb from "./PostThumb";

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
            <ul className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
              {g.posts.map((p) => (
                <li key={p.id} className="min-w-0">
                  <button
                    onClick={() => openPost(p.id)}
                    title={p.title}
                    className="tap tap-surface group block w-full text-left"
                  >
                    <div className="relative">
                      <PostThumb
                        post={p}
                        className="aspect-[4/5] w-full rounded-md border border-line transition-colors group-hover:border-edge"
                      />
                      <span
                        className="absolute left-1 top-1 size-2 rounded-full ring-2 ring-black/40"
                        style={{ background: STATUS_META[p.status].color }}
                        aria-label={STATUS_META[p.status].label}
                      />
                    </div>
                    <h3 className="mt-1.5 truncate text-xs font-semibold">{p.title}</h3>
                    <p
                      className={`truncate text-[11px] font-medium ${g.tone === "overdue" ? "text-hl" : "text-muted"}`}
                    >
                      {p.planned_at ? format(wall(p.planned_at), "d MMM · h:mm a") : "No date"}
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
