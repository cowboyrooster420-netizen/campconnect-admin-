import { getFeedItems, getSeasonChallenges } from "@/lib/data";
import { FEED_TYPE_META } from "@/lib/types";
import FeedComposer from "./composer";
import DeleteFeedButton from "./delete-button";

export default async function FeedPage() {
  const [items, season] = await Promise.all([getFeedItems(), getSeasonChallenges()]);
  const challenges = season.map((c) => ({ id: c.id, title: c.template?.title ?? "Challenge" }));
  const now = Date.now();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-ink">Feed</h1>
      <p className="mb-6 text-sm text-ink/60">
        Your camp channel. Drop a counselor <strong>nudge</strong> mid-challenge
        (schedule it for a few days out) or post an announcement — challenge and
        wrap-up videos appear here automatically.
      </p>

      <FeedComposer challenges={challenges} />

      {items.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink/50 shadow-sm">
          Nothing in the feed yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const meta = FEED_TYPE_META[item.type];
            const scheduled = new Date(item.publish_at).getTime() > now;
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"
              >
                <span className="text-xl">{meta.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{item.title}</p>
                  {item.caption && <p className="text-sm text-ink/60">{item.caption}</p>}
                  <p className="mt-1 text-xs text-ink/40">
                    {meta.label}
                    {item.media_path ? " · 🎥 video" : ""} ·{" "}
                    {scheduled ? (
                      <span className="font-medium text-sunset">
                        scheduled {new Date(item.publish_at).toLocaleString()}
                      </span>
                    ) : (
                      <>posted {new Date(item.publish_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <DeleteFeedButton id={item.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
