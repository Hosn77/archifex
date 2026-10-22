import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrialState } from "@/lib/trial";
import { getCurrentWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const current = await getCurrentWorkspace(supabase);
  if (!current) {
    return NextResponse.json({ error: "Workspace membership not found." }, { status: 404 });
  }

  const trial = getTrialState(current.workspace);

  return NextResponse.json({
    workspace: {
      id: current.workspace.id,
      name: current.workspace.name,
      slug: current.workspace.slug,
      plan: current.workspace.plan,
      subscription_status: current.workspace.subscription_status,
      trial_start_date: current.workspace.trial_start_date,
      trial_ends_at: current.workspace.trial_ends_at,
    },
    access: {
      can_write: trial.canWrite,
      is_trialing: trial.isTrialing,
      trial_expired: trial.trialExpired,
      is_active_subscription: trial.isActiveSubscription,
      days_left: trial.daysLeft,
      label: trial.label,
    },
    membership: {
      role: current.membership.role,
    },
  });
}
