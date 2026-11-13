"use client";

import { useState } from "react";
import {
  DndContext,
  pointerWithin,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { format } from "date-fns";
import { wall } from "@/lib/dates";
import { Plus } from "lucide-react";
import type { Post, Status } from "@/lib/types";
import { STATUSES, STATUS_META, TYPE_META } from "@/lib/types";
import { DROP_ANIMATION } from "@/lib/motion";
import { usePlanner } from "./PlannerProvider";
import PostThumb from "./PostThumb";
import TypeIcon from "./TypeIcon";

export default function BoardView() {
  const { posts, openPost, newPost, patchPost } = usePlanner();
  const [dragging, setDragging] = useState<Post | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const post = posts.find((p) => p.id === e.active.id);
    const over = e.over?.id;
    if (!post || typeof over !== "string" || !over.startsWith("status:")) return;
    const status = over.slice(7) as Status;
    if (status !== post.status) patchPost(post.id, { status }, `Moved to ${STATUS_META[status].label}`);
  }

  return (
    <section>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Board</h1>
      <DndContext
        id="board-dnd"
        collisionDetection={pointerWithin}
        sensors={sensors}
        onDragStart={(e) => setDragging(posts.find((p) => p.id === e.active.id) ?? null)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
          {STATUSES.map((s) => (
            <Column
              key={s}
              status={s}
              posts={posts
                .filter((p) => p.status === s)
                .sort((a, b) => (a.planned_at ?? "9").localeCompare(b.planned_at ?? "9"))}
              onOpen={openPost}
              onAdd={() => newPost({ status: s })}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={DROP_ANIMATION}>
          {dragging && (
            <div className="scale-[1.03] rounded-lg shadow-[var(--shadow-drag)] [&>article]:border-accent">
              <CardBody post={dragging} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

function Column({
  status,
  posts,
  onOpen,
  onAdd,
}: {
  status: Status;
  posts: Post[];
  onOpen: (id: string) => void;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `status:${status}` });
  const { active } = useDndContext();
  // While dragging, every other column shows it can take the card; the one under it lights up.
  const candidate = active !== null && active.data.current?.status !== status;
  const target = isOver && candidate;
  const m = STATUS_META[status];
  return (
    <div
      ref={setNodeRef}
      className={`flex w-[78vw] max-w-72 shrink-0 snap-start flex-col rounded-lg border bg-card/60 p-2.5 transition-colors md:w-auto md:max-w-none ${
        target
          ? "border-hl bg-hl/10 shadow-[inset_0_0_0_1px_var(--hl)]"
          : candidate
            ? "border-dashed border-edge"
            : "border-line"
      }`}
    >
      <div className="mb-2.5 flex items-center gap-2 px-1">
        <span className="size-2 rounded-full" style={{ background: m.color }} />
        <h2 className={`text-sm font-semibold transition-colors ${target ? "text-hl" : ""}`}>{m.label}</h2>
        <span className="text-xs text-muted">{posts.length}</span>
        <button
          onClick={onAdd}
          aria-label={`Add post to ${m.label}`}
          className="btn btn-quiet ml-auto !h-7 !px-1.5"
        >
          <Plus size={16} aria-hidden />
        </button>
      </div>
      <div className="flex min-h-24 flex-col gap-2.5">
        {posts.map((p) => (
          <DraggableCard key={p.id} post={p} onOpen={onOpen} />
        ))}
        {target ? (
          <p className="reveal rounded-lg border border-dashed border-hl bg-hl/10 px-3 py-6 text-center text-xs font-semibold text-hl">
            Move to {m.label}
          </p>
        ) : (
          posts.length === 0 && (
            <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
              Drop posts here
            </p>
          )
        )}
      </div>
    </div>
  );
}

function DraggableCard({ post, onOpen }: { post: Post; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id, data: { status: post.status } });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(post.id)}
      className={`tap tap-surface cursor-grab rounded-lg ${isDragging ? "opacity-30" : ""}`}
    >
      <CardBody post={post} />
    </div>
  );
}

function CardBody({ post }: { post: Post }) {
  const overdue = post.planned_at && post.status !== "posted" && wall(post.planned_at) < new Date();
  return (
    <article className="overflow-hidden rounded-lg border border-line bg-soft transition-colors hover:border-edge">
      <PostThumb post={post} showBadge className="aspect-[4/3] w-full" />
      <div className="p-2.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{post.title}</h3>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <TypeIcon type={post.post_type} /> {TYPE_META[post.post_type].label}
          </span>
          {post.planned_at ? (
            <span className={`ml-auto font-medium ${overdue ? "text-hl" : ""}`}>
              {format(wall(post.planned_at), "d MMM")}
            </span>
          ) : (
            <span className="ml-auto">No date</span>
          )}
        </div>
      </div>
    </article>
  );
}
