"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setChallengeVideo } from "@/app/(dashboard)/actions";

export default function VideoUploader({
  challengeId,
  currentValue,
  kind = "counselor",
}: {
  challengeId: string;
  currentValue: string | null;
  kind?: "counselor" | "recap";
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [url, setUrl] = useState("");

  const hasVideo = !!currentValue;
  const isExternal = currentValue?.startsWith("http");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);

    const ext = file.name.split(".").pop()?.toLowerCase() || "mov";
    // Namespace recap videos so they don't collide with the intro video.
    const path = kind === "recap" ? `recap/${challengeId}.${ext}` : `${challengeId}.${ext}`;

    const supabase = createClient();
    const { error: upErr } = await supabase.storage
      .from("counselor-videos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }

    try {
      await setChallengeVideo(challengeId, kind, path);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function saveUrl() {
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await setChallengeVideo(challengeId, kind, url.trim());
      setShowUrl(false);
      setUrl("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function clearVideo() {
    setBusy(true);
    setError(null);
    try {
      await setChallengeVideo(challengeId, kind, null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={fileInput}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFile}
      />

      <div className="flex items-center gap-2">
        {hasVideo ? (
          <span className="flex items-center gap-1 text-xs font-medium text-pine">
            🎬 {isExternal ? "Linked" : "Uploaded"}
          </span>
        ) : (
          <span className="text-xs text-ink/40">No video</span>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
          className="rounded-lg border border-pine/30 px-2.5 py-1 text-xs font-medium text-pine hover:bg-pine/10 disabled:opacity-50"
        >
          {busy ? "Uploading…" : hasVideo ? "Replace" : "Upload"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setShowUrl((s) => !s)}
          className="rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/60 hover:bg-ink/5 disabled:opacity-50"
        >
          Link
        </button>
        {hasVideo && (
          <button
            type="button"
            disabled={busy}
            onClick={clearVideo}
            className="rounded-lg px-1.5 py-1 text-xs text-ink/40 hover:text-red-500 disabled:opacity-50"
            aria-label="Remove video"
          >
            ✕
          </button>
        )}
      </div>

      {showUrl && (
        <div className="mt-1 flex items-center gap-1">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… (YouTube, Vimeo, etc.)"
            className="w-56 rounded-lg border border-ink/15 px-2 py-1 text-xs"
          />
          <button
            type="button"
            disabled={busy}
            onClick={saveUrl}
            className="rounded-lg bg-pine px-2.5 py-1 text-xs font-semibold text-white hover:bg-pine/90 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}

      {error && <p className="max-w-56 text-right text-xs text-red-500">{error}</p>}
    </div>
  );
}
