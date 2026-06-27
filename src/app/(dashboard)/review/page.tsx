import { getPendingSubmissions } from "@/lib/data";
import { approveSubmission, rejectSubmission } from "@/app/(dashboard)/actions";

export default async function ReviewPage() {
  const submissions = await getPendingSubmissions();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-ink">Review queue</h1>
      <p className="mb-6 text-sm text-ink/60">
        Approve to award points, or send back for another try.
      </p>

      {submissions.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <div className="mb-2 text-4xl">✅</div>
          <p className="font-medium text-ink">All caught up</p>
          <p className="text-sm text-ink/50">No submissions waiting for review.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {submissions.map((s) => (
            <li key={s.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3">
                <div>
                  <p className="font-semibold text-ink">
                    {s.camper?.display_name ?? "Camper"}
                    {s.camper?.cabin && (
                      <span className="text-ink/40"> · Cabin {s.camper.cabin}</span>
                    )}
                  </p>
                  <p className="text-xs text-ink/50">
                    {s.season_challenge?.template?.title ?? "Challenge"} ·{" "}
                    {s.season_challenge?.template?.points ?? 0} pts
                  </p>
                </div>
                <span className="rounded-full bg-sunset/15 px-2.5 py-1 text-xs font-semibold text-sunset">
                  {s.content_type}
                </span>
              </div>

              <div className="p-5">
                {s.content_type === "text" && (
                  <p className="whitespace-pre-wrap rounded-xl bg-sand p-4 text-sm text-ink">
                    {s.text_content}
                  </p>
                )}
                {s.content_type === "photo" && s.mediaUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.mediaUrl}
                    alt="Submission"
                    className="max-h-96 w-full rounded-xl object-contain"
                  />
                )}
                {s.content_type === "video" && s.mediaUrl && (
                  <video
                    src={s.mediaUrl}
                    controls
                    className="max-h-96 w-full rounded-xl"
                  />
                )}
                {(s.content_type === "photo" || s.content_type === "video") &&
                  !s.mediaUrl && (
                    <p className="text-sm text-red-500">Media unavailable.</p>
                  )}
              </div>

              <div className="flex gap-3 border-t border-ink/10 px-5 py-3">
                <form action={approveSubmission.bind(null, s.id)} className="flex-1">
                  <button className="w-full rounded-lg bg-pine py-2 text-sm font-semibold text-white hover:bg-pine/90">
                    Approve
                  </button>
                </form>
                <form action={rejectSubmission.bind(null, s.id)}>
                  <button className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/60 hover:bg-ink/5">
                    Send back
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
