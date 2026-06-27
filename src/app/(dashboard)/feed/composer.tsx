"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createFeedItem } from "@/app/(dashboard)/actions";

export default function FeedComposer() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<"memory" | "announcement">("memory");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [publishAt, setPublishAt] = useState(""); // empty = now
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) {
      setError("Give it a title.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let mediaPath: string | null = null;
      if (file) {
        const supabase = createClient();
        const ext = file.name.split(".").pop()?.toLowerCase() || "mov";
        const path = `feed/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("counselor-videos")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw new Error(upErr.message);
        mediaPath = path;
      }

      await createFeedItem({
        type,
        title: title.trim(),
        caption: caption.trim() || null,
        mediaPath,
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
      <div className="flex gap-2">
        {(["memory", "announcement"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              type === t ? "bg-pine text-white" : "bg-ink/5 text-ink/60"
            }`}
          >
            {t === "memory" ? "📼 Camp memory" : "📣 Announcement"}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Remember the lake?)"
        className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
      />
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption (optional)"
        rows={2}
        className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <input
          ref={fileInput}
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-xs text-ink/60"
        />
        <label className="flex items-center gap-2 text-ink/60">
          Publish:
          <input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className="rounded-lg border border-ink/15 px-2 py-1"
          />
          <span className="text-xs text-ink/40">(blank = now; future = scheduled)</span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine/90 disabled:opacity-60"
      >
        {busy ? "Posting…" : "Post to feed"}
      </button>
    </div>
  );
}
