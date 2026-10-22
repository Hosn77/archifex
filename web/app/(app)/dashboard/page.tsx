import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatArabicDate, getTrialState } from "@/lib/trial";
import { getCurrentWorkspace } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "لوحة التحكم",
};

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  active: "نشط",
  processing: "قيد المعالجة",
  archived: "مؤرشف",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) return null;

  const current = await getCurrentWorkspace(supabase);
  if (!current) return null;

  const workspaceId = current.workspace.id;
  const [documentsResult, categoriesResult, membersResult, auditResult, documentsCount, categoriesCount] =
    await Promise.all([
      supabase
        .from("documents")
        .select("id, title, status, category_id, created_at, file_name")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("categories")
        .select("id, name")
        .eq("workspace_id", workspaceId)
        .order("name", { ascending: true }),
      supabase
        .from("workspace_members")
        .select("user_id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("audit_logs")
        .select("id, action, entity_type, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("categories")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
    ]);

  const trial = getTrialState(current.workspace);
  const documents = documentsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const audit = auditResult.data ?? [];

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Workspace overview</span>
          <h1>مرحباً، {current.workspace.name}</h1>
          <p>
            هذه لوحة مساحة العمل المعزولة الخاصة بمؤسستك. البيانات المعروضة لا تتجاوز حدود
            هذه المساحة، وكل عمليات الكتابة تمر عبر تحقق الاشتراك والتجربة.
          </p>
        </div>
        <Link className="button button-gold" href="/documents">
          إدارة المستندات
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span>المستندات</span>
          <strong>{documentsCount.count ?? 0}</strong>
          <small>سجلات داخل المساحة</small>
        </div>
        <div className="stat-card">
          <span>التصنيفات</span>
          <strong>{categoriesCount.count ?? 0}</strong>
          <small>تصنيفات أرشيفية</small>
        </div>
        <div className="stat-card">
          <span>أعضاء الفريق</span>
          <strong>{membersResult.count ?? 0}</strong>
          <small>صلاحيات داخل المساحة</small>
        </div>
        <div className="stat-card">
          <span>الخطة الحالية</span>
          <strong>{trial.isActiveSubscription ? "نشطة" : "تجربة"}</strong>
          <small>{trial.label}</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Recent documents</span>
              <h2>أحدث المستندات</h2>
            </div>
            <Link className="button button-ghost button-small" href="/documents">
              عرض الكل
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="empty-state">
              لا توجد مستندات بعد. انتقل إلى صفحة المستندات لإنشاء أول سجل، ثم اربط ملفاً
              من Supabase Storage عند تفعيل رفع الملفات.
            </div>
          ) : (
            <div className="document-list">
              {documents.map((document) => (
                <div className="document-row" key={document.id}>
                  <span className="doc-icon" aria-hidden="true">
                    DOC
                  </span>
                  <div className="doc-body">
                    <div className="doc-title">{document.title}</div>
                    <div className="doc-meta">
                      <span>{formatArabicDate(document.created_at)}</span>
                      <span>{document.category_id ? categoryNames.get(document.category_id) ?? "تصنيف" : "بدون تصنيف"}</span>
                      {document.file_name ? <span>{document.file_name}</span> : <span>سجل بدون ملف</span>}
                    </div>
                  </div>
                  <span className={`badge${document.status === "active" ? " badge-success" : ""}`}>
                    {statusLabels[document.status] ?? document.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Workspace health</span>
              <h2>حالة المساحة</h2>
            </div>
          </div>

          <dl className="info-list">
            <div className="info-row">
              <dt>حالة الوصول</dt>
              <dd>
                <span className={`badge${trial.canWrite ? " badge-success" : " badge-danger"}`}>
                  {trial.canWrite ? "قراءة وكتابة" : "قراءة فقط"}
                </span>
              </dd>
            </div>
            <div className="info-row">
              <dt>بداية التجربة</dt>
              <dd>{formatArabicDate(current.workspace.trial_start_date)}</dd>
            </div>
            <div className="info-row">
              <dt>نهاية التجربة</dt>
              <dd>{formatArabicDate(current.workspace.trial_ends_at)}</dd>
            </div>
            <div className="info-row">
              <dt>حالة الاشتراك</dt>
              <dd>{current.workspace.subscription_status}</dd>
            </div>
            <div className="info-row">
              <dt>دورك</dt>
              <dd>{current.membership.role}</dd>
            </div>
          </dl>

          {!trial.canWrite ? (
            <div className="billing-panel">
              <h3>الكتابة مقيدة مؤقتاً</h3>
              <p>يمكنك القراءة والتصدير، لكن الرفع وتعديل البيانات يحتاجان اشتراكاً نشطاً.</p>
              <Link className="button button-gold button-small" href="/settings#billing">
                ترقية المساحة
              </Link>
            </div>
          ) : null}

          <div style={{ marginTop: 18 }}>
            <span className="eyebrow">Audit trail</span>
            <div className="document-list" style={{ marginTop: 9 }}>
              {audit.length === 0 ? (
                <div className="empty-state">لا يوجد نشاط مسجّل بعد.</div>
              ) : (
                audit.map((entry) => (
                  <div className="document-row" key={entry.id}>
                    <span className="doc-icon" aria-hidden="true">
                      LOG
                    </span>
                    <div className="doc-body">
                      <div className="doc-title">
                        {entry.action} · {entry.entity_type}
                      </div>
                      <div className="doc-meta">
                        <span>{formatArabicDate(entry.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
