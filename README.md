# أرشيفكس / Archifex

**الأرشيف الذي يفكّر** · *The archive that thinks*

حزمة تصميم متكاملة لنظام أرشفة وإدارة مستندات ذكي، ثنائي اللغة (عربي/إنجليزي)، يخدم المؤسسات التعليمية والشركات: OCR عربي وإنجليزي، بحث دلالي ولغوي، استخراج بيانات بالذكاء الاصطناعي، صلاحيات دقيقة، سجل تدقيق، سير عمل وتوقيع رقمي.

> **الحالة:** عرض تصميمي (Design Package) — النموذج التفاعلي واجهة أمامية فقط ببيانات وهمية، وليس نظاماً إنتاجياً.

## 🔗 الموقع المباشر

| الوجهة | الرابط |
|---|---|
| الصفحة التعريفية | **https://archifex.netlify.app/** |
| النموذج التفاعلي | **https://archifex.netlify.app/prototype/** |
| مركز الوثائق | **https://archifex.netlify.app/docs/** |
| المعمارية | https://archifex.netlify.app/docs/architecture |
| قاعدة البيانات | https://archifex.netlify.app/docs/database |
| الهوية والواجهة | https://archifex.netlify.app/docs/brand |
| خارطة MVP | https://archifex.netlify.app/docs/roadmap |

الموقع مستضاف على Netlify (خطة Free) من مجلد `archifex/` مباشرة، دون خطوة بناء. إعدادات الـ redirects والـ headers والـ CSP في [`netlify.toml`](./netlify.toml).

## 📦 مستودع GitHub

**https://github.com/Hosn77/archifex**

المستودع خاص (Private) حالياً. لربط Netlify به بدلاً من النشر اليدوي:

1. افتح Site configuration → Build & deploy → Link repository.
2. اختر المستودع `Hosn77/archifex` والفرع `main`.
3. اترك Build command فارغاً، واجعل Publish directory = `.`.
4. أبقِ إعدادات `netlify.toml` كما هي.

---

## المحتويات

| الملف | الوصف |
|---|---|
| [`index.html`](./index.html) | الصفحة التعريفية العامة (عربي/إنجليزي، داكن/فاتح) |
| [`docs/index.html`](./docs/index.html) | مركز الوثائق المنسّق على Netlify |
| [`docs/reader.html`](./docs/reader.html) | عارض Markdown مع فهرس، Mermaid، ونسخ الكود |
| [`docs/01-architecture.md`](./docs/01-architecture.md) | المعمارية، حزمة التقنيات، خط أنابيب OCR/AI، البحث، الأمان، التعدد المستأجر، النشر، المخاطر |
| [`docs/02-database-schema.md`](./docs/02-database-schema.md) | تصميم قاعدة البيانات، ERD، القرارات، RLS، الفهارس، الاحتفاظ، أمثلة استعلامات |
| [`docs/03-ui-brand-wireframe.md`](./docs/03-ui-brand-wireframe.md) | التسمية، الشعار، الألوان، الطباعة، المخططات السلكية، المكونات، RTL، الوصول |
| [`docs/04-mvp-roadmap.md`](./docs/04-mvp-roadmap.md) | المراحل، الجدول الزمني، الفريق، الميزانية، التسعير، KPIs، التجربة، المخاطر |
| [`db/schema.sql`](./db/schema.sql) | DDL كامل لـ PostgreSQL 16 مع Enums وRLS وPartitions |
| [`prototype/`](./prototype/) | لوحة تحكم تفاعلية (HTML/CSS/JS، بلا خطوة بناء) |
| [`assets/logo-mark.svg`](./assets/logo-mark.svg) | شعار العلامة (SVG) |
| [`assets/favicon.svg`](./assets/favicon.svg) | أيقونة الموقع |

---

## تشغيل الموقع محلياً

لا يحتاج تثبيت أي حزمة. اختر إحدى الطريقتين:

### 1) خادم محلي (مُوصى به)

```powershell
cd archifex
python -m http.server 8766
```

ثم افتح:

```
http://127.0.0.1:8766/            # الصفحة التعريفية
http://127.0.0.1:8766/prototype/  # النموذج التفاعلي
http://127.0.0.1:8766/docs/       # مركز الوثائق
```

أو من جذر المشروع:

```powershell
python -m http.server 8766 --directory archifex
```

> **ملاحظة:** عارض الوثائق يستخدم `fetch` لقراءة ملفات Markdown؛ لذلك يحتاج خادماً محلياً (أو Netlify). فتح `docs/reader.html` عبر `file://` سيعرض رسالة خطأ مع رابط الملف الخام.

### 2) فتح مباشر

افتح `archifex/index.html` أو `archifex/prototype/index.html` في المتصفح. يعمل عبر `file://`، لكن الخطوط (IBM Plex Sans Arabic / Inter) تحتاج اتصالاً بالإنترنت؛ توجد بدائل نظام تلقائية.

