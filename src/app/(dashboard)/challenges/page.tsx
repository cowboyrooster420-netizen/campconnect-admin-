import { getSeasonChallenges, getTemplates } from "@/lib/data";
import { CATEGORY_META, type SeasonChallengeStatus } from "@/lib/types";
import { addChallengeAction, setChallengeStatus } from "@/app/(dashboard)/actions";
import VideoUploader from "./video-uploader";

const STATUS_STYLE: Record<SeasonChallengeStatus, string> = {
  scheduled: "bg-ink/10 text-ink/60",
  active: "bg-pine/15 text-pine",
  closed: "bg-ink/15 text-ink/50",
};

export default async function ChallengesPage() {
  const [season, templates] = await Promise.all([
    getSeasonChallenges(),
    getTemplates(),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold text-ink">Challenges</h1>
      <p className="mb-6 text-sm text-ink/60">
        Sequence your season. Add from the library, then release each challenge
        when you&apos;re ready.
      </p>

      {/* Add from template library */}
      <form
        action={addChallengeAction}
        className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
      >
        <label className="text-sm font-medium text-ink/70">Add a challenge:</label>
        <select
          name="templateId"
          required
          defaultValue=""
          className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Choose from the library…
          </option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} · {CATEGORY_META[t.category].label} · {t.points}pts
            </option>
          ))}
        </select>
        <button className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine/90">
          Add to season
        </button>
      </form>

      {/* Sequenced season list */}
      {season.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink/50 shadow-sm">
          No challenges yet. Add one from the library above.
        </p>
      ) : (
        <ol className="space-y-3">
          {season.map((c) => {
            const cat = c.template ? CATEGORY_META[c.template.category] : null;
            return (
              <li key={c.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/5 text-sm font-bold text-ink/50">
                    {c.sequence_order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {c.template?.title ?? "Untitled"}
                    </p>
                    <p className="truncate text-xs text-ink/50">
                      {cat?.label} · {c.template?.points ?? 0} pts
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[c.status]}`}
                  >
                    {c.status}
                  </span>
                  <div className="flex gap-2">
                    {c.status !== "active" && (
                      <form action={setChallengeStatus.bind(null, c.id, "active")}>
                        <button className="rounded-lg border border-pine/30 px-3 py-1.5 text-xs font-medium text-pine hover:bg-pine/10">
                          Release
                        </button>
                      </form>
                    )}
                    {c.status === "active" && (
                      <form action={setChallengeStatus.bind(null, c.id, "closed")}>
                        <button className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-ink/5">
                          Close
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                  <span className="text-xs font-medium text-ink/50">
                    Counselor video
                  </span>
                  <VideoUploader
                    challengeId={c.id}
                    currentValue={c.counselor_video_url}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
