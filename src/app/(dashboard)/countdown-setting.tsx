"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSessionStartDate } from "@/app/(dashboard)/actions";

/** Sets the camp's next session start date — drives the "X days until camp!"
 *  countdown on the camper home feed. */
export default function CountdownSetting({ current }: { current: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [busy, setBusy] = useState(false);

  const days = value
    ? Math.ceil((new Date(value + "T00:00:00").getTime() - Date.now()) / 86_400_000)
    : null;

  async function save() {
    setBusy(true);
    try {
      await setSessionStartDate(value || null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="mb-1 text-sm font-bold text-ink">🏕️ Countdown to camp</p>
      <p className="mb-3 text-xs text-ink/50">
        Campers see “X days until camp!” at the top of their feed.
        {days !== null && days >= 0 ? ` Currently ${days} days out.` : ""}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
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
          {busy ? "Saving…" : "Save start date"}
        </button>
      </div>
    </div>
  );
}
