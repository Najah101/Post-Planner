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
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Post } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { dayKey, moveToDay, toWallIso, wall } from "@/lib/dates";
import { DROP_ANIMATION } from "@/lib/motion";
import { usePlanner } from "./PlannerProvider";
import PostThumb from "./PostThumb";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_PER_DAY = 3;

export default function CalendarView() {
  const { posts, openPost, newPost, patchPost } = usePlanner();
  const [month, setMonthState] = useState(() => startOfMonth(new Date()));
  const [dir, setDir] = useState(0);
  // Months slide in from the side they come from, like switching views.
  const setMonth = (next: Date) => {
    setDir(Math.sign(next.getTime() - month.getTime()));
    setMonthState(next);
  };
  const slide = { "--dir": dir } as React.CSSProperties;
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
      const k = dayKey(wall(p.planned_at));
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
    if (post.planned_at && dayKey(wall(post.planned_at)) === over.slice(4)) return;
    patchPost(post.id, { planned_at: moveToDay(post.planned_at, day) });
  }

  return (
    <section className="md:flex md:h-[calc(100dvh-7.5rem)] md:flex-col">
      <div className="mb-4 flex items-center gap-1.5 sm:gap-2">
        <div className="mr-auto min-w-0 overflow-hidden">
          <h1
            key={format(month, "yyyy-MM")}
            className={`truncate text-xl font-semibold tracking-tight sm:text-2xl ${dir ? "slide-x" : ""}`}
            style={slide}
          >
            <span className="min-[360px]:hidden">{format(month, "MMM yyyy")}</span>
            <span className="hidden min-[360px]:inline">{format(month, "MMMM yyyy")}</span>
          </h1>
        </div>
        <button onClick={() => setMonth(startOfMonth(new Date()))} className="btn btn-ghost px-3 sm:px-3.5">
          Today
        </button>
        <div className="flex overflow-hidden rounded-lg border border-line">
          <button
            aria-label="Previous month"
            onClick={() => setMonth(addMonths(month, -1))}
            className="btn btn-quiet rounded-none px-2 sm:px-2.5"
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}
            className="btn btn-quiet rounded-none border-l border-line px-2 sm:px-2.5"
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      </div>

      <DndContext id="calendar-dnd" collisionDetection={pointerWithin} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-card md:min-h-0 md:flex-1">
          <div className="grid grid-cols-7 border-b border-line bg-soft/60">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                {d}
              </div>
            ))}
          </div>
          <div
            key={format(month, "yyyy-MM")}
            style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))`, ...slide }}
            className={`${dir ? "slide-x" : ""} grid grid-cols-7 md:min-h-0 md:flex-1 [&>*]:md:min-h-0 [&>*]:md:overflow-hidden`}
          >
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
                  newPost({ planned_at: toWallIso(d) });
                }}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={DROP_ANIMATION}>
          {dragging && (
            <div className="w-40 scale-[1.03] rounded-lg border border-accent bg-soft p-1 shadow-[var(--shadow-drag)]">
              <Chip post={dragging} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {unscheduled.length > 0 && (
        <div className="mt-6 md:mt-3 md:shrink-0">
          <h2 className="mb-2 text-sm font-semibold">
            No date yet <span className="font-normal text-muted">· {unscheduled.length}</span>
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {unscheduled.map((p) => (
              <button
                key={p.id}
                onClick={() => openPost(p.id)}
                className="tap tap-surface group w-28 shrink-0 text-left"
              >
                <PostThumb
                  post={p}
                  className="aspect-[4/5] rounded-lg border border-line transition-colors group-hover:border-edge"
                />
                <p className="mt-1.5 truncate text-xs font-medium text-ink2 transition-colors group-hover:text-ink">
                  {p.title}
                </p>
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
      className={`group relative min-h-[84px] cursor-pointer border-b border-r border-line p-1 transition-[background-color,box-shadow] md:p-1.5 [&:nth-child(7n)]:border-r-0 ${
        inMonth ? "" : "bg-bg/60"
      } ${isOver ? "bg-hl/10 shadow-[inset_0_0_0_1px_var(--hl-line)]" : "hover:bg-wash"}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
            today ? "today-dot bg-accent font-semibold text-white" : inMonth ? "text-ink" : "text-faint"
          }`}
        >
          {format(day, "d")}
        </span>
        <Plus
          size={14}
          aria-hidden
          className="t-move hidden -translate-x-1 text-muted opacity-0 transition-[translate,opacity] group-hover:translate-x-0 group-hover:opacity-100 md:block"
        />
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
      className={`tap tap-surface cursor-grab rounded-lg border border-line bg-soft p-0.5 text-left hover:border-edge md:p-1 ${
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
          className="absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-soft"
          style={{ background: STATUS_META[post.status].color }}
          title={STATUS_META[post.status].label}
        />
      </div>
      <div className="hidden min-w-0 flex-1 md:block">
        <p className="truncate text-xs font-medium leading-tight">{post.title}</p>
        {post.planned_at && (
          <p className="text-[10px] leading-tight text-muted">{format(wall(post.planned_at), "h:mm a")}</p>
        )}
      </div>
    </div>
  );
}
