"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFeedItem } from "@/app/(dashboard)/actions";

export default function DeleteFeedButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this post? This can’t be undone.")) return;
    setBusy(true);
    try {
      await deleteFeedItem(id);
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="shrink-0 rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink/60 hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
