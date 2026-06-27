import { getCampers } from "@/lib/data";

export default async function CampersPage() {
  const campers = await getCampers();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-ink">Campers</h1>
      <p className="mb-6 text-sm text-ink/60">
        Everyone keeping their camp identity alive year-round.
      </p>

      {/* COPPA reminder — camper accounts are provisioned with guardian consent. */}
      <div className="mb-6 rounded-xl border border-sunset/30 bg-sunset/5 p-4 text-sm text-ink/70">
        <strong>Heads up:</strong> campers are usually under 13. New camper
        accounts must be created with verifiable parental consent — the invite +
        consent flow is coming next. Don&apos;t collect kids&apos; info without it.
      </div>

      {campers.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink/50 shadow-sm">
          No campers in this camp yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 text-left text-ink/50">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Cabin</th>
                <th className="px-5 py-3 text-right font-medium">Badges</th>
              </tr>
            </thead>
            <tbody>
              {campers.map((c) => (
                <tr key={c.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">
                    {c.display_name}
                  </td>
                  <td className="px-5 py-3 text-ink/60">{c.cabin ?? "—"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-pine">
                    {c.badge_awards?.[0]?.count ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
