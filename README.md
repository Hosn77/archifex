# Archifex | نظام إدارة الأرشيف والملفات

**من شركة مَدار فَلَك | MadarFalak**

> **مَدار فَلَك** — أنظمة وحلول برمجية في مدار واحد  
> **MadarFalak** — Software Systems and Solutions in One Orbit

Archifex هو نظام سحابي لإدارة الأرشيف والملفات، مبني حول مساحات عمل معزولة لكل مؤسسة، مع تجربة مجانية 30 يوماً، وحماية على مستوى الصفوف (RLS)، وواجهة عربية/إنجليزية بهوية مَدار فَلَك.

---

## حالة المشروع

يحتوي المستودع على طبقتين:

| الطبقة | المسار | الحالة |
|---|---|---|
| الموقع التعريفي والنموذج التفاعلي | جذر المستودع (`index.html`, `prototype/`, `docs/`) | demo ثابت منشور على Netlify |
| تطبيق SaaS الإنتاجي | [`web/`](./web/) | Next.js 15 + React 19 + Supabase، جاهز للربط والنشر |

الموقع الثابت الحالي هو عرض تصميمي/تفاعلي ببيانات وهمية. تطبيق `web/` هو الأساس الإنتاجي للمصادقة، تعدد المستأجرين، التجربة، وسياسات RLS.

---

## الروابط

| الوجهة | الرابط |
|---|---|
| المستودع (عام) | **https://github.com/Hosn77/archifex** |
| الموقع الثابت | **https://archifex.netlify.app/** |
| النموذج التفاعلي | **https://archifex.netlify.app/prototype/** |
| مركز الوثائق | **https://archifex.netlify.app/docs/** |

> تطبيق Vercel سيُنشأ من نفس المستودع مع **Root Directory = `web`**. راجع قسم النشر أدناه.

---

## الهوية والعلامة

- **الشركة الأم:** مَدار فَلَك | MadarFalak
- **المنتج:** Archifex
- **العنوان:** `Archifex | نظام إدارة الأرشيف والملفات - من شركة مَدار فَلَك`
- **شريط العلامة:** `Archifex | Document Archiving System Powered by MadarFalak`
- **التذييل:** `Developed & Powered by MadarFalak Software Solutions — جميع الحقوق محفوظة لشركة مَدار فَلَك`
- **الشعار النصي:** «أنظمة وحلول برمجية في مدار واحد» / “Software Systems and Solutions in One Orbit”

### لوحة الألوان

| الاستخدام | اللون |
|---|---|
| كحلي عميق | `#0F172A` |
| كحلي مرتفع | `#1E293B` |
| فضي معدني | `#E2E8F0` |
| نحاسي / ذهبي وردي | `#E0A96D` |

الخطوط: **IBM Plex Sans Arabic** للعربية و**Inter** للإنجليزية، مع دعم RTL أصلي.

---

## بنية تطبيق SaaS في `web/`

```
web/
├─ app/
│  ├─ page.tsx                     # الصفحة التعريفية الجديدة
│  ├─ login/page.tsx               # تسجيل الدخول / إنشاء مساحة
│  ├─ (app)/layout.tsx             # هيكل المساحة المحمية + تذييل العلامة
│  ├─ (app)/dashboard/page.tsx     # لوحة التحكم
│  ├─ (app)/documents/page.tsx     # سجل المستندات
│  ├─ (app)/settings/page.tsx      # التجربة والاشتراك والعزل
│  └─ api/
│     ├─ trial/status/route.ts     # حالة التجربة/الكتابة
│     └─ documents/route.ts        # GET/POST مع فحص RLS والتجربة
│        documents/[id]/route.ts   # PATCH/DELETE مع نفس الفحص
├─ components/                     # Brand, TrialBanner, LoginForm, ...
├─ lib/
│  ├─ supabase/server.ts           # Supabase SSR client
│  ├─ supabase/client.ts           # Supabase browser client
│  ├─ workspace.ts                 # المساحة الحالية وRLS
│  └─ trial.ts                     # حساب canWrite / أيام التجربة
├─ middleware.ts                   # حماية المسارات وتحديث الجلسة
├─ supabase/migrations/            # مخطط + RLS + Storage
└─ .env.example
```

### 1) تعدد المستأجرين

كل جدول أعمال يحمل `workspace_id`:

- `workspaces`
- `workspace_members`
- `categories`
- `documents`
- `archive_records`
- `audit_logs`

كل استعلام في التطبيق يفلتر بـ `workspace_id`، لكن **الضمان النهائي في قاعدة البيانات**: سياسات RLS تتحقق من العضوية عبر `is_workspace_member(workspace_id)`، ولا يمكن قراءة صفوف مساحة أخرى حتى بمعرفة المعرّف.

### 2) التجربة المجانية 30 يوماً

عند تسجيل مستخدم جديد، trigger على `auth.users` ينشئ تلقائياً:

