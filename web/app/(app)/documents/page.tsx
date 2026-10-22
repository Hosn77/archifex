import type { Metadata } from "next";
import Link from "next/link";
import { DocumentCreateForm } from "@/components/DocumentCreateForm";
import { createClient } from "@/lib/supabase/server";
import { formatArabicDate, getTrialState } from "@/lib/trial";
import type { Category, DocumentRecord } from "@/lib/types";
import { getCurrentWorkspace } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "المستندات",
};

export const dynamic = "force-dynamic";

function formatBytes(value: number | null) {
  if (!value) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

const statusLabels: Record<string, string> = {
  active: "نشط",
  processing: "قيد المعالجة",
  archived: "مؤرشف",
};

export default async function DocumentsPage() {
  const supabase = await createClient();
  if (!supabase) return null;

  const current = await getCurrentWorkspace(supabase);
  if (!current) return null;

  const [documentsResult, categoriesResult] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", current.workspace.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .eq("workspace_id", current.workspace.id)
      .order("name", { ascending: true }),
  ]);

  const documents = (documentsResult.data ?? []) as DocumentRecord[];
  const categories = (categoriesResult.data ?? []) as Category[];
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const trial = getTrialState(current.workspace);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Document registry</span>
          <h1>المستندات</h1>
          <p>
            كل سجل هنا مرتبط بمساحة العمل <strong>{current.workspace.name}</strong> فقط.
            إنشاء السجلات وتعديلها يمر عبر فحص RLS وفحص التجربة/الاشتراك.
          </p>
        </div>
        <Link className="button button-ghost" href="/settings">
          إعدادات المساحة
        </Link>
      </div>

      <div className="dashboard-grid">
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Registry</span>
              <h2>سجل المستندات</h2>
              <p>{documents.length} مستند داخل المساحة</p>
            </div>
            <span className={`badge${trial.canWrite ? " badge-success" : " badge-danger"}`}>
              {trial.canWrite ? "الكتابة متاحة" : "قراءة فقط"}
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="empty-state">
              لا توجد مستندات بعد. استخدم النموذج المجاور لإنشاء أول سجل داخل المساحة.
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
                      <span>{document.file_name ?? "سجل بدون ملف"}</span>
                      <span>{formatBytes(document.size_bytes)}</span>
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

        <aside className="section-card">
          <DocumentCreateForm categories={categories} canWrite={trial.canWrite} />

          <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
            <span className="eyebrow">Storage contract</span>
            <p style={{ margin: "8px 0 0", color: "#7e8ca3", fontSize: 11, lineHeight: 1.9 }}>
              سجلات المستندات تحفظ الميتاداتا فقط. عند تفعيل رفع الملفات، استخدم مسار
              <code style={{ color: "#e0a96d", direction: "ltr", display: "inline-block", marginInline: 4 }}>
                workspace_id/document_id/filename
              </code>
              داخل bucket
              <code style={{ color: "#e0a96d", direction: "ltr", display: "inline-block", marginInline: 4 }}>
                archifex-documents
              </code>
              . سياسات Storage تتحقق من عضوية المساحة وحق الكتابة.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
