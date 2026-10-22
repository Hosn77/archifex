"use client";

import { useEffect, useState } from "react";
import { formatArabicDate } from "@/lib/trial";
import type { AdminWorkspace } from "@/lib/types";

type Notice = { type: "success" | "error"; text: string } | null;
type ErrorState = { message: string; code?: string } | null;
type OpenForm = { id: string; mode: "renew" | "trial" } | null;

const planLabels: Record<string, string> = {
  trial: "تجربة",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const statusLabels: Record<string, string> = {
  trialing: "تجربة",
  active: "نشط",
  past_due: "متأخر السداد",
  canceled: "ملغي",
};

function badgeClass(workspace: AdminWorkspace) {
  if (!workspace.can_write) return "badge-danger";
  if (workspace.subscription_status === "active") return "badge-success";
  return "";
}

function optionalDate(value: string | null) {
  return value ? formatArabicDate(value) : "غير محدد";
}

export function AdminDashboard() {
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<OpenForm>(null);

  const [renewPlans, setRenewPlans] = useState<Record<string, string>>({});
  const [renewDays, setRenewDays] = useState<Record<string, string>>({});
  const [renewNotes, setRenewNotes] = useState<Record<string, string>>({});
  const [trialDays, setTrialDays] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/admin/workspaces", { cache: "no-store" });
        const body = (await response.json().catch(() => ({}))) as {
          data?: AdminWorkspace[];
          error?: string;
          code?: string;
        };

        if (!response.ok) {
          if (!cancelled) {
            setError({
              message: body.error ?? "تعذر تحميل قائمة المساحات.",
              code: body.code,
            });
          }
          return;
        }

        if (!cancelled) {
          setWorkspaces(Array.isArray(body.data) ? body.data : []);
        }
      } catch (caught) {
        if (!cancelled) {
          setError({
            message:
              caught instanceof Error ? caught.message : "تعذر الاتصال بالخادم.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function toggleForm(id: string, mode: "renew" | "trial") {
    setOpenForm((current) =>
      current && current.id === id && current.mode === mode ? null : { id, mode },
    );
  }

  async function runAction(
    workspaceId: string,
    action: "renew" | "extend_trial",
    payload: Record<string, unknown>,
  ) {
    setBusyId(workspaceId);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "تعذر تنفيذ العملية.");
      }

      const workspaceName =
        workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? "المساحة";

      setNotice({
        type: "success",
        text:
          action === "renew"
            ? `تم تجديد اشتراك «${workspaceName}» بنجاح.`
            : `تم تمديد تجربة «${workspaceName}» بنجاح.`,
      });
      setOpenForm(null);
      setRefreshKey((value) => value + 1);
    } catch (caught) {
      setNotice({
        type: "error",
        text: caught instanceof Error ? caught.message : "تعذر تنفيذ العملية.",
      });
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = workspaces.filter(
    (workspace) =>
      workspace.subscription_status === "active" && !workspace.subscription_expired,
  ).length;
  const trialCount = workspaces.filter(
    (workspace) => workspace.subscription_status === "trialing" && workspace.can_write,
  ).length;
  const lockedCount = workspaces.filter((workspace) => !workspace.can_write).length;
  const expiringSoon = workspaces.filter(
    (workspace) =>
      workspace.subscription_status === "active" &&
      !workspace.subscription_expired &&
      workspace.subscription_ends_at !== null &&
      workspace.subscription_days_left <= 7,
  ).length;

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Provider console</span>
          <h1>إدارة اشتراكات العملاء</h1>
          <p>
            مراقبة جميع المساحات، حالات التجربة والاشتراك، وتجديد الوصول. هذه الصفحة
            تعمل عبر واجهات سيرفر محمية بحساب مزود الخدمة، ولا تفتح بيانات العملاء
            لباقي الحسابات.
          </p>
        </div>
        <button
          className="button button-ghost"
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
        >
          تحديث القائمة
        </button>
      </div>

      <div className="stat-grid admin-summary">
        <div className="stat-card">
          <span>كل المساحات</span>
          <strong>{loading ? "—" : workspaces.length}</strong>
          <small>حسابات العملاء المسجلة</small>
        </div>
        <div className="stat-card">
          <span>اشتراكات نشطة</span>
          <strong>{loading ? "—" : activeCount}</strong>
          <small>وصول كامل للكتابة</small>
        </div>
        <div className="stat-card">
          <span>تجارب نشطة</span>
          <strong>{loading ? "—" : trialCount}</strong>
          <small>داخل فترة التجربة</small>
        </div>
        <div className="stat-card">
          <span>وصول مقيد</span>
          <strong>{loading ? "—" : lockedCount}</strong>
          <small>تحتاج تجديداً أو تمديداً</small>
        </div>
        <div className="stat-card">
          <span>تنتهي خلال 7 أيام</span>
          <strong>{loading ? "—" : expiringSoon}</strong>
          <small>اشتراكات تحتاج متابعة</small>
        </div>
      </div>

      {notice ? (
        <div className={`form-${notice.type} admin-notice`} role="status">
          {notice.text}
        </div>
      ) : null}

      {loading ? <div className="empty-state">جارٍ تحميل مساحات العملاء...</div> : null}

      {!loading && error ? (
        <section className="section-card admin-warning" role="alert">
          <strong>
            {error.code === "SERVICE_ROLE_REQUIRED"
              ? "مفتاح service role غير مضاف إلى السيرفر"
              : error.code === "NOT_PLATFORM_ADMIN"
                ? "هذا الحساب ليس مدير منصة"
                : "تعذر تحميل لوحة الاشتراكات"}
          </strong>
          <p>{error.message}</p>
          {error.code === "SERVICE_ROLE_REQUIRED" ? (
            <p>
              أضف <code>SUPABASE_SERVICE_ROLE_KEY</code> إلى متغيرات بيئة Vercel (أو
              <code> .env.local</code> محلياً) ثم أعد النشر. لا تضع المفتاح في أي متغير
              يبدأ بـ <code>NEXT_PUBLIC_</code>.
            </p>
          ) : null}
          {error.code === "NOT_PLATFORM_ADMIN" ? (
            <p>
              شغّل migration <code>202610230004_platform_admin_and_subscriptions.sql</code>
              ، أو أضف بريد الحساب إلى <code>PLATFORM_ADMIN_EMAILS</code> ثم أعد تشغيل
              الخادم.
            </p>
          ) : null}
        </section>
      ) : null}

      {!loading && !error && workspaces.length === 0 ? (
        <div className="empty-state">لا توجد مساحات عملاء بعد. ستظهر هنا بعد أول تسجيل.</div>
      ) : null}

      {!loading && !error && workspaces.length > 0 ? (
        <div className="admin-grid">
          {workspaces.map((workspace) => {
            const renewFormOpen =
              openForm?.id === workspace.id && openForm.mode === "renew";
            const trialFormOpen =
              openForm?.id === workspace.id && openForm.mode === "trial";
            const isBusy = busyId === workspace.id;

            return (
              <article className="section-card admin-card" key={workspace.id}>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">{workspace.slug}</span>
                    <h2>{workspace.name}</h2>
                    <p>
                      <span dir="ltr">{workspace.owner_email ?? "بريد المالك غير متاح"}</span>
                      {workspace.owner_name ? ` · ${workspace.owner_name}` : ""}
                    </p>
                  </div>
                  <span className={`badge ${badgeClass(workspace)}`}>
                    {workspace.access_label}
                  </span>
                </div>

                <dl className="info-list">
                  <div className="info-row">
                    <dt>الخطة</dt>
                    <dd style={{ direction: "ltr" }}>
                      {planLabels[workspace.plan] ?? workspace.plan}
                    </dd>
                  </div>
                  <div className="info-row">
                    <dt>حالة الاشتراك</dt>
                    <dd style={{ direction: "ltr" }}>
                      {statusLabels[workspace.subscription_status] ??
                        workspace.subscription_status}
                    </dd>
                  </div>
                  <div className="info-row">
                    <dt>نهاية التجربة</dt>
                    <dd>{optionalDate(workspace.trial_ends_at)}</dd>
                  </div>
                  <div className="info-row">
                    <dt>نهاية الاشتراك</dt>
                    <dd>
                      {workspace.subscription_ends_at
                        ? `${optionalDate(workspace.subscription_ends_at)}${
                            workspace.subscription_status === "active" &&
                            !workspace.subscription_expired
                              ? ` · ${workspace.subscription_days_left} يوم متبقٍ`
                              : ""
                          }`
                        : "غير محدد"}
                    </dd>
                  </div>
                  <div className="info-row">
                    <dt>آخر تجديد</dt>
                    <dd>{optionalDate(workspace.last_renewed_at)}</dd>
                  </div>
                  <div className="info-row">
                    <dt>المستندات / الأعضاء</dt>
                    <dd>
                      {workspace.document_count} / {workspace.member_count}
                    </dd>
                  </div>
                  <div className="info-row">
                    <dt>تاريخ الإنشاء</dt>
                    <dd>{optionalDate(workspace.created_at)}</dd>
                  </div>
                  {workspace.billing_notes ? (
                    <div className="info-row">
                      <dt>ملاحظات</dt>
                      <dd>{workspace.billing_notes}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="admin-actions">
                  <button
                    className="button button-gold button-small"
                    type="button"
                    onClick={() => toggleForm(workspace.id, "renew")}
                    disabled={isBusy}
                  >
                    {renewFormOpen ? "إغلاق نموذج التجديد" : "تجديد الاشتراك"}
                  </button>
                  {workspace.subscription_status !== "active" ||
                  workspace.subscription_expired ? (
                    <button
                      className="button button-ghost button-small"
                      type="button"
                      onClick={() => toggleForm(workspace.id, "trial")}
                      disabled={isBusy}
                    >
                      {trialFormOpen ? "إغلاق نموذج التمديد" : "تمديد التجربة"}
                    </button>
                  ) : null}
                </div>

                {renewFormOpen ? (
                  <form
                    className="admin-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const days = Number(renewDays[workspace.id] ?? "365");
                      if (!Number.isInteger(days) || days < 1) {
                        setNotice({
                          type: "error",
                          text: "اختر مدة تجديد صحيحة.",
                        });
                        return;
                      }
                      void runAction(workspace.id, "renew", {
                        plan: renewPlans[workspace.id] ?? "professional",
                        days,
                        notes:
                          renewNotes[workspace.id] ?? workspace.billing_notes ?? "",
                      });
                    }}
                  >
                    <div className="admin-form-grid">
                      <label className="admin-field">
                        <span>الخطة</span>
                        <select
                          value={renewPlans[workspace.id] ?? "professional"}
                          onChange={(event) =>
                            setRenewPlans((current) => ({
                              ...current,
                              [workspace.id]: event.target.value,
                            }))
                          }
                          disabled={isBusy}
                        >
                          <option value="starter">Starter</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </label>
                      <label className="admin-field">
                        <span>مدة التجديد</span>
                        <select
                          value={renewDays[workspace.id] ?? "365"}
                          onChange={(event) =>
                            setRenewDays((current) => ({
                              ...current,
                              [workspace.id]: event.target.value,
                            }))
                          }
                          disabled={isBusy}
                        >
                          <option value="30">30 يوماً</option>
                          <option value="90">90 يوماً</option>
                          <option value="180">180 يوماً</option>
                          <option value="365">365 يوماً</option>
                        </select>
                      </label>
                    </div>
                    <label className="admin-field">
                      <span>ملاحظات التجديد (اختياري)</span>
                      <input
                        type="text"
                        value={renewNotes[workspace.id] ?? workspace.billing_notes ?? ""}
                        onChange={(event) =>
                          setRenewNotes((current) => ({
                            ...current,
                            [workspace.id]: event.target.value,
                          }))
                        }
                        placeholder="مثال: تجديد سنوي — تحويل بنكي"
                        disabled={isBusy}
                        maxLength={500}
                      />
                    </label>
                    <button
                      className="button button-gold button-small"
                      type="submit"
                      disabled={isBusy}
                    >
                      {isBusy ? "جارٍ التجديد..." : "تأكيد التجديد"}
                    </button>
                  </form>
                ) : null}

                {trialFormOpen ? (
                  <form
                    className="admin-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const days = Number(trialDays[workspace.id] ?? "30");
                      if (!Number.isInteger(days) || days < 1) {
                        setNotice({
                          type: "error",
                          text: "اختر مدة تمديد صحيحة.",
                        });
                        return;
                      }
                      void runAction(workspace.id, "extend_trial", { days });
                    }}
                  >
                    <div className="admin-form-grid">
                      <label className="admin-field">
                        <span>مدة التجربة</span>
                        <select
                          value={trialDays[workspace.id] ?? "30"}
                          onChange={(event) =>
                            setTrialDays((current) => ({
                              ...current,
                              [workspace.id]: event.target.value,
                            }))
                          }
                          disabled={isBusy}
                        >
                          <option value="14">14 يوماً</option>
                          <option value="30">30 يوماً</option>
                          <option value="60">60 يوماً</option>
                          <option value="90">90 يوماً</option>
                        </select>
                      </label>
                    </div>
                    <button
                      className="button button-ghost button-small"
                      type="submit"
                      disabled={isBusy}
                    >
                      {isBusy ? "جارٍ التمديد..." : "تأكيد تمديد التجربة"}
                    </button>
                  </form>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
