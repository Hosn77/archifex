import { NextResponse } from "next/server";
import { createServiceRoleClient, isPlatformAdmin } from "@/lib/platform-admin";
import { createClient } from "@/lib/supabase/server";
import { getTrialState } from "@/lib/trial";
import type { Workspace } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;
const RENEW_PLANS = new Set(["starter", "professional", "enterprise"]);
const SUBSCRIPTION_STATUSES = new Set(["trialing", "active", "past_due", "canceled"]);

interface AdminActionBody {
  action?: unknown;
  plan?: unknown;
  days?: unknown;
  notes?: unknown;
  status?: unknown;
}

function parseDays(value: unknown, fallback: number, max: number) {
  const days = value === undefined || value === null ? fallback : Number(value);
  if (!Number.isInteger(days) || days < 1 || days > max) return null;
  return days;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  let payload: AdminActionBody;
  try {
    payload = (await request.json()) as AdminActionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = typeof payload.action === "string" ? payload.action : "";
  if (!["renew", "extend_trial", "set_status"].includes(action)) {
    return NextResponse.json(
      { error: "action must be renew, extend_trial or set_status." },
      { status: 422 },
    );
  }

  const { data: existingRow, error: readError } = await admin
    .from("workspaces")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: readError.message, code: readError.code }, { status: 400 });
  }
  if (!existingRow) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const existing = existingRow as Workspace;
  const now = new Date();
  const nowIso = now.toISOString();
  const notes =
    typeof payload.notes === "string" ? payload.notes.trim() || null : undefined;

  const update: Record<string, unknown> = {};
  const audit: {
    action: string;
    metadata: Record<string, unknown>;
  } = { action: "", metadata: {} };

  if (action === "renew") {
    const plan = typeof payload.plan === "string" ? payload.plan : existing.plan;
    if (!RENEW_PLANS.has(plan)) {
      return NextResponse.json(
        { error: "plan must be starter, professional or enterprise." },
        { status: 422 },
      );
    }

    const days = parseDays(payload.days, 365, 3650);
    if (!days) {
      return NextResponse.json(
        { error: "days must be an integer between 1 and 3650." },
        { status: 422 },
      );
    }

    // Renewing an active subscription extends the existing period. A trial or
    // an expired subscription starts a fresh period from now.
    const currentEnd = existing.subscription_ends_at
      ? new Date(existing.subscription_ends_at)
      : null;
    const base =
      currentEnd &&
      Number.isFinite(currentEnd.getTime()) &&
      currentEnd.getTime() > now.getTime()
        ? currentEnd
        : now;
    const endsAt = new Date(base.getTime() + days * DAY_MS);

    update.subscription_status = "active";
    update.plan = plan;
    update.subscription_started_at = existing.subscription_started_at ?? nowIso;
    update.subscription_ends_at = endsAt.toISOString();
    update.last_renewed_at = nowIso;
    if (notes !== undefined) update.billing_notes = notes;

    audit.action = "workspace.subscription.renewed";
    audit.metadata = {
      plan,
      days,
      previous_status: existing.subscription_status,
      previous_subscription_ends_at: existing.subscription_ends_at,
      subscription_ends_at: endsAt.toISOString(),
    };
  } else if (action === "extend_trial") {
    const days = parseDays(payload.days, 30, 365);
    if (!days) {
      return NextResponse.json(
        { error: "days must be an integer between 1 and 365." },
        { status: 422 },
      );
    }

    update.subscription_status = "trialing";
    update.plan = "trial";
    update.trial_start_date = nowIso;
    update.trial_ends_at = new Date(now.getTime() + days * DAY_MS).toISOString();
    update.subscription_started_at = null;
    update.subscription_ends_at = null;
    if (notes !== undefined) update.billing_notes = notes;

    audit.action = "workspace.trial.extended";
    audit.metadata = {
      days,
      previous_status: existing.subscription_status,
      previous_trial_ends_at: existing.trial_ends_at,
      trial_ends_at: update.trial_ends_at,
    };
  } else {
    const status = typeof payload.status === "string" ? payload.status : "";
    if (!SUBSCRIPTION_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "status must be trialing, active, past_due or canceled." },
        { status: 422 },
      );
    }

    update.subscription_status = status;
    if (status === "active" && !existing.subscription_started_at) {
      update.subscription_started_at = nowIso;
    }
    if (notes !== undefined) update.billing_notes = notes;

    audit.action = "workspace.subscription.status_changed";
    audit.metadata = {
      previous_status: existing.subscription_status,
      status,
    };
  }

  const { data: updatedRow, error: updateError } = await admin
    .from("workspaces")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message, code: updateError.code },
      { status: 400 },
    );
  }

  const { error: auditError } = await admin.from("platform_audit_logs").insert({
    actor_id: user.id,
    workspace_id: id,
    action: audit.action,
    metadata: audit.metadata,
  });

  if (auditError) {
    // The subscription change succeeded; never roll it back because the
    // provider-side audit trail is temporarily unavailable.
    console.error("Platform audit log insert failed:", auditError.message);
  }

  const updated = updatedRow as Workspace;
  const trial = getTrialState(updated);

  return NextResponse.json({
    data: {
      ...updated,
      can_write: trial.canWrite,
      access_label: trial.label,
      days_left: trial.daysLeft,
      subscription_days_left: trial.subscriptionDaysLeft,
      subscription_expired: trial.subscriptionExpired,
    },
  });
}
