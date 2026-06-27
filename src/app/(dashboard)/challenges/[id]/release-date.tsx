"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setChallengeReleaseDate } from "@/app/(dashboard)/actions";

/** Sets the challenge's release date (the anchor nudges schedule against). */
export default function ReleaseDate({
  challengeId,
  current,
}: {
  challengeId: string;
  current: string | null;
}) {
  const router = useRouter();
  // datetime-local wants "YYYY-MM-DDTHH:mm"
  const initial = current ? new Date(current).toISOString().slice(0, 16) : "";
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await setChallengeReleaseDate(challengeId, value ? new Date(value).toISOString() : null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine/90 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save release date"}
      </button>
      <span className="text-xs text-ink/40">Nudges schedule relative to this.</span>
    </div>
  );
}
