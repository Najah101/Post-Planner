"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  pointerWithin,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Post } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { dayKey, moveToDay } from "@/lib/dates";
import { usePlanner } from "./PlannerProvider";
import PostThumb from "./PostThumb";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_PER_DAY = 3;

export default function CalendarView() {
  const { posts, openPost, newPost, patchPost } = usePlanner();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [dragging, setDragging] = useState<Post | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(month, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      if (!p.planned_at) continue;
      const k = dayKey(new Date(p.planned_at));
      map.set(k, [...(map.get(k) ?? []), p]);
    }
    for (const list of map.values()) list.sort((a, b) => a.planned_at!.localeCompare(b.planned_at!));
    return map;
  }, [posts]);

  const unscheduled = posts.filter((p) => !p.planned_at && p.status !== "posted");

  function onDragStart(e: DragStartEvent) {
    setDragging(posts.find((p) => p.id === e.active.id) ?? null);
  }

  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const post = posts.find((p) => p.id === e.active.id);
    const over = e.over?.id;
    if (!post || typeof over !== "string" || !over.startsWith("day:")) return;
    const day = new Date(`${over.slice(4)}T12:00:00`);
    if (post.planned_at && dayKey(new Date(post.planned_at)) === over.slice(4)) return;
    patchPost(post.id, { planned_at: moveToDay(post.planned_at, day) });
  }

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="mr-auto text-2xl font-semibold tracking-tight">{format(month, "MMMM yyyy")}</h1>
        <button
          onClick={() => setMonth(startOfMonth(new Date()))}
          className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium hover:border-accent"
        >
          Today
        </button>
        <div className="flex overflow-hidden rounded-full border border-line">
          <button
            aria-label="Previous month"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="px-3.5 py-1.5 hover:bg-soft"
          >
            ‹
          </button>
          <button
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="border-l border-line px-3.5 py-1.5 hover:bg-soft"
          >
            ›
          </button>
        </div>
      </div>

      <DndContext id="calendar-dnd" collisionDetection={pointerWithin} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="grid grid-cols-7 border-b border-line bg-soft/60">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => (
              <DayCell
                key={dayKey(day)}
                day={day}
                inMonth={isSameMonth(day, month)}
                posts={byDay.get(dayKey(day)) ?? []}
                onOpen={openPost}
                onAdd={() => {
                  const d = new Date(day);
                  d.setHours(12, 0, 0, 0);
                  newPost({ planned_at: d.toISOString() });
                }}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {dragging && (
            <div className="w-40 rotate-2 rounded-lg border border-line bg-card p-1 shadow-xl">
              <Chip post={dragging} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {unscheduled.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold">
            No date yet <span className="font-normal text-muted">· {unscheduled.length}</span>
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {unscheduled.map((p) => (
              <button
                key={p.id}
                onClick={() => openPost(p.id)}
                className="w-28 shrink-0 text-left"
              >
                <PostThumb post={p} className="aspect-[4/5] rounded-xl border border-line" />
                <p className="mt-1.5 truncate text-xs font-medium">{p.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function DayCell({
  day,
  inMonth,
  posts,
  onOpen,
  onAdd,
}: {
  day: Date;
  inMonth: boolean;
  posts: Post[];
  onOpen: (id: string) => void;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${dayKey(day)}` });
  const today = isToday(day);
  const shown = posts.slice(0, MAX_PER_DAY);
  const extra = posts.length - shown.length;

  return (
    <div
      ref={setNodeRef}
      onClick={onAdd}
      className={`group relative min-h-[84px] cursor-pointer border-b border-r border-line p-1 transition-colors md:min-h-[116px] md:p-1.5 [&:nth-child(7n)]:border-r-0 ${
        inMonth ? "" : "bg-soft/50"
      } ${isOver ? "bg-accent/10" : "hover:bg-soft/60"}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
            today ? "ig-gradient font-bold text-white" : inMonth ? "text-ink" : "text-muted/60"
          }`}
        >
          {format(day, "d")}
        </span>
        <span className="hidden text-sm text-muted opacity-0 transition group-hover:opacity-100 md:block">＋</span>
      </div>
      <div className="flex flex-col gap-1">
        {shown.map((p) => (
          <DraggableChip key={p.id} post={p} onOpen={onOpen} />
        ))}
        {extra > 0 && <span className="px-1 text-[11px] font-medium text-muted">+{extra} more</span>}
      </div>
    </div>
  );
}

function DraggableChip({ post, onOpen }: { post: Post; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(post.id);
      }}
      className={`cursor-grab rounded-lg border border-line bg-card p-0.5 text-left transition hover:border-accent md:p-1 ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <Chip post={post} />
    </div>
  );
}

function Chip({ post }: { post: Post }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative shrink-0">
        <PostThumb post={post} className="size-6 rounded-md text-[11px] md:size-7" />
        <span
          className="absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-card"
          style={{ background: STATUS_META[post.status].color }}
          title={STATUS_META[post.status].label}
        />
      </div>
      <div className="hidden min-w-0 flex-1 md:block">
        <p className="truncate text-xs font-medium leading-tight">{post.title}</p>
        {post.planned_at && (
          <p className="text-[10px] leading-tight text-muted">{format(new Date(post.planned_at), "h:mm a")}</p>
        )}
      </div>
    </div>
  );
}
