"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { useExit } from "@/lib/useExit";
import type { Post, PostType, Status } from "@/lib/types";
import { POST_TYPES, STATUSES, STATUS_META, TYPE_META } from "@/lib/types";
import { fromLocalInput, toLocalInput } from "@/lib/dates";
import { usePlanner } from "./PlannerProvider";
import ImageField from "./ImageField";
import DateTimePicker from "./DateTimePicker";

export default function PostDrawer({
  post,
  defaults,
  onClose: finish,
}: {
  post?: Post;
  defaults: Partial<Post>;
  onClose: () => void;
}) {
  const { account, savePost, removePost, toast } = usePlanner();
  const base = { ...defaults, ...post };

  const [title, setTitle] = useState(base.title ?? "");
  const [status, setStatus] = useState<Status>(base.status ?? "idea");
  const [postType, setPostType] = useState<PostType>(base.post_type ?? "reel");
  const [when, setWhen] = useState(toLocalInput(base.planned_at ?? null));
  const [caption, setCaption] = useState(base.caption ?? "");
  const [hashtags, setHashtags] = useState(base.hashtags ?? "");
  const [audio, setAudio] = useState(base.audio_note ?? "");
  const [notes, setNotes] = useState(base.edit_notes ?? "");
  const [inspoUrl, setInspoUrl] = useState(base.inspo_url ?? "");
  const [inspoImg, setInspoImg] = useState(base.inspo_image_url ?? "");
  const [thumb, setThumb] = useState(base.thumbnail_url ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { closing, close: onClose } = useExit(finish);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function save() {
    setSaving(true);
    const saved = await savePost({
      id: post?.id,
      account_id: account.id,
      title: title.trim() || "Untitled post",
      status,
      post_type: postType,
      planned_at: fromLocalInput(when),
      caption,
      hashtags,
      audio_note: audio,
      edit_notes: notes,
      inspo_url: inspoUrl.trim(),
      inspo_image_url: inspoImg,
      thumbnail_url: thumb,
    });
    setSaving(false);
    if (saved) onClose();
  }

  async function copyText(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(done);
    } catch {
      toast("Couldn’t copy. Select the text instead.");
    }
  }

  const link = inspoUrl.trim();
  const href = link && !/^https?:\/\//i.test(link) ? `https://${link}` : link;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Post details">
      <button
        aria-label="Close"
        onClick={onClose}
        className="scrim absolute inset-0"
        data-closing={closing}
      />
      <div
        data-closing={closing}
        className="panel relative flex h-dvh w-full flex-col bg-card shadow-[var(--shadow-overlay)] md:max-w-xl md:border-l md:border-line"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <button onClick={onClose} className="btn btn-quiet -ml-2">
            Cancel
          </button>
          <h2 className="text-sm font-semibold">{post ? "Edit post" : "New post"}</h2>
          <button
            onClick={save}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input
              id="title"
              className="field text-lg font-semibold"
              placeholder="e.g. Croissant lamination reel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus={!post}
            />
          </div>

          <div>
            <span className="label">Status</span>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const on = s === status;
                const c = STATUS_META[s].color;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    aria-pressed={on}
                    className="tap inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium hover:border-edge"
                    style={
                      on
                        ? {
                            background: `color-mix(in srgb, ${c} 14%, transparent)`,
                            borderColor: `color-mix(in srgb, ${c} 55%, transparent)`,
                            color: c,
                          }
                        : { borderColor: "var(--line)", color: "var(--muted)" }
                    }
                  >
                    <span
                      className="t-move size-1.5 rounded-full transition-transform"
                      style={{ background: c, transform: on ? "scale(1.4)" : "scale(1)" }}
                    />
                    {STATUS_META[s].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="when">Planned to post</label>
              <DateTimePicker id="when" value={when} onChange={setWhen} />
            </div>
            <div>
              <label className="label" htmlFor="type">Post type</label>
              <select
                id="type"
                className="field"
                value={postType}
                onChange={(e) => setPostType(e.target.value as PostType)}
              >
                {POST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_META[t].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
            <div>
              <ImageField
                label="Inspiration"
                hint="Screenshot of the reel or post"
                value={inspoImg}
                onChange={setInspoImg}
                onError={toast}
              />
            </div>
            <ImageField
              label="Final thumbnail"
              hint="Photo, or a video file to grab a frame"
              accept="image/*,video/*"
              value={thumb}
              onChange={setThumb}
              onError={toast}
            />
          </div>

          <div>
            <label className="label" htmlFor="inspo">Link</label>
            <input
              id="inspo"
              className="field"
              inputMode="url"
              placeholder="https://instagram.com/reel/…"
              value={inspoUrl}
              onChange={(e) => setInspoUrl(e.target.value)}
            />
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost mt-3 no-underline"
              >
                Open inspo <ExternalLink size={14} aria-hidden />
              </a>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label !mb-0" htmlFor="caption">Caption</label>
              <button
                type="button"
                onClick={() => copyText([caption, hashtags].filter(Boolean).join("\n\n"), "Caption + hashtags copied")}
                disabled={!caption && !hashtags}
                aria-label="Copy caption + hashtags"
                title="Copy caption + hashtags"
                className="copy-btn"
              >
                <Copy size={16} aria-hidden />
              </button>
            </div>
            <div className="relative">
              <textarea
                id="caption"
                rows={4}
                className="field resize-y pr-10"
                placeholder="Write the caption…"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <button
                type="button"
                onClick={() => copyText(caption, "Caption copied")}
                disabled={!caption}
                aria-label="Copy caption"
                title="Copy caption"
                className="copy-btn absolute right-1.5 top-1.5"
              >
                <Copy size={15} aria-hidden />
              </button>
            </div>
            <div className="relative mt-2">
              <textarea
                aria-label="Hashtags"
                rows={2}
                className="field resize-y pr-10 font-mono"
                placeholder="#bakery #freshbread …"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
              <button
                type="button"
                onClick={() => copyText(hashtags, "Hashtags copied")}
                disabled={!hashtags}
                aria-label="Copy hashtags"
                title="Copy hashtags"
                className="copy-btn absolute right-1.5 top-1.5"
              >
                <Copy size={15} aria-hidden />
              </button>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="audio">Music / audio</label>
            <input
              id="audio"
              className="field"
              placeholder="Track name or audio link"
              value={audio}
              onChange={(e) => setAudio(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="notes">Edit notes</label>
            <textarea
              id="notes"
              rows={3}
              className="field resize-y"
              placeholder="Cuts, text overlays, colour tweaks…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {post && (
            <div className="border-t border-line pt-4">
              {confirmDelete ? (
                <div className="reveal flex flex-wrap items-center gap-3">
                  <span className="text-sm">Delete this post for good?</span>
                  <button
                    onClick={async () => {
                      await removePost(post.id);
                      onClose();
                    }}
                    className="btn btn-primary"
                  >
                    Yes, delete
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="btn btn-quiet">
                    Keep
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="btn btn-quiet -ml-3.5 !text-danger">
                  Delete post
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
