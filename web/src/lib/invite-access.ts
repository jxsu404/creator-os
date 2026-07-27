import type { SupabaseClient } from "@supabase/supabase-js";

export function inviteOnlyEnabled(): boolean {
  return process.env.INVITE_ONLY === "true" || process.env.INVITE_ONLY === "1";
}

/** Misma comprobación que GET /api/invite cuando invite-only está activo. */
export async function userHasInviteAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("user_access")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}
