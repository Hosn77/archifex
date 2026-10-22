import type { Metadata } from "next";
import Link from "next/link";
import { AdminDashboard } from "@/components/AdminDashboard";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "إدارة الاشتراكات",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const allowed = await isPlatformAdmin(supabase, user);

  if (!allowed) {
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">Provider console</span>
            <h1>إدارة الاشتراكات</h1>
            <p>هذه الصفحة مخصصة لحساب مزود الخدمة فقط.</p>
          </div>
        </div>

        <section className="section-card admin-warning">
          <strong>لا يملك هذا الحساب صلاحية مزود الخدمة</strong>
          <p>
            شغّل migration <code>202610230004_platform_admin_and_subscriptions.sql</code>
            ، أو أضف بريد الحساب إلى متغير <code>PLATFORM_ADMIN_EMAILS</code> في بيئة
            السيرفر. لا تفتح صلاحيات القراءة العابرة للمساحات لأي حساب عادي.
          </p>
          <Link className="button button-ghost button-small" href="/dashboard">
            العودة إلى لوحة التحكم
          </Link>
        </section>
      </>
    );
  }

  return <AdminDashboard />;
}
