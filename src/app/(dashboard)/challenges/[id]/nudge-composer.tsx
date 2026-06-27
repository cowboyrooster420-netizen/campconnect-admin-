"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createNudge } from "@/app/(dashboard)/actions";

/** Add a counselor nudge to this challenge, scheduled N days after release. */
export default function NudgeComposer({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [offset, setOffset] = useState(2);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) return setError("Add a prompt (e.g. “Done the Camp Song one yet?”).");
    if (!file) return setError("A nudge needs a counselor video.");
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "mov";
      const path = `feed/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("counselor-videos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);

      await createNudge({
        challengeId,
        title: title.trim(),
        caption: caption.trim() || null,
        mediaPath: path,
        offsetDays: Math.max(0, offset),
      });

      setTitle("");
      setCaption("");
      setOffset(2);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add nudge");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-ink/10 bg-sand/50 p-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Prompt (e.g. Done the Camp Song one yet?)"
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
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-pine/40 bg-pine/5 px-4 py-2 font-medium text-pine hover:bg-pine/10">
          <span>⬆️</span>
          <span className="max-w-[220px] truncate">{file ? file.name : "Choose counselor video"}</span>
          <input
            ref={fileInput}
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        <label className="flex items-center gap-2 text-ink/60">
          Drops
          <input
            type="number"
            min={0}
            value={offset}
            onChange={(e) => setOffset(parseInt(e.target.value || "0", 10))}
            className="w-16 rounded-lg border border-ink/15 px-2 py-1 text-center"
          />
          days after release
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine/90 disabled:opacity-60"
      >
        {busy ? "Adding…" : "Add nudge"}
      </button>
    </div>
  );
}