---

## ما الذي يعمل في النموذج؟

- **تبديل اللغة:** عربي ⇄ إنجليزي مع RTL/LTR فوري وحفظ التفضيل.
- **تبديل الثيم:** داكن ⇄ فاتح، يُطبَّق قبل أول رسم لمنع الوميض.
- **تبديل القطاع:** بيانات تعليمية (جامعة النور) ⇄ مؤسسية (شركة أفق).
- **لوحة تحكم:** مؤشرات، رسم نشاط (7 أيام/30 يوماً/12 شهراً)، مساعد أرشيف AI، جدول مستندات بتبويبات وبحث، مهام توقيع، سجل نشاط، توزيع تصنيفات.
- **درج المستند:** معاينة ورقية، حقول مستخرجة بنسب ثقة، بيانات وصفية، نص OCR، سجل تدقيق.
- **رفع مستند:** سحب وإفلات، قائمة ملفات، تصنيف وسرية، خيارات OCR/AI، تقدم محاكى وإضافة صف جديد.
- **لوحة أوامر:** `Ctrl/Cmd + K` أو `/`، تنقل بالأسهم، Enter للفتح.
- **إشعارات، Toasts، شريط جانبي متجاوب، جوال 390px.**

### روابط عرض عميقة (لل demos واللقطات)

| الرابط | النتيجة |
|---|---|
| `?lang=ar` أو `?lang=en` | فرض اللغة |
| `?theme=dark` أو `?theme=light` | فرض الثيم |
| `?sector=edu` أو `?sector=corp` | فرض القطاع |
| `?demo=drawer&doc=edu-1` | فتح درج مستند |
| `?demo=upload` | فتح نافذة الرفع |
| `?demo=palette` | فتح لوحة الأوامر |
| `?demo=sidebar` | فتح الشريط الجانبي |

مثال:

```
http://127.0.0.1:8766/prototype/?lang=en&theme=light&sector=corp&demo=drawer
```

### اختصارات

| الاختصار | الوظيفة |
|---|---|
| `Ctrl/Cmd + K` | لوحة الأوامر |
| `/` | بحث سريع (خارج الحقول) |
| `↑` / `↓` | تنقل |
| `Enter` | فتح |
| `Esc` | إغلاق الطبقة العلوية |

---

## الهيكل

```
archifex/
├─ index.html                 # الصفحة التعريفية
├─ 404.html                   # صفحة الخطأ
├─ netlify.toml               # Publish + Redirects + Headers + CSP
├─ robots.txt / sitemap.xml   # SEO
├─ site.webmanifest           # بيانات PWA
├─ README.md
├─ assets/
│  ├─ logo-mark.svg           # الشعار
│  ├─ favicon.svg             # الأيقونة
│  ├─ site.css / site.js      # تصميم وسلوك الموقع التعريفي
│  ├─ dashboard-*.png         # لقطات النموذج (عربي/إنجليزي × داكن/فاتح)
│  ├─ og-cover.png            # صورة المشاركة 1200×630
│  └─ icon-192.png / icon-512.png
├─ db/
│  └─ schema.sql              # PostgreSQL 16 DDL
├─ docs/
│  ├─ index.html              # مركز الوثائق
│  ├─ reader.html             # عارض Markdown
│  ├─ docs.css / docs.js      # تنسيق وسلوك الوثائق
│  ├─ reader.js               # التحميل، الفهرس، Mermaid، نسخ الكود
│  ├─ 01-architecture.md
│  ├─ 02-database-schema.md
│  ├─ 03-ui-brand-wireframe.md
│  └─ 04-mvp-roadmap.md
└─ prototype/
   ├─ index.html              # البنية + SVG sprite + الحوارات
   ├─ styles.css              # نظام التصميم + الثيمات + RTL + الاستجابة
   ├─ app.js                  # الترجمات + البيانات + التفاعل
   └─ preview-mobile.html     # أداة عرض 390px (اختيارية)
```

---

## ملخص القرارات التقنية

| الطبقة | الاختيار |
|---|---|
| الواجهة | Next.js 15 / React 19 / TypeScript / Tailwind + shadcn |
| الخادم | NestJS Modular Monolith + Worker منفصل |
| قاعدة البيانات | PostgreSQL 16 + RLS + pgvector + pg_trgm |
| البحث | Postgres FTS + Trigram + متجهات، ثم OpenSearch عند التوسع |
| التخزين | S3-compatible + Presigned URLs + Object Lock |
| الطوابير | Redis + BullMQ |
| الهوية | Keycloak / OIDC / SAML + MFA |
| OCR | Tesseract 5 (ara+eng) + خيار PaddleOCR/Surya أو سحابي |
| الاستخراج | LLM عبر Adapter + JSON Schema + قواعد مساندة |
| التوقيع | داخلي + Documenso |
| النشر | Docker + Kubernetes (أو ECS) |
| المراقبة | OpenTelemetry + Grafana/Loki/Tempo + Sentry |

