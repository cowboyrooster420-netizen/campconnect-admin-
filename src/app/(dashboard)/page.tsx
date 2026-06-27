import Link from "next/link";
import { getOverview } from "@/lib/data";

export default async function OverviewPage() {
  const stats = await getOverview();

  const cards = [
    { label: "Active challenges", value: stats.activeChallenges, href: "/challenges", icon: "🚩" },
    { label: "Pending review", value: stats.pendingSubmissions, href: "/review", icon: "📥" },
    { label: "Campers", value: stats.campers, href: "/campers", icon: "🧒" },
    { label: "Badges awarded", value: stats.badgesAwarded, href: "/badges", icon: "🏅" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-bold text-ink">Overview</h1>
      <p className="mb-8 text-sm text-ink/60">
        Keep the off-season engagement loop running.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-3 text-2xl">{c.icon}</div>
            <div className="text-3xl font-bold text-ink">{c.value}</div>
            <div className="text-sm text-ink/60">{c.label}</div>
          </Link>
        ))}
      </div>

      {stats.pendingSubmissions > 0 && (
        <div className="mt-8 rounded-2xl border border-sunset/30 bg-sunset/5 p-5">
          <p className="font-medium text-ink">
            {stats.pendingSubmissions} submission
            {stats.pendingSubmissions === 1 ? "" : "s"} waiting for review.
          </p>
          <Link
            href="/review"
            className="mt-2 inline-block rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine/90"
          >
            Go to review queue →
          </Link>
        </div>
      )}
    </div>
  );
}
