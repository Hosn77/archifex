import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrialState } from "@/lib/trial";
import { getCurrentWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

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

  const current = await getCurrentWorkspace(supabase);
  if (!current) {
    return NextResponse.json({ error: "Workspace membership not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("documents")
    .select("id, title, category_id, file_name, mime_type, size_bytes, status, created_at, updated_at")
    .eq("workspace_id", current.workspace.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
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

  const current = await getCurrentWorkspace(supabase);
  if (!current) {
    return NextResponse.json({ error: "Workspace membership not found." }, { status: 404 });
  }

  const trial = getTrialState(current.workspace);
  if (!trial.canWrite) {
    return NextResponse.json(
      {
        error: "انتهت التجربة المجانية أو الاشتراك. الكتابة متاحة للقراءة فقط حالياً.",
        code: "TRIAL_OR_SUBSCRIPTION_REQUIRED",
      },
      { status: 402 },
    );
  }

  let payload: { title?: unknown; categoryId?: unknown; description?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!title || title.length > 240) {
    return NextResponse.json({ error: "عنوان المستند مطلوب (1-240 حرفاً)." }, { status: 422 });
  }

  const categoryId = typeof payload.categoryId === "string" && payload.categoryId ? payload.categoryId : null;
  const description = typeof payload.description === "string" ? payload.description.trim() : null;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      workspace_id: current.workspace.id,
      title,
      category_id: categoryId,
      description,
      uploaded_by: user.id,
    })
    .select("id, title, category_id, status, created_at")
    .single();

  if (error) {
    const status = error.code === "42501" || error.code === "23514" ? 403 : 400;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }

  return NextResponse.json({ data }, { status: 201 });
}
