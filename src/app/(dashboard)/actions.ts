"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOperatorContext } from "@/lib/auth";

/** Approve a submission and credit the camper with the challenge's points. */
export async function approveSubmission(submissionId: string) {
  const ctx = await getOperatorContext();
  if (!ctx) throw new Error("Not authorized");
  const supabase = await createClient();

  // Load the submission + its template points and the camper.
  const { data: submission } = await supabase
    .from("submissions")
    .select(
      "id, camper_id, season_challenge:season_challenges(template:challenge_templates(points))"
    )
    .eq("id", submissionId)
    .single();

  const { error } = await supabase
    .from("submissions")
    .update({
      status: "approved",
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (error) throw new Error(error.message);

  // Credit points (read-modify-write; fine for a single-operator MVP).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const points: number =
    (submission as any)?.season_challenge?.template?.points ?? 0;
  if (submission?.camper_id && points > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("id", submission.camper_id)
      .single();
    await supabase
      .from("profiles")
      .update({ total_points: (profile?.total_points ?? 0) + points })
      .eq("id", submission.camper_id);
  }

  revalidatePath("/review");
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
 * Save the counselor video for a challenge. `value` is either:
 *   - a storage path in the `counselor-videos` bucket (uploaded from the client), or
 *   - a full external URL (e.g. a YouTube/Vimeo link the operator pasted), or
 *   - null to clear it.
 * The iOS app resolves a bare path into a signed URL at view time.
 */
export async function setCounselorVideo(
  challengeId: string,
  value: string | null
) {
  const ctx = await getOperatorContext();
  if (!ctx) throw new Error("Not authorized");
  const supabase = await createClient();

  const { error } = await supabase
    .from("season_challenges")
    .update({ counselor_video_url: value })
    .eq("id", challengeId);
  if (error) throw new Error(error.message);

  revalidatePath("/challenges");
}

/** Form-action wrapper for pasting an external video URL. */
export async function setCounselorVideoUrlAction(formData: FormData) {
  const challengeId = String(formData.get("challengeId") ?? "");
  const url = String(formData.get("videoUrl") ?? "").trim();
  if (!challengeId) return;
  await setCounselorVideo(challengeId, url || null);
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
