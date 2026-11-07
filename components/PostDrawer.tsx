"use client";

import { useEffect, useState } from "react";
import type { Post, PostType, Status } from "@/lib/types";
import { POST_TYPES, STATUSES, STATUS_META, TYPE_META } from "@/lib/types";
import { fromLocalInput, toLocalInput } from "@/lib/dates";
import { usePlanner } from "./PlannerProvider";
import ImageField from "./ImageField";

export default function PostDrawer({
  post,
  defaults,
  onClose,
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

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText([caption, hashtags].filter(Boolean).join("\n\n"));
      toast("Caption copied");
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
        className="fade-in absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />
      <div className="sheet-in relative flex h-dvh w-full flex-col bg-card shadow-2xl md:max-w-xl md:border-l md:border-line">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <button onClick={onClose} className="-ml-2 rounded-lg px-2 py-1.5 text-sm text-muted hover:text-ink">
            Cancel
          </button>
          <h2 className="text-sm font-semibold">{post ? "Edit post" : "New post"}</h2>
          <button
            onClick={save}
            disabled={saving}
            className="ig-gradient rounded-full px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
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
                    className="rounded-full border px-3.5 py-1.5 text-sm font-medium transition"
                    style={
                      on
                        ? { background: c, borderColor: c, color: "#fff" }
                        : { borderColor: "var(--line)", color: "var(--muted)" }
                    }
                  >
                    {STATUS_META[s].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="when">Planned to post</label>
              <input
                id="when"
                type="datetime-local"
                className="field"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
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
                    {TYPE_META[t].icon} {TYPE_META[t].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="rounded-2xl border border-line p-4">
            <h3 className="mb-3 text-sm font-semibold">Inspiration</h3>
            <div className="flex flex-col gap-4 sm:flex-row">
              <ImageField
                label="Screenshot"
                hint="Screenshot of the reel or post"
                value={inspoImg}
                onChange={setInspoImg}
                onError={toast}
              />
              <div className="flex-1">
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
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium hover:border-accent"
                  >
                    Open inspo ↗
                  </a>
                )}
              </div>
            </div>
          </section>

          <ImageField
            label="Final thumbnail (optional)"
            hint="Photo, or a video file to grab a frame"
            accept="image/*,video/*"
            value={thumb}
            onChange={setThumb}
            onError={toast}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label !mb-0" htmlFor="caption">Caption</label>
              <button
                type="button"
                onClick={copyCaption}
                disabled={!caption && !hashtags}
                className="text-xs font-semibold text-accent disabled:opacity-40"
              >
                Copy caption + hashtags
              </button>
            </div>
            <textarea
              id="caption"
              rows={4}
              className="field resize-y"
              placeholder="Write the caption…"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <textarea
              aria-label="Hashtags"
              rows={2}
              className="field mt-2 resize-y"
              placeholder="#bakery #freshbread …"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
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
                <div className="flex items-center gap-3">
                  <span className="text-sm">Delete this post for good?</span>
                  <button
                    onClick={async () => {
                      await removePost(post.id);
                      onClose();
                    }}
                    className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-semibold text-white"
                  >
                    Yes, delete
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-sm text-muted">
                    Keep
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="text-sm font-medium text-red-500">
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
