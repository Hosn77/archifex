import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "@/components/Brand";
import { LogoutButton } from "@/components/LogoutButton";
import { SetupNotice } from "@/components/SetupNotice";
import { SidebarNav } from "@/components/SidebarNav";
import { SiteFooter } from "@/components/SiteFooter";
import { TrialBanner } from "@/components/TrialBanner";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getTrialState } from "@/lib/trial";
import type { WorkspaceRole } from "@/lib/types";
import { getCurrentWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const roleLabels: Record<WorkspaceRole, string> = {
  owner: "مالك المساحة",
  admin: "مدير",
  editor: "محرر",
  viewer: "قارئ",
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const supabase = await createClient();
  if (!supabase) return <SetupNotice />;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  const current = await getCurrentWorkspace(supabase);

  if (!current) {
    return (
      <SetupNotice
        title="لم يتم العثور على مساحة عمل"
        description="تم تسجيل الدخول، لكن لا توجد عضوية مساحة عمل مرتبطة بهذا الحساب. تحقق من تشغيل migration إنشاء المساحة التلقائي في Supabase، أو أنشئ مساحة عبر دالة create_workspace."
        code={"select public.create_workspace('اسم المؤسسة');"}
      />
    );
  }

  const trial = getTrialState(current.workspace);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-card">
          <span className="workspace-card-label">مساحة العمل الحالية</span>
          <strong title={current.workspace.name}>{current.workspace.name}</strong>
          <small>{roleLabels[current.membership.role]}</small>
        </div>

        <SidebarNav />

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong title={current.user.email ?? ""}>{current.user.email}</strong>
            <span>{current.workspace.slug}</span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <span className="app-topbar-note">
            Archifex <span>|</span> Document Archiving System <strong>Powered by MadarFalak</strong>
          </span>
          <span
            className={`badge ${
              trial.isActiveSubscription ? "badge-success" : trial.canWrite ? "" : "badge-danger"
            }`}
          >
            {trial.label}
          </span>
        </header>

        <main className="app-content">
          <TrialBanner trial={trial} />
          {children}
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