**التعدد:** Shared schema + RLS افتراضياً، مع خيار Schema/DB مخصص للعملاء الكبار.
**اللغة:** أعمدة `*_ar` / `*_en`، وتطبيع عربي للبحث فقط، والعرض يحفظ النص الأصلي.

---

## تطبيق مخطط قاعدة البيانات

المتطلبات: PostgreSQL 16 + الإضافات `pgcrypto`, `citext`, `pg_trgm`, `vector` (pgvector ≥ 0.7), `ltree`.

```bash
createdb archifex
psql -d archifex -f db/schema.sql
```

ثم أنشئ المستأجر الأول، الأدوار، والمستخدم:

```sql
INSERT INTO tenants (slug, name_ar, name_en, kind)
VALUES ('nour-university', 'جامعة النور', 'Al Noor University', 'education')
RETURNING id;

SELECT create_default_roles('<tenant-uuid>');
```

> **مهم:** RLS مفعّل بـ `FORCE`. دور التطبيق يجب أن يكون غير مالك وغير `BYPASSRLS`، ويضبط `SET LOCAL app.tenant_id` و`app.user_id` في كل معاملة. راجع [`docs/02-database-schema.md`](./docs/02-database-schema.md) §5.

---

## الهوية البصرية سريعاً

| | |
|---|---|
| الخلفية | `#17171C` |
| الشريط الجانبي | `#121212` |
| البطاقات | `#1E1E24` |
| السطح المرتفع | `#2A2A32` |
| الفضي | `#D9DCE3` |
| النص | `#F4F5F7` |
| النص المساعد | `#A0A2AC` |
| العربية | IBM Plex Sans Arabic |
| الإنجليزية | Inter |
| الأرقام | JetBrains Mono |

الشعار: مجلد معدني + ورقة مستند + شرارة AI. المساحة الآمنة 25%، والحد الأدنى 24px رقمياً.

---

## خطة MVP في سطر

24 أسبوعاً · 10 أشخاص · 6 أنواع مستندات · 3 عملاء تجريبيين · ميزانية 1.9–2.7 مليون ريال · إطلاق بعد اجتياز بوابة الأمن والأداء وNPS ≥ 40.

---

## النشر على Netlify

الموقع منشور حالياً على **https://archifex.netlify.app/** (آخر نشر: 21 أكتوبر 2026، HTTPS مفعّل).

لإعادة النشر يدوياً من جهازك (يتطلب تسجيل الدخول إلى Netlify):

```powershell
cd archifex
netlify deploy --site archifex --dir . --prod --no-build
```

- `publish = "."` في `netlify.toml`، لأن الحزمة كلها ملفات ثابتة.
- التحويلات النظيفة: `/docs/architecture` → عارض الوثيقة، وهكذا لبقية الوثائق.
- Security headers + CSP مضبوطة في `netlify.toml`.
- يمكن ربط المستودع بـ Netlify لاحقاً لتفعيل النشر التلقائي؛ لا توجد حاجة لخطوة build.

لاختبار إعدادات Netlify محلياً (اختياري):

```powershell
netlify dev
```

## حدود النموذج

- لا خادم، لا قاعدة بيانات، لا مصادقة حقيقية.
- الرفع والبحث والمعالجة محاكاة أو محلية.
- البيانات أسماء وأرقام وهمية.
- الخطوط من Google Fonts (تحتاج إنترنت).
- عارض الوثائق يحمّل `marked` و`mermaid` من jsDelivr؛ يمكن استبدالهما بملفات محلية عند العمل دون إنترنت.
- `db/schema.sql` لم يُشغَّل بعد على نسخة PostgreSQL 16 حية في هذه البيئة (لا يتوفر Docker/PostgreSQL محلياً).
- النموذج مرجع بصري/تفاعلي، وليس كود إنتاج.

## الخطوات التالية المقترحة

1. ربط نطاق مخصص (مثلاً `archifex.sa`) — HTTPS على نطاق `netlify.app` مفعّل بالفعل.
2. تحويل التوكنات إلى `tailwind.config.ts` + مكتبة مكونات (Storybook).
3. إنشاء Monorepo (Turborepo) وتطبيق NestJS + Prisma مع migrations.
4. تنفيذ RLS واختبارات العزل في CI.
5. بناء pipeline OCR على عيّنات حقيقية وقياس الدقة.
6. اختبار تجريبي مع جامعتين وشركة.

---

© 2026 — حزمة تصميم مقترحة. جميع الأسماء والبيانات في النموذج لأغراض العرض فقط.
