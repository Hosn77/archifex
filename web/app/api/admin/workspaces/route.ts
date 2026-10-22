import { NextResponse } from "next/server";
import { createServiceRoleClient, isPlatformAdmin } from "@/lib/platform-admin";
import { createClient } from "@/lib/supabase/server";
import { getTrialState } from "@/lib/trial";
import type { Workspace } from "@/lib/types";

export const dynamic = "force-dynamic";

interface OwnerProfile {
  id: string;
  email: string | null;
  full_name: string | null;
}

function countByWorkspace(rows: Array<{ workspace_id: string }> | null) {
  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    counts.set(row.workspace_id, (counts.get(row.workspace_id) ?? 0) + 1);
  }
  return counts;
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!(await isPlatformAdmin(supabase, user))) {
    return NextResponse.json(
      { error: "This account is not a platform administrator.", code: "NOT_PLATFORM_ADMIN" },
      { status: 403 },
    );
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Add it to the deployment environment and redeploy.",
        code: "SERVICE_ROLE_REQUIRED",
      },
      { status: 503 },
    );
  }

  const { data: workspaceRows, error: workspacesError } = await admin
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (workspacesError) {
    return NextResponse.json(
      { error: workspacesError.message, code: workspacesError.code },
      { status: 400 },
    );
  }

  const workspaces = (workspaceRows ?? []) as Workspace[];
  const ownerIds = [...new Set(workspaces.map((workspace) => workspace.owner_id).filter(Boolean))];

  const profilesPromise: PromiseLike<{
    data: OwnerProfile[] | null;
    error: { message: string } | null;
  }> = ownerIds.length
    ? admin.from("profiles").select("id, email, full_name").in("id", ownerIds)
    : Promise.resolve({ data: [] as OwnerProfile[], error: null });

  const [profilesResult, membersResult, documentsResult] = await Promise.all([
    profilesPromise,
    admin.from("workspace_members").select("workspace_id"),
    admin.from("documents").select("workspace_id"),
  ]);

  const profiles = new Map(
    ((profilesResult.data ?? []) as OwnerProfile[]).map((profile) => [profile.id, profile]),
  );
  const memberCounts = countByWorkspace(membersResult.data);
  const documentCounts = countByWorkspace(documentsResult.data);

  const data = workspaces.map((workspace) => {
    const trial = getTrialState(workspace);
    const owner = profiles.get(workspace.owner_id);

    return {
      ...workspace,
      owner_email: owner?.email ?? null,
      owner_name: owner?.full_name ?? null,
      member_count: memberCounts.get(workspace.id) ?? 0,
      document_count: documentCounts.get(workspace.id) ?? 0,
      can_write: trial.canWrite,
      access_label: trial.label,
      days_left: trial.daysLeft,
      subscription_days_left: trial.subscriptionDaysLeft,
      subscription_expired: trial.subscriptionExpired,
    };
  });

  return NextResponse.json({ data });
}
