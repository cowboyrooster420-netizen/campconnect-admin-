import { createClient } from "@/lib/supabase/server";
import type {
  Badge,
  ChallengeTemplate,
  Profile,
  SeasonChallenge,
  Submission,
} from "@/lib/types";

/** Counts for the overview dashboard. */
export async function getOverview() {
  const supabase = await createClient();

  const [active, pending, campers, awards] = await Promise.all([
    supabase
      .from("season_challenges")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "camper"),
    supabase.from("badge_awards").select("id", { count: "exact", head: true }),
  ]);

  return {
    activeChallenges: active.count ?? 0,
    pendingSubmissions: pending.count ?? 0,
    campers: campers.count ?? 0,
    badgesAwarded: awards.count ?? 0,
  };
}

/** This camp's scheduled/active/closed challenges, in sequence. */
export async function getSeasonChallenges(): Promise<SeasonChallenge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("season_challenges")
    .select("*, template:challenge_templates(*)")
    .order("sequence_order", { ascending: true });
  return (data as SeasonChallenge[]) ?? [];
}

/** The shared template library, for adding new challenges to the season. */
export async function getTemplates(): Promise<ChallengeTemplate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_templates")
    .select("*")
    .order("title", { ascending: true });
  return (data as ChallengeTemplate[]) ?? [];
}

/** Pending submissions with embedded camper + challenge, and signed media URLs. */
export async function getPendingSubmissions(): Promise<
  (Submission & { mediaUrl: string | null })[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select(
      "*, camper:profiles!camper_id(id,display_name,cabin), season_challenge:season_challenges(id,template_id,template:challenge_templates(title,points,category))"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const submissions = (data as Submission[]) ?? [];

  // Private bucket → generate short-lived signed URLs for media previews.
  return Promise.all(
    submissions.map(async (s) => {
      let mediaUrl: string | null = null;
      if (s.media_path) {
        const { data: signed } = await supabase.storage
          .from("submissions")
          .createSignedUrl(s.media_path, 60 * 60);
        mediaUrl = signed?.signedUrl ?? null;
      }
      return { ...s, mediaUrl };
    })
  );
}

export async function getBadges(): Promise<Badge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("badges")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as Badge[]) ?? [];
}

export async function getCampers(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "camper")
    .order("display_name", { ascending: true });
  return (data as Profile[]) ?? [];
}
