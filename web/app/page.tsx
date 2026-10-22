import Link from "next/link";
import { Brand } from "@/components/Brand";
import { CompanyBar } from "@/components/CompanyBar";
import { SiteFooter } from "@/components/SiteFooter";

const features = [
  {
    index: "01",
    title: "مساحة معزولة لكل مؤسسة",
    body: "كل عميل يحصل على مساحة عمل مستقلة. كل سجل في قاعدة البيانات مرتبط بـ workspace_id، وسياسات RLS تمنع أي استعلام من عبور حدود المؤسسة.",
  },
  {
    index: "02",
    title: "تجربة مجانية 30 يوماً",
    body: "تبدأ التجربة تلقائياً لحظة التسجيل. خلالها تحصل على الرفع والفهرسة والتنظيم والقراءة، ثم تبقى القراءة متاحة بعد انتهائها.",
  },
  {
    index: "03",
    title: "إدارة صلاحيات دقيقة",
    body: "أدوار Owner وAdmin وEditor وViewer داخل كل مساحة. الكتابة تتطلب دوراً مناسباً واشتراكاً نشطاً أو تجربة سارية.",
  },
  {
    index: "04",
    title: "فهرسة وتصنيف مرن",
    body: "تصنيفات ومستندات وسجلات أرشفة مرتبطة بالمساحة نفسها، مع حماية على مستوى الصفوف وفحص سلامة العلاقات بين المستندات والتصنيفات.",
  },
  {
    index: "05",
    title: "سجل تدقيق واضح",
    body: "كل إنشاء أو تعديل أو حذف لمستند يُسجّل تلقائياً في audit_logs مع المساحة والمستخدم والوقت، لتتبع التغييرات بثقة.",
  },
  {
    index: "06",
    title: "تصميم عربي/إنجليزي",
    body: "واجهة RTL أصلية بخطوط عربية حديثة، مع لمسات نحاسية وفضية فوق كحلي عميق، تعكس هوية مَدار فَلَك المؤسسية.",
  },
];

export default function LandingPage() {
  return (
    <main className="landing">
      <CompanyBar />

      <nav className="landing-nav" aria-label="التنقل الرئيسي">
        <Brand />
        <div className="landing-links">
          <a href="#platform">المنصة</a>
          <a href="#trial">التجربة</a>
          <a href="#security">الأمان</a>
        </div>
        <div className="landing-actions">
          <Link className="button button-ghost button-small" href="/login">
            دخول العملاء
          </Link>
          <Link className="button button-gold button-small" href="/login">
            ابدأ التجربة
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div>
          <span className="eyebrow">Archifex SaaS · Powered by MadarFalak</span>
          <h1>
            أرشيف مؤسستك،
            <br />
            في <span className="gold">مدار واحد</span>.
          </h1>
          <p>
            نظام سحابي لإدارة الأرشيف والملفات، مبني ليكون مساحة عمل معزولة لكل مؤسسة.
            ملفاتك، تصنيفاتك، وسجلاتك محمية بسياسات RLS، مع تجربة مجانية 30 يوماً تبدأ فور التسجيل.
          </p>
          <div className="hero-actions">
            <Link className="button button-gold" href="/login">
              أنشئ مساحة مؤسستك
            </Link>
            <a className="button button-ghost" href="#platform">
              استكشف المنصة
            </a>
          </div>
          <div className="hero-note">
            <span>عزل كامل للبيانات</span>
            <span>تجربة 30 يوماً</span>
            <span>قراءة دائمة بعد التجربة</span>
          </div>
        </div>

        <div className="hero-panel" aria-label="رسم توضيحي لمدار Archifex">
          <div className="orbit-visual">
            <div className="orbit-ring orbit-ring-two" />
            <div className="orbit-ring orbit-ring-one" />
            <div className="orbit-satellite" />
            <div className="orbit-core">ARCHIFEX</div>
          </div>
          <div className="panel-stats">
            <div className="panel-stat">
              <span>Tenant model</span>
              <strong>Workspace ID</strong>
            </div>
            <div className="panel-stat">
              <span>Write guard</span>
              <strong>RLS + Trial</strong>
            </div>
            <div className="panel-stat">
              <span>Parent company</span>
              <strong>MadarFalak</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="platform">
        <div className="section-intro">
          <span className="eyebrow">منصة واحدة · حدود واضحة</span>
          <h2>بنية SaaS مصممة للمؤسسات، لا للاستخدام العابر.</h2>
          <p>
            Archifex لا يخلط بيانات العملاء. كل مساحة عمل تحمل هويتها واشتراكها وتجربتها
            وسجل تدقيقها، وكل قراءة أو كتابة تمر عبر سياسات أمان معلنة في قاعدة البيانات.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.index}>
              <span className="feature-icon">{feature.index}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="trial">
        <div className="trust-strip">
          <div>
            <strong>30 يوماً كاملة، ثم قراءة بلا انقطاع.</strong>
            <p>
              عند انتهاء التجربة دون اشتراك، تبقى المستندات والتصنيفات قابلة للعرض،
              بينما يُقيد الرفع وتعديل البيانات مع دعوة واضحة للترقية.
            </p>
          </div>
          <Link className="button button-gold button-small" href="/login">
            ابدأ مساحتك الآن
          </Link>
        </div>
      </section>

      <section className="section" id="security">
        <div className="section-intro">
          <span className="eyebrow">Security by design</span>
          <h2>الأمان في قاعدة البيانات، لا في الواجهة فقط.</h2>
          <p>
            حتى لو تجاوز عميل واجهة التطبيق، فإن RLS تتحقق من عضويته في المساحة وحالته
            الاشتراكية عند كل محاولة كتابة. مسؤولية العزل لا تعتمد على انتباه المطوّر.
          </p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-icon">RLS</span>
            <h3>Row-Level Security</h3>
            <p>سياسات SELECT وINSERT وUPDATE وDELETE لكل جدول، مبنية على عضوية المساحة والدور.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon">30D</span>
            <h3>Trial guard</h3>
            <p>دالة workspace_can_write تسمح بالكتابة فقط لاشتراك نشط أو تجربة سارية، وتُستخدم داخل السياسات وAPI.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon">AUD</span>
            <h3>Audit trail</h3>
            <p>تسجيل تلقائي لعمليات المستندات في audit_logs مع المساحة والمستخدم ونوع العملية.</p>
          </article>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
