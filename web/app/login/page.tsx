import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { CompanyBar } from "@/components/CompanyBar";
import { LoginForm } from "@/components/LoginForm";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "ادخل إلى مساحة أرشيف مؤسستك في Archifex من شركة مَدار فَلَك.",
};

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : "/dashboard";

  return (
    <>
      <CompanyBar />
      <main className="auth-page">
        <aside className="auth-aside">
          <div>
            <Brand />
            <div className="auth-aside-copy" style={{ marginTop: "clamp(42px, 8vh, 90px)" }}>
              <span className="eyebrow">أنظمة وحلول برمجية في مدار واحد</span>
              <h2>مساحة أرشيف واحدة، بحدود أمان لا تتجاوزها البيانات.</h2>
              <p>
                Archifex يمنح كل مؤسسة مساحة عمل معزولة، تجربة مجانية 30 يوماً،
                ولوحة تحكم عربية مصممة للعمل اليومي مع الأرشيف والملفات.
              </p>
              <ul className="auth-points">
                <li>عزل كامل عبر workspace_id وسياسات RLS.</li>
                <li>تجربة 30 يوماً تبدأ تلقائياً عند التسجيل.</li>
                <li>بعد التجربة: قراءة متاحة، وكتابة تتطلب اشتراكاً.</li>
                <li>سجل تدقيق لكل عملية على المستندات.</li>
              </ul>
            </div>
          </div>
          <p style={{ position: "relative", zIndex: 1, margin: 0, color: "#64748b", fontSize: 10 }}>
            مَدار فَلَك | MadarFalak — Software Systems and Solutions in One Orbit
          </p>
        </aside>

        <section className="auth-main">
          <div style={{ width: "100%" }}>
            <div className="auth-brand-mobile">
              <Brand />
              <Link href="/" style={{ color: "#94a3b8", fontSize: 11 }}>
                العودة إلى الصفحة الرئيسية
              </Link>
            </div>
            <LoginForm nextPath={nextPath} />
            <p style={{ margin: "22px 0 0", textAlign: "center", color: "#64748b", fontSize: 10 }}>
              <Link href="/" style={{ color: "#94a3b8" }}>
                ← العودة إلى Archifex
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
