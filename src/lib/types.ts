// TypeScript mirrors of the Postgres schema (see ../../../CampConnect-iOS/supabase/schema.sql)

export type UserRole = "camper" | "counselor" | "operator" | "parent";
export type ChallengeCategory = "outdoor" | "creative" | "reflection" | "tradition";
export type SubmissionFormat = "photo" | "video" | "text";
export type SubmissionStatus = "pending" | "approved" | "rejected";
export type SeasonChallengeStatus = "scheduled" | "active" | "closed";

export interface Camp {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  season_year: number;
}

export interface Profile {
  id: string;
  camp_id: string | null;
  role: UserRole;
  display_name: string;
  cabin: string | null;
  avatar_url: string | null;
  total_points: number;
  created_at: string;
  // Populated via PostgREST embed on the campers roster (count of earned badges).
  badge_awards?: { count: number }[];
}

export interface ChallengeTemplate {
  id: string;
  title: string;
  summary: string;
  category: ChallengeCategory;
  instructions: string;
  counselor_script: string;
  submission_format: SubmissionFormat;
  points: number;
}

export interface SeasonChallenge {
  id: string;
  camp_id: string;
  template_id: string;
  sequence_order: number;
  counselor_video_url: string | null;
  release_at: string | null;
  due_at: string | null;
  status: SeasonChallengeStatus;
  template?: ChallengeTemplate;
}

export interface Submission {
  id: string;
  season_challenge_id: string;
  camper_id: string;
  content_type: SubmissionFormat;
  media_path: string | null;
  text_content: string | null;
  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Embedded via PostgREST resource embedding
  camper?: Pick<Profile, "id" | "display_name" | "cabin">;
  season_challenge?: Pick<SeasonChallenge, "id" | "template_id"> & {
    template?: Pick<ChallengeTemplate, "title" | "points" | "category">;
  };
}

export type BadgeCriteria =
  | { type: "first_approval" }
  | { type: "category_count"; category: ChallengeCategory; count: number }
  | { type: "challenge"; template_id: string }
  | { type: "signup" };

export interface Badge {
  id: string;
  camp_id: string | null;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria | null;
}

/** Plain-English summary of a badge's auto-award rule (or null if manual). */
export function describeBadgeCriteria(c: BadgeCriteria | null): string | null {
  if (!c) return null;
  switch (c.type) {
    case "first_approval":
      return "Auto: first approved challenge";
    case "category_count":
      return `Auto: ${c.count} approved ${CATEGORY_META[c.category].label.toLowerCase()} challenge${
        c.count === 1 ? "" : "s"
      }`;
    case "challenge":
      return "Auto: on completing this challenge";
    case "signup":
      return "Auto: on signing up";
  }
}

export const CATEGORY_META: Record<
  ChallengeCategory,
  { label: string; color: string }
> = {
  outdoor: { label: "Outdoor", color: "#2E7D5B" },
  creative: { label: "Creative", color: "#8E5BB5" },
  reflection: { label: "Reflection", color: "#3C7CE0" },
  tradition: { label: "Tradition", color: "#E08A3C" },
};
