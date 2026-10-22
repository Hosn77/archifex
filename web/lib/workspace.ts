import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurrentWorkspace, Membership, Workspace } from "./types";

/**
 * Returns the first workspace the signed-in user belongs to.
 * RLS is the source of truth: this query cannot see workspaces the user
 * is not a member of, even if the workspace id is guessed.
 */
export async function getCurrentWorkspace(
  supabase: SupabaseClient,
): Promise<CurrentWorkspace | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) return null;

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", membership.workspace_id)
    .maybeSingle();

  if (workspaceError || !workspace) return null;

  return {
    workspace: workspace as Workspace,
    membership: membership as Membership,
    user,
  };
}
