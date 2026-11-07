export const STATUSES = ["idea", "to_edit", "editing", "ready", "posted"] as const;
export type Status = (typeof STATUSES)[number];

export const POST_TYPES = ["reel", "photo", "carousel", "story"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const STATUS_META: Record<Status, { label: string; color: string }> = {
  idea: { label: "Idea", color: "#8e908e" },
  to_edit: { label: "To edit", color: "#fbde23" },
  editing: { label: "Editing", color: "#e0716b" },
  ready: { label: "Ready", color: "#e6e8e6" },
  posted: { label: "Posted", color: "#4fb477" },
};

export const TYPE_META: Record<PostType, { label: string }> = {
  reel: { label: "Reel" },
  photo: { label: "Photo" },
  carousel: { label: "Carousel" },
  story: { label: "Story" },
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
  planned_at: string | null; // ISO; UTC fields hold the wall-clock time (see lib/dates.ts)
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
