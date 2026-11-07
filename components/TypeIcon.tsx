import { Camera, Clapperboard, CircleDashed, GalleryHorizontal } from "lucide-react";
import type { PostType } from "@/lib/types";

const ICONS = {
  reel: Clapperboard,
  photo: Camera,
  carousel: GalleryHorizontal,
  story: CircleDashed,
} as const;

export default function TypeIcon({ type, size = 14, className }: { type: PostType; size?: number; className?: string }) {
  const Icon = ICONS[type];
  return <Icon size={size} strokeWidth={2} className={className} aria-hidden />;
}
