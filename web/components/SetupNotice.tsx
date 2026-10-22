import { CompanyBar } from "@/components/CompanyBar";
import { SiteFooter } from "@/components/SiteFooter";

interface SetupNoticeProps {
  title?: string;
  description?: string;
  code?: string;
}

export function SetupNotice({
  title = "اربط مشروع Supabase لبدء التشغيل",
  description = "هذه النسخة جاهزة للبناء والعرض، لكن بيانات العملاء تحتاج مشروع Supabase ومتغيرات البيئة. أضف المتغيرات في Vercel أو في web/.env.local ثم أعد التشغيل.",
  code = "NEXT_PUBLIC_SUPABASE_URL=...\nNEXT_PUBLIC_SUPABASE_ANON_KEY=...\nSUPABASE_SERVICE_ROLE_KEY=...",
}: SetupNoticeProps) {
  return (
    <>
      <CompanyBar />
      <main>
        <div className="setup-card">
          <span className="eyebrow">Archifex setup</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <pre className="setup-code">{code}</pre>
          <p style={{ marginBottom: 0 }}>
            راجع <strong>web/README.md</strong> لخطوات تشغيل migrations وربط Vercel.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
