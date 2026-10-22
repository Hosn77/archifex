import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrialState } from "@/lib/trial";
import { getCurrentWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

interface DocumentRouteProps {
  params: Promise<{ id: string }>;
}

async function getContext() {
  const supabase = await createClient();
  if (!supabase) {
    return { error: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  const current = await getCurrentWorkspace(supabase);
  if (!current) {
    return { error: NextResponse.json({ error: "Workspace membership not found." }, { status: 404 }) };
  }

  const trial = getTrialState(current.workspace);
  if (!trial.canWrite) {
    return {
      error: NextResponse.json(
        {
          error: "انتهت التجربة المجانية أو أن الاشتراك غير نشط. تعديل المستندات مقيد حالياً.",
          code: "TRIAL_OR_SUBSCRIPTION_REQUIRED",
        },
        { status: 402 },
      ),
    };
  }

  return { supabase, current };
}

export async function PATCH(request: Request, { params }: DocumentRouteProps) {
  const context = await getContext();
  if ("error" in context) return context.error;

  const { id } = await params;
  let payload: { title?: unknown; categoryId?: unknown; description?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof payload.title === "string") {
    const title = payload.title.trim();
    if (!title || title.length > 240) {
      return NextResponse.json({ error: "عنوان المستند يجب أن يكون بين 1 و240 حرفاً." }, { status: 422 });
    }
    updates.title = title;
  }
  if (typeof payload.description === "string") {
    updates.description = payload.description.trim();
  }
  if (payload.categoryId === null || typeof payload.categoryId === "string") {
    updates.category_id = payload.categoryId || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No supported fields supplied." }, { status: 422 });
  }

  const { data, error } = await context.supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .eq("workspace_id", context.current.workspace.id)
    .select("id, title, category_id, status, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 403 });
  }

  if (!data) {
    return NextResponse.json({ error: "Document not found in this workspace." }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, { params }: DocumentRouteProps) {
  const context = await getContext();
  if ("error" in context) return context.error;

  const { id } = await params;
  const { data, error } = await context.supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("workspace_id", context.current.workspace.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 403 });
  }

  if (!data) {
    return NextResponse.json({ error: "Document not found in this workspace." }, { status: 404 });
  }

  return NextResponse.json({ deleted: true, id: data.id });
}
