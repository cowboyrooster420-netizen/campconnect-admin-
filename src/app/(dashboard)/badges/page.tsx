import { getBadges, getCampers } from "@/lib/data";
import { describeBadgeCriteria } from "@/lib/types";
import { awardBadgeAction } from "@/app/(dashboard)/actions";

export default async function BadgesPage() {
  const [badges, campers] = await Promise.all([getBadges(), getCampers()]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 text-2xl font-bold text-ink">Badges</h1>
      <p className="mb-6 text-sm text-ink/60">
        Badges with an <span className="font-medium text-pine">Auto</span> rule are
        granted automatically when submissions are approved. You can also award
        any badge manually below.
      </p>

      {badges.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink/50 shadow-sm">
          No badges defined for this camp yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {badges.map((b) => (
            <div key={b.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sunset/15 text-lg">
                  🏅
                </span>
                <div>
                  <p className="font-semibold text-ink">{b.name}</p>
                  <p className="text-xs text-ink/50">{b.description}</p>
                </div>
              </div>

              {(() => {
                const rule = describeBadgeCriteria(b.criteria);
                return (
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      rule
                        ? "bg-pine/10 text-pine"
                        : "bg-ink/5 text-ink/50"
                    }`}
                  >
                    {rule ?? "Manual award"}
                  </span>
                );
              })()}

              {campers.length > 0 ? (
                <form action={awardBadgeAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="badgeId" value={b.id} />
                  <select
                    name="camperId"
                    required
                    defaultValue=""
                    className="flex-1 rounded-lg border border-ink/15 px-2 py-1.5 text-sm"
                  >
                    <option value="" disabled>
                      Award to…
                    </option>
                    {campers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.display_name}
                      </option>
                    ))}
                  </select>
                  <button className="rounded-lg bg-pine px-3 py-1.5 text-sm font-semibold text-white hover:bg-pine/90">
                    Award
                  </button>
                </form>
              ) : (
                <p className="mt-3 text-xs text-ink/40">No campers to award yet.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
