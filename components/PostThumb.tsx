import type { Post } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import TypeIcon from "./TypeIcon";

/** Final thumbnail -> inspo screenshot -> soft placeholder. */
export default function PostThumb({
  post,
  className = "",
  showBadge = false,
}: {
  post: Post;
  className?: string;
  showBadge?: boolean;
}) {
  const src = post.thumbnail_url || post.inspo_image_url;
  return (
    <div className={`relative overflow-hidden bg-soft ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="fade-in size-full object-cover" draggable={false} loading="lazy" />
      ) : (
        <div
          className="flex size-full items-center justify-center text-muted"
          style={{ background: `color-mix(in srgb, ${STATUS_META[post.status].color} 7%, var(--soft))` }}
        >
          <TypeIcon type={post.post_type} size={16} />
        </div>
      )}
      {showBadge && post.thumbnail_url && (
        <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 p-1 text-white">
          <TypeIcon type={post.post_type} size={12} />
        </span>
      )}
    </div>
  );
}

export function StatusChip({ status }: { status: Post["status"] }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: `color-mix(in srgb, ${m.color} 16%, transparent)`, color: m.color }}
    >
      <span className="size-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}