1. `profiles`
2. `workspaces` مع `trial_start_date = now()` و`trial_ends_at = now() + interval '30 days'`
3. `workspace_members` بدور `owner`
4. تصنيفاً افتراضياً «عام»

دالة `workspace_can_write(workspace_id)` تسمح بالكتابة عندما:

```sql
subscription_status = 'active'
OR (subscription_status = 'trialing' AND now() <= trial_ends_at)
```

مع دور `owner` أو `admin` أو `editor`. بعد انتهاء التجربة دون اشتراك:

- **القراءة تبقى متاحة** (سياسات SELECT لا تعتمد على التجربة).
- **INSERT / UPDATE / DELETE مرفوضة** على المستندات والتصنيفات والسجلات.
- واجهة `TrialBanner` تعرض دعوة ترقية، وAPI يعيد `402` مع `TRIAL_OR_SUBSCRIPTION_REQUIRED`.

### 3) حماية إضافية

- `protect_workspace_billing_fields` يمنع المتصفح من تعديل `trial_ends_at` أو `subscription_status` أو `plan` أو `owner_id`.
- `ensure_document_tenant_consistency` يمنع نقل مستند بين مساحات، ويمنع ربط تصنيف من مساحة أخرى.
- `ensure_archive_record_tenant_consistency` يمنع ربط سجل أرشفة بمستند من مساحة أخرى.
- `prevent_tenant_move` يمنع نقل التصنيفات وسجلات الأرشفة بين المساحات.
- `workspace_owner_id` + سياسات العضوية تمنع `admin` من ترقية نفسه إلى `owner` أو تعديل عضوية المالك.
- سجل التدقيق يُكتب فقط من Triggers بصلاحية definer؛ لا يمكن للعميل تزوير صفوف `audit_logs`.
- `audit_logs` يسجّل عمليات المستندات تلقائياً.
- Storage bucket `archifex-documents` خاص، ومساره `workspace_id/document_id/file`، وسياساته تتحقق من العضوية وحق الكتابة.
- `middleware.ts` يحمي `/dashboard` و`/documents` و`/settings` ويعيد الجلسة عبر cookies.

---

## تشغيل الموقع الثابت محلياً

لا يحتاج تثبيت حزم:

```powershell
cd archifex
python -m http.server 8766
```

ثم:

```
http://127.0.0.1:8766/            # الصفحة التعريفية
http://127.0.0.1:8766/prototype/  # النموذج التفاعلي
http://127.0.0.1:8766/docs/       # مركز الوثائق
```

---

## تشغيل تطبيق SaaS محلياً

### المتطلبات

- Node.js 20+ (تم البناء بـ Node 22/24)
- مشروع Supabase
- Supabase CLI (اختياري لكن مُوصى به)

### 1) تثبيت الحزم

```powershell
cd archifex/web
npm install
```

### 2) إنشاء مشروع Supabase

1. أنشئ مشروعاً جديداً من لوحة Supabase.
2. من **Project Settings → API** انسخ:
   - Project URL
   - `anon` public key
   - `service_role` key (للسيرفر فقط)

### 3) تطبيق migrations

الملفات:

| الملف | المحتوى |
|---|---|
| [`web/supabase/migrations/202610210001_archifex_schema.sql`](./web/supabase/migrations/202610210001_archifex_schema.sql) | الجداول، الفهارس، Triggers، إنشاء المساحة عند التسجيل |
| [`web/supabase/migrations/202610210002_archifex_rls_and_trial.sql`](./web/supabase/migrations/202610210002_archifex_rls_and_trial.sql) | دوال العضوية والتجربة، RLS، `create_workspace` |
| [`web/supabase/migrations/202610210003_archifex_storage.sql`](./web/supabase/migrations/202610210003_archifex_storage.sql) | Bucket وسياسات Storage |

باستخدام Supabase CLI من مجلد `web`:

```powershell
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

أو نفّذ الملفات بالترتيب من **Supabase Dashboard → SQL Editor**.

> **مهم:** migrations لم تُنفَّذ بعد على مشروع Supabase حي في هذه البيئة لعدم توفر بيانات الاعتماد. نفّذها ثم اختبر التسجيل فعلياً.

### 4) متغيرات البيئة

```powershell
cd archifex/web
Copy-Item .env.example .env.local
```

املأ:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

لا تضع `SUPABASE_SERVICE_ROLE_KEY` في أي متغير يبدأ بـ `NEXT_PUBLIC_`، ولا تستخدمه في مكوّن عميل.

### 5) تشغيل التطبيق

```powershell
npm run dev
```

افتح `http://localhost:3000`. أنشئ حساباً جديداً من `/login`؛ سيبدأ trigger مساحة العمل والتجربة تلقائياً.

### 6) التحقق من البناء

```powershell
npm run typecheck
npm run build
```

---

