import { getFeedItems } from "@/lib/data";
import { FEED_TYPE_META } from "@/lib/types";
import { deleteFeedItem } from "@/app/(dashboard)/actions";
import FeedComposer from "./composer";

export default async function FeedPage() {
  const items = await getFeedItems();
  const now = Date.now();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-ink">Feed</h1>
      <p className="mb-6 text-sm text-ink/60">
        Your camp channel. Post camp-memory throwbacks and announcements (schedule
        them for later), and challenge/wrap-up videos appear here automatically.
      </p>

      <FeedComposer />

      {items.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink/50 shadow-sm">
          Nothing in the feed yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const meta = FEED_TYPE_META[item.type];
            const scheduled = new Date(item.publish_at).getTime() > now;
            const linked = item.type === "challenge" || item.type === "wrap_up";
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
                {/* Challenge/wrap-up entries are managed on the Challenges page. */}
                {!linked && (
                  <form action={deleteFeedItem.bind(null, item.id)}>
                    <button className="rounded-lg px-2 py-1 text-xs text-ink/40 hover:text-red-500">
                      Delete
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
