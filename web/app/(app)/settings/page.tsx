import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatArabicDate, getTrialState } from "@/lib/trial";
import { getCurrentWorkspace } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "إعدادات المساحة",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) return null;

  const current = await getCurrentWorkspace(supabase);
  if (!current) return null;

  const trial = getTrialState(current.workspace);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Workspace settings</span>
          <h1>إعدادات المساحة</h1>
          <p>
            هوية مساحة العمل، حالة التجربة، والاشتراك. تغييرات الاشتراك والتجربة محمية
            على مستوى قاعدة البيانات ولا يمكن تعديلها من المتصفح.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Organization</span>
              <h2>هوية المؤسسة</h2>
            </div>
            <span className="badge">{current.membership.role}</span>
          </div>

          <dl className="info-list">
            <div className="info-row">
              <dt>اسم المساحة</dt>
              <dd>{current.workspace.name}</dd>
            </div>
            <div className="info-row">
              <dt>المعرّف المختصر</dt>
              <dd style={{ direction: "ltr" }}>{current.workspace.slug}</dd>
            </div>
            <div className="info-row">
              <dt>Workspace ID</dt>
              <dd style={{ direction: "ltr", fontSize: 10 }}>{current.workspace.id}</dd>
            </div>
            <div className="info-row">
              <dt>البريد الإلكتروني</dt>
              <dd style={{ direction: "ltr" }}>{current.user.email}</dd>
            </div>
            <div className="info-row">
              <dt>تاريخ الإنشاء</dt>
              <dd>{formatArabicDate(current.workspace.created_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="section-card" id="billing">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Trial & billing</span>
              <h2>التجربة والاشتراك</h2>
            </div>
            <span
              className={`badge ${
                trial.isActiveSubscription ? "badge-success" : trial.canWrite ? "" : "badge-danger"
              }`}
            >
              {trial.label}
            </span>
          </div>

          <dl className="info-list">
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
              <dd style={{ direction: "ltr" }}>{current.workspace.subscription_status}</dd>
            </div>
            <div className="info-row">
              <dt>الخطة</dt>
              <dd style={{ direction: "ltr" }}>{current.workspace.plan}</dd>
            </div>
            <div className="info-row">
              <dt>صلاحية الكتابة</dt>
              <dd>
                <span className={`badge${trial.canWrite ? " badge-success" : " badge-danger"}`}>
                  {trial.canWrite ? "متاحة" : "مقيدة"}
                </span>
              </dd>
            </div>
          </dl>

          <div className="billing-panel">
            <h3>{!trial.canWrite ? "ترقية مطلوبة لاستئناف الكتابة" : "جاهز للترقية عند الحاجة"}</h3>
            <p>
              {!trial.canWrite
                ? trial.trialExpired
                  ? "انتهت التجربة. القراءة والتصدير متاحان، لكن إنشاء المستندات وتعديل الميتاداتا محظوران في قاعدة البيانات."
                  : "الاشتراك غير نشط. القراءة والتصدير متاحان، لكن إنشاء المستندات وتعديل الميتاداتا محظوران حتى تفعيل الاشتراك."
                : "ستبقى التجربة نشطة حتى التاريخ أعلاه. بعد انتهائها يمكنك الترقية لمواصلة الرفع والتعديل دون فقدان أي بيانات."}
            </p>
            <p style={{ marginBottom: 0 }}>
              يتم تفعيل الاشتراك من فريق مَدار فَلَك عبر service role بعد ربط بوابة الدفع.
              لا تُرسل مفاتيح service role إلى المتصفح أبداً.
            </p>
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Tenant isolation</span>
              <h2>حدود البيانات</h2>
            </div>
          </div>
          <p style={{ margin: 0, color: "#aebbd0", fontSize: 12, lineHeight: 1.9 }}>
            كل جدول أعمال (categories, documents, archive_records, audit_logs) يحتوي
            <code style={{ color: "#e0a96d", marginInline: 4 }}>workspace_id</code>
            وسياسات RLS تتحقق من العضوية. لا يمكن لمستخدم في مساحة أخرى قراءة أو تعديل
            هذه البيانات حتى لو عرف المعرّف.
          </p>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Write guard</span>
              <h2>قاعدة الكتابة</h2>
            </div>
          </div>
          <p style={{ margin: 0, color: "#aebbd0", fontSize: 12, lineHeight: 1.9 }}>
            الكتابة مسموحة عندما يكون الاشتراك
            <code style={{ color: "#e0a96d", marginInline: 4 }}>active</code>
            أو عندما تكون الحالة
            <code style={{ color: "#e0a96d", marginInline: 4 }}>trialing</code>
            و
            <code style={{ color: "#e0a96d", marginInline: 4 }}>now() &lt;= trial_ends_at</code>.
            بعد ذلك تبقى سياسات القراءة كما هي، وتُرفض سياسات INSERT وUPDATE وDELETE.
          </p>
        </section>
      </div>
    </>
  );
}