## اختبار التجربة وRLS

### محاكاة انتهاء التجربة

من SQL Editor، بعد إنشاء مساحة:

```sql
update public.workspaces
set trial_start_date = now() - interval '31 days',
    trial_ends_at = now() - interval '1 day',
    subscription_status = 'trialing'
where slug = 'YOUR_WORKSPACE_SLUG';
```

ثم:

- `/dashboard` يعرض «انتهت التجربة».
- `/api/trial/status` يعيد `can_write: false`.
- `POST /api/documents` يعيد `402`.
- إدخال مباشر في `documents` من عميل authenticated يُرفض بواسطة RLS.
- القراءة تبقى متاحة.

### تفعيل اشتراك

```sql
update public.workspaces
set subscription_status = 'active',
    plan = 'professional'
where slug = 'YOUR_WORKSPACE_SLUG';
```

تغيير الحقول المحمية يجب أن يتم عبر `service_role` أو SQL Editor، وليس من المتصفح.

### اختبار العزل

1. أنشئ حسابين في مؤسستين مختلفتين.
2. أضف مستنداً في كل مساحة.
3. استخدم API للقراءة من الحساب الأول؛ يجب ألا يظهر مستند الحساب الثاني.
4. جرّب تمرير `workspace_id` الآخر في `POST /api/documents`؛ RLS ترفض.

---

## النشر على Vercel

المستودع عام وجاهز للنشر. الموقع الثابت يبقى على Netlify من جذر المستودع، بينما تطبيق Next.js في `web/`.

1. افتح Vercel → **Add New → Project**.
2. اختر مستودع `Hosn77/archifex`.
3. اضبط **Root Directory** على `web`.
4. Framework Preset: **Next.js**.
5. أضف متغيرات البيئة:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = رابط الإنتاج
6. Deploy.

كل push إلى `main` ينشئ Production Deployment، وكل PR/فرع ينشئ Preview Deployment.

> لا تضع `netlify.toml` أو ملفات الموقع الثابت داخل `web/`. إعداد Root Directory = `web` يفصل النشرين.

---

## الموقع الثابت والنموذج

### ما يعمل في النموذج؟

- تبديل اللغة عربي ⇄ إنجليزي مع RTL/LTR وحفظ التفضيل.
- تبديل الثيم داكن ⇄ فاتح.
- تبديل القطاع التعليمي/المؤسسي.
- لوحة تحكم، مستندات، رفع محاكى، بحث، سجل تدقيق، إعدادات.
- درج مستند، معاينة، بيانات وصفية، OCR وهمي.
- لوحة أوامر `Ctrl/Cmd + K`، إشعارات، تصميم متجاوب.

### روابط عرض عميقة

| الرابط | النتيجة |
|---|---|
| `?lang=ar` / `?lang=en` | فرض اللغة |
| `?theme=dark` / `?theme=light` | فرض الثيم |
| `?sector=edu` / `?sector=corp` | فرض القطاع |
| `?demo=drawer&doc=edu-1` | فتح درج مستند |
| `?demo=upload` | فتح نافذة الرفع |
| `?demo=palette` | فتح لوحة الأوامر |

### النشر على Netlify

```powershell
cd archifex
netlify deploy --site archifex --dir . --prod --no-build
```

- `publish = "."` في `netlify.toml`.
- التحويلات النظيفة للوثائق.
- Security headers + CSP في `netlify.toml`.

---

## حدود ما تم تنفيذه

- migrations وواجهات Next.js مكتوبة ومبنية بنجاح، لكنها لم تُختبر على مشروع Supabase حي بعد.
- رفع الملفات الفعلي إلى Storage لم يُربط بواجهة بعد؛ سجلات المستندات تحفظ الميتاداتا، وسياسات Storage جاهزة.
- بوابة الدفع/الاشتراك لم تُربط؛ تفعيل `subscription_status` يتم حالياً من السيرفر/SQL.
- الموقع الثابت الحالي لم يُحوَّل بالكامل إلى Next.js؛ بقي كواجهة عرض على Netlify.
- لم يتم إنشاء مشروع Vercel بعد لعدم توفر صلاحيات/ربط المشروع.

---

## الخطوات التالية

1. تنفيذ migrations على Supabase واختبار trigger التسجيل.
2. ربط Vercel بمجلد `web` وإضافة متغيرات البيئة.
3. إضافة رفع فعلي إلى Storage مع presigned URLs أو Supabase upload.
4. ربط بوابة دفع (Stripe/Paddle/Moyasar) لتحديث `subscription_status` عبر webhook.
5. إضافة دعوات الفريق وإدارة الأعضاء.
6. إضافة اختبارات عزل RLS آلية في CI.

---

© 2026 — **مَدار فَلَك | MadarFalak**  
Developed & Powered by MadarFalak Software Solutions — جميع الحقوق محفوظة لشركة مَدار فَلَك
