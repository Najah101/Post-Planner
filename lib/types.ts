export const STATUSES = ["idea", "to_edit", "editing", "ready", "posted"] as const;
export type Status = (typeof STATUSES)[number];

export const POST_TYPES = ["reel", "photo", "carousel", "story"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const STATUS_META: Record<Status, { label: string; color: string }> = {
  idea: { label: "Idea", color: "#a78bfa" },
  to_edit: { label: "To edit", color: "#f59e0b" },
  editing: { label: "Editing", color: "#3b82f6" },
  ready: { label: "Ready", color: "#10b981" },
  posted: { label: "Posted", color: "#9ca3af" },
};

export const TYPE_META: Record<PostType, { label: string; icon: string }> = {
  reel: { label: "Reel", icon: "🎬" },
  photo: { label: "Photo", icon: "📷" },
  carousel: { label: "Carousel", icon: "🗂️" },
  story: { label: "Story", icon: "⭕" },
};

export interface Account {
  id: string;
  name: string;
  emoji: string;
  created_at: string;
}

export interface Post {
  id: string;
  account_id: string;
  title: string;
  status: Status;
  post_type: PostType;
  planned_at: string | null; // ISO, UTC
  caption: string;
  hashtags: string;
  audio_note: string;
  edit_notes: string;
  inspo_url: string;
  inspo_image_url: string;
  thumbnail_url: string;
  created_at: string;
  updated_at: string;
}

export type PostInput = Partial<Omit<Post, "created_at" | "updated_at">> & {
  account_id: string;
};
