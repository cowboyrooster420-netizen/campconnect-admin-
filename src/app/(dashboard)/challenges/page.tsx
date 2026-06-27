import Link from "next/link";
import { getSeasonChallenges, getTemplates } from "@/lib/data";
import { CATEGORY_META, type SeasonChallengeStatus } from "@/lib/types";
import { addChallengeAction } from "@/app/(dashboard)/actions";

const STATUS_STYLE: Record<SeasonChallengeStatus, string> = {
  scheduled: "bg-ink/10 text-ink/60",
  active: "bg-pine/15 text-pine",
  closed: "bg-ink/15 text-ink/50",
};

export default async function ChallengesPage() {
  const [season, templates] = await Promise.all([getSeasonChallenges(), getTemplates()]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-ink">Challenges</h1>
      <p className="mb-6 text-sm text-ink/60">
        Your season. Tap a challenge to set up its arc — intro, nudges, and wrap-up.
      </p>

      {/* Sequenced season list — each links to the editor */}
      {season.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink/50 shadow-sm">
          No challenges yet. Add one from the library below.
        </p>
      ) : (
        <ol className="space-y-3">
          {season.map((c) => {
            const cat = c.template ? CATEGORY_META[c.template.category] : null;
            return (
              <li key={c.id}>
                <Link
                  href={`/challenges/${c.id}`}
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/5 text-sm font-bold text-ink/50">
                    {c.sequence_order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{c.template?.title ?? "Untitled"}</p>
                    <p className="truncate text-xs text-ink/50">
                      {cat?.label}
                      {c.counselor_video_url ? " · 🎬" : ""}
                      {c.recap_video_url ? " · 🏁" : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[c.status]}`}>
                    {c.status}
                  </span>
                  <span className="text-ink/30">›</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {/* Add from the library — readable cards so you know what each challenge is */}
      <h2 className="mb-3 mt-10 text-sm font-bold uppercase tracking-wide text-ink/50">
        Add from the library
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((t) => {
          const cat = CATEGORY_META[t.category];
          return (
            <div key={t.id} className="flex flex-col rounded-2xl bg-white p-4 shadow-sm">
              <span
                className="mb-2 self-start rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ backgroundColor: cat.color + "22", color: cat.color }}
              >
                {cat.label}
              </span>
              <p className="font-semibold text-ink">{t.title}</p>
              <p className="mt-1 flex-1 text-sm text-ink/60">{t.summary}</p>
              <form action={addChallengeAction} className="mt-3">
                <input type="hidden" name="templateId" value={t.id} />
                <button className="rounded-lg bg-pine px-3 py-1.5 text-sm font-semibold text-white hover:bg-pine/90">
                  Add to season
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
