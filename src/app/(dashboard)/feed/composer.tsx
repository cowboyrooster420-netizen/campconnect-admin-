"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createFeedItem } from "@/app/(dashboard)/actions";

/** Post a standalone announcement (text / photo / video). Counselor nudges are
 *  authored inside each challenge's editor, not here. */
export default function FeedComposer() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [publishAt, setPublishAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) return setError("Give it a title.");
    setBusy(true);
    setError(null);
    try {
      let mediaPath: string | null = null;
      let mediaType: "photo" | "video" | null = null;
      if (file) {
        const supabase = createClient();
        const ext = file.name.split(".").pop()?.toLowerCase() || "mov";
        const path = `feed/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("counselor-videos")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw new Error(upErr.message);
        mediaPath = path;
        mediaType = file.type.startsWith("image/") ? "photo" : "video";
      }

      await createFeedItem({
        title: title.trim(),
        caption: caption.trim() || null,
        mediaPath,
        mediaType,
        publishAt: publishAt ? new Date(publishAt).toISOString() : new Date().toISOString(),
      });

      setTitle("");
      setCaption("");
      setFile(null);
      setPublishAt("");
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-8 space-y-3 rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-ink/70">📣 New announcement</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
      />
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Message (optional)"
        rows={2}
        className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-pine/40 bg-pine/5 px-4 py-2 font-medium text-pine hover:bg-pine/10">
          <span>⬆️</span>
          <span className="max-w-[220px] truncate">{file ? file.name : "Add photo or video (optional)"}</span>
          <input
            ref={fileInput}
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        {file && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (fileInput.current) fileInput.current.value = "";
            }}
            className="text-xs text-ink/40 hover:text-red-500"
          >
            clear
          </button>
        )}
        <label className="flex items-center gap-2 text-ink/60">
          Publish:
          <input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className="rounded-lg border border-ink/15 px-2 py-1"
          />
          <span className="text-xs text-ink/40">(blank = now)</span>
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine/90 disabled:opacity-60"
      >
        {busy ? "Posting…" : "Post announcement"}
      </button>
    </div>
  );
}
