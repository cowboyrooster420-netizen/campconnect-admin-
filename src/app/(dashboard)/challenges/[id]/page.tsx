import Link from "next/link";
import { notFound } from "next/navigation";
import { getChallenge, getChallengeNudges } from "@/lib/data";
import { CATEGORY_META } from "@/lib/types";
import { setChallengeStatus } from "@/app/(dashboard)/actions";
import VideoUploader from "@/app/(dashboard)/challenges/video-uploader";
import DeleteFeedButton from "@/app/(dashboard)/feed/delete-button";
import ReleaseDate from "./release-date";
import NudgeComposer from "./nudge-composer";

export default async function ChallengeEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [challenge, nudges] = await Promise.all([getChallenge(id), getChallengeNudges(id)]);
  if (!challenge) notFound();

  const t = challenge.template;
  const cat = t ? CATEGORY_META[t.category] : null;
  const release = challenge.release_at ? new Date(challenge.release_at) : null;

  const dropDate = (offsetDays: number | null) =>
    release ? new Date(release.getTime() + (offsetDays ?? 0) * 86_400_000) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/challenges" className="text-sm text-ink/50 hover:text-pine">
        ← Challenges
      </Link>

      {/* Header */}
      <div className="mt-3 mb-6">
        <div className="mb-2 flex items-center gap-2">
          {cat && (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ backgroundColor: cat.color + "22", color: cat.color }}
            >
              {cat.label}
            </span>
          )}
          <span className="rounded-full bg-ink/10 px-2.5 py-1 text-xs font-semibold text-ink/60">
            {challenge.status}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-ink">{t?.title}</h1>
        <p className="mt-1 text-ink/70">{t?.summary}</p>
      </div>

      {/* What the challenge actually is */}
      <Section title="What campers do">
        <p className="text-sm leading-relaxed text-ink/80">{t?.instructions}</p>
        <p className="mt-3 text-xs font-semibold uppercase text-ink/40">Counselor script</p>
        <p className="mt-1 text-sm italic leading-relaxed text-ink/70">{t?.counselor_script}</p>
        <p className="mt-2 text-xs text-ink/40">Submission: {t?.submission_format}</p>
      </Section>

      {/* Release + status */}
      <Section title="Release">
        <ReleaseDate challengeId={challenge.id} current={challenge.release_at} />
        <div className="mt-3 flex gap-2">
          {challenge.status !== "active" && (
            <form action={setChallengeStatus.bind(null, challenge.id, "active")}>
              <button className="rounded-lg border border-pine/30 px-3 py-1.5 text-xs font-medium text-pine hover:bg-pine/10">
                Go live now
              </button>
            </form>
          )}
          {challenge.status === "active" && (
            <form action={setChallengeStatus.bind(null, challenge.id, "closed")}>
              <button className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-ink/5">
                Close
              </button>
            </form>
          )}
        </div>
      </Section>

      {/* The 3-beat arc */}
      <Section title="🎬 Intro video">
        <div className="flex justify-end">
          <VideoUploader challengeId={challenge.id} kind="counselor" currentValue={challenge.counselor_video_url} />
        </div>
      </Section>

      <Section title="👋 Nudges">
        {nudges.length === 0 ? (
          <p className="text-sm text-ink/40">No nudges yet — add a mid-challenge counselor check-in below.</p>
        ) : (
          <ul className="space-y-2">
            {nudges.map((n) => {
              const d = dropDate(n.release_offset_days);
              return (
                <li
                  key={n.id}
                  className="flex items-center justify-between rounded-xl bg-sand/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{n.title}</p>
                    <p className="text-xs text-ink/50">
                      Drops {n.release_offset_days ?? 0} day{n.release_offset_days === 1 ? "" : "s"} after release
                      {d ? ` · ${d.toLocaleDateString()}` : " · set a release date"}
                    </p>
                  </div>
                  <DeleteFeedButton id={n.id} />
                </li>
              );
            })}
          </ul>
        )}
        <NudgeComposer challengeId={challenge.id} />
      </Section>

      <Section title="🏁 Wrap-up video">
        <div className="flex justify-end">
          <VideoUploader challengeId={challenge.id} kind="recap" currentValue={challenge.recap_video_url} />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/50">{title}</h2>
      {children}
    </div>
  );
}
