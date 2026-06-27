"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOperatorContext } from "@/lib/auth";

/**
 * Approve a submission. Crediting points and awarding auto-badges is handled by
 * the `on_submission_approved` database trigger (see supabase/auto_badges.sql),
 * so it stays consistent regardless of who approves.
 */
export async function approveSubmission(submissionId: string) {
  const ctx = await getOperatorContext();
  if (!ctx) throw new Error("Not authorized");
  const supabase = await createClient();

  const { error } = await supabase
    .from("submissions")
    .update({
      status: "approved",
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (error) throw new Error(error.message);

  revalidatePath("/review");
  revalidatePath("/badges");
  revalidatePath("/campers");
  revalidatePath("/");
}

export async function rejectSubmission(submissionId: string) {
  const ctx = await getOperatorContext();
  if (!ctx) throw new Error("Not authorized");
  const supabase = await createClient();

  const { error } = await supabase
    .from("submissions")
    .update({
      status: "rejected",
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (error) throw new Error(error.message);

  revalidatePath("/review");
  revalidatePath("/");
}

/** Add a template to this camp's season as the next sequenced challenge. */
export async function addChallenge(templateId: string) {
  const ctx = await getOperatorContext();
  if (!ctx?.camp) throw new Error("No camp assigned");
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("season_challenges")
    .select("sequence_order")
    .eq("camp_id", ctx.camp.id)
    .order("sequence_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (last?.sequence_order ?? 0) + 1;

  const { error } = await supabase.from("season_challenges").insert({
    camp_id: ctx.camp.id,
    template_id: templateId,
    sequence_order: nextOrder,
    status: "scheduled",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/challenges");
}

/** Form-action wrapper so a plain <form> with a <select name="templateId"> works. */
export async function addChallengeAction(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return;
  await addChallenge(templateId);
}

/**
 * Save a challenge's intro ('counselor') or wrap-up ('recap') video. `value` is a
 * storage path in the `counselor-videos` bucket, an external URL, or null to clear.
 * Also syncs a shadow feed_item so the video shows in the camp feed.
 */
export async function setChallengeVideo(
  challengeId: string,
  kind: "counselor" | "recap",
  value: string | null
) {
  const ctx = await getOperatorContext();
  if (!ctx?.camp) throw new Error("Not authorized");
  const supabase = await createClient();

  const column = kind === "counselor" ? "counselor_video_url" : "recap_video_url";
  const { error } = await supabase
    .from("season_challenges")
    .update({ [column]: value })
    .eq("id", challengeId);
  if (error) throw new Error(error.message);

  // Sync the shadow feed entry (type 'challenge' for intro, 'wrap_up' for recap).
  const feedType = kind === "counselor" ? "challenge" : "wrap_up";
  if (value) {
    const { data: ch } = await supabase
      .from("season_challenges")
      .select("template:challenge_templates(title)")
      .eq("id", challengeId)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const title = (ch as any)?.template?.title ?? "Challenge";
    await supabase.from("feed_items").upsert(
      {
        camp_id: ctx.camp.id,
        type: feedType,
        title,
        caption: kind === "counselor" ? "New challenge unlocked" : "Challenge wrap-up",
        media_path: value,
        media_type: "video",
        season_challenge_id: challengeId,
        created_by: ctx.userId,
        publish_at: new Date().toISOString(),
      },
      { onConflict: "season_challenge_id,type" }
    );
  } else {
    await supabase
      .from("feed_items")
      .delete()
      .eq("season_challenge_id", challengeId)
      .eq("type", feedType);
  }

  revalidatePath("/challenges");
  revalidatePath("/feed");
}

/** Form-action wrapper for pasting an external video URL. */
export async function setChallengeVideoUrlAction(formData: FormData) {
  const challengeId = String(formData.get("challengeId") ?? "");
  const kind = (String(formData.get("kind") ?? "counselor") as "counselor" | "recap");
  const url = String(formData.get("videoUrl") ?? "").trim();
  if (!challengeId) return;
  await setChallengeVideo(challengeId, kind, url || null);
}

export async function setChallengeStatus(
  challengeId: string,
  status: "scheduled" | "active" | "closed"
) {
  const ctx = await getOperatorContext();
  if (!ctx) throw new Error("Not authorized");
  const supabase = await createClient();

  const patch: Record<string, unknown> = { status };
  // Stamp a release time the first time a challenge goes active.
  if (status === "active") patch.release_at = new Date().toISOString();

  const { error } = await supabase
    .from("season_challenges")
    .update(patch)
    .eq("id", challengeId);
  if (error) throw new Error(error.message);

  revalidatePath("/challenges");
  revalidatePath("/");
}

/**
 * Create a feed item — a counselor 'nudge' (tied to a challenge) or an
 * 'announcement' (text/photo/video). Schedules via publishAt.
 */
export async function createFeedItem(input: {
  type: "nudge" | "announcement";
  title: string;
  caption: string | null;
  mediaPath: string | null;
  mediaType: "photo" | "video" | null;
  seasonChallengeId: string | null;
  publishAt: string;
}) {
  const ctx = await getOperatorContext();
  if (!ctx?.camp) throw new Error("No camp assigned");
  const supabase = await createClient();

  const { error } = await supabase.from("feed_items").insert({
    camp_id: ctx.camp.id,
    type: input.type,
    title: input.title,
    caption: input.caption,
    media_path: input.mediaPath,
    media_type: input.mediaType,
    season_challenge_id: input.type === "nudge" ? input.seasonChallengeId : null,
    publish_at: input.publishAt,
    created_by: ctx.userId,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/feed");
}

export async function deleteFeedItem(id: string) {
  const ctx = await getOperatorContext();
  if (!ctx) throw new Error("Not authorized");
  const supabase = await createClient();
  const { error } = await supabase.from("feed_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/feed");
}

/** Manually award a badge to a camper. */
export async function awardBadge(badgeId: string, camperId: string) {
  const ctx = await getOperatorContext();
  if (!ctx) throw new Error("Not authorized");
  const supabase = await createClient();

  const { error } = await supabase
    .from("badge_awards")
    .insert({ badge_id: badgeId, camper_id: camperId })
    .select()
    .maybeSingle();
  // Ignore unique-violation (already awarded); surface anything else.
  if (error && error.code !== "23505") throw new Error(error.message);

  revalidatePath("/badges");
  revalidatePath("/");
}

/** Form-action wrapper for awarding a badge from a <form> with selects. */
export async function awardBadgeAction(formData: FormData) {
  const badgeId = String(formData.get("badgeId") ?? "");
  const camperId = String(formData.get("camperId") ?? "");
  if (!badgeId || !camperId) return;
  await awardBadge(badgeId, camperId);
}
