import { createClient } from "@/lib/supabase/server";
import type { Camp, Profile } from "@/lib/types";

export interface OperatorContext {
  userId: string;
  email: string | undefined;
  profile: Profile;
  camp: Camp | null;
}

/**
 * Returns the signed-in operator's context, or null if the user isn't an
 * operator. Middleware already guarantees a logged-in user on dashboard routes;
 * this adds the role + camp lookup the layout needs.
 */
export async function getOperatorContext(): Promise<OperatorContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || profile.role !== "operator") return null;

  let camp: Camp | null = null;
  if (profile.camp_id) {
    const { data } = await supabase
      .from("camps")
      .select("*")
      .eq("id", profile.camp_id)
      .single<Camp>();
    camp = data;
  }

  return { userId: user.id, email: user.email, profile, camp };
}
