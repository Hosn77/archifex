/* ==========================================================================
   ARCHIFEX — Public site behaviour
   Bilingual copy, theme persistence, sector tabs, reveal animations
   ========================================================================== */

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const html = document.documentElement;

  const params = new URLSearchParams(location.search);
  const state = {
    lang: ['ar', 'en'].includes(params.get('lang'))
      ? params.get('lang')
      : localStorage.getItem('archifex-lang') === 'en' ? 'en' : 'ar',
    theme: ['dark', 'light'].includes(params.get('theme'))
      ? params.get('theme')
      : localStorage.getItem('archifex-theme') === 'light' ? 'light' : 'dark',
    sector: ['edu', 'corp'].includes(params.get('sector'))
      ? params.get('sector')
      : localStorage.getItem('archifex-sector') === 'corp' ? 'corp' : 'edu',
  };

  const I18N = {
    ar: {
      'meta.title': 'Archifex | نظام إدارة الأرشيف والملفات - من شركة مَدار فَلَك',
      'meta.desc': 'Archifex من شركة مَدار فَلَك | MadarFalak: نظام سحابي لإدارة الأرشيف والملفات، مساحات عمل معزولة لكل مؤسسة، حماية RLS، وتجربة مجانية 30 يوماً. OCR عربي وإنجليزي، بحث ذكي، صلاحيات دقيقة، وسجل تدقيق.',
      'a11y.skip': 'تجاوز إلى المحتوى',
      'a11y.mainnav': 'التنقل الرئيسي',
      'a11y.theme': 'تبديل المظهر',
      'a11y.theme.light': 'التبديل إلى المظهر الفاتح',
      'a11y.theme.dark': 'التبديل إلى المظهر الداكن',
      'a11y.lang': 'تبديل اللغة إلى الإنجليزية',
      'a11y.lang.short': 'EN',
      'a11y.menu': 'القائمة',

      'brand.primary': 'أرشيفكس',
      'brand.secondary': 'ARCHIFEX',
      'nav.platform': 'المنصة',
      'nav.sectors': 'القطاعات',
      'nav.security': 'الأمان',
      'nav.roadmap': 'خارطة الطريق',
      'nav.docs': 'الوثائق',
      'header.demo': 'ادخل المنصة',

      'hero.badge': 'منصة أرشفة ذكية · عربي / إنجليزي',
      'hero.title1': 'أرشيفك المؤسسي،',
      'hero.title2': 'يفكّر معك.',
      'hero.sub': 'أرشيفكس يحوّل ملايين المستندات إلى معرفة قابلة للبحث والاعتماد. OCR عربي وإنجليزي، استخراج ذكي للبيانات، وحوكمة كاملة — من أول مسح ضوئي إلى آخر توقيع.',
      'hero.cta1': 'ادخل المنصة التفاعلية',
      'hero.cta2': 'استكشف الوثائق',
      'hero.meta1': 'دخول آمن',
      'hero.meta2': 'بيانات تجريبية',
      'hero.meta3': 'يعمل على الجوال',
      'hero.shot.url': 'archifex.app / dashboard',
      'hero.float1.title': 'دقة الاستخراج',
      'hero.float1.sub': '98.6% · عربي + إنجليزي',
      'hero.float2.title': '12 مستندًا',
      'hero.float2.sub': 'اكتمل استخراجها',
      'hero.float3.title': 'توقيع مكتمل',
      'hero.float3.sub': 'عقد خدمة · شركة أفق',
      'hero.shot.alt': 'لوحة تحكم أرشيفكس — نموذج تفاعلي',

      'stats.1': 'دقة استخراج تجريبية',
      'stats.2': 'OCR أصلي ثنائي اللغة',
      'stats.3': 'جدولاً في مخطط البيانات',
      'stats.4': 'أسبوعاً لبناء MVP',

      'sectors.eyebrow': 'مصمّم لطبيعة عملك',
      'sectors.title': 'قطاعان. نظام واحد.',
      'sectors.sub': 'تعليم يفرض خصوصية سجلات الطلاب وربط الهوية الأكاديمية. وشركات تفرض ربط العقد بالعميل والمشروع والامتثال. أرشيفكس يفهم الفرق، ويوحّد التجربة.',
      'sectors.tabs.aria': 'اختر القطاع',
      'sectors.tab.edu': 'التعليم',
      'sectors.tab.corp': 'الشركات',
      'sectors.edu.title': 'من ملف الطالب إلى قرار المجلس.',
      'sectors.edu.desc': 'سجلات أكاديمية، شهادات، كشوف درجات، خطابات تكليف، وتعاميم — مرتبطة بالكلية والقسم والبرنامج، مع صلاحيات تمنع الاطلاع غير المصرّح.',
      'sectors.edu.li1': 'سجلات الطلاب والهوية الأكاديمية',
      'sectors.edu.li2': 'الشهادات وكشوف الدرجات وtranscripts',
      'sectors.edu.li3': 'خطابات التكليف والتعاميم الأكاديمية',
      'sectors.edu.li4': 'ربط المستند بالكلية والقسم والبرنامج',
      'sectors.edu.li5': 'احتفاظ وسجل تدقيق جاهز للاعتماد',
      'sectors.edu.link': 'اقرأ عن نموذج التعليم',
      'sectors.edu.doc1.title': 'سجل طالب — 2025/2026',
      'sectors.edu.doc1.sub': 'كلية الهندسة · برنامج الحاسوب',
      'sectors.edu.doc1.status': 'مكتمل',
      'sectors.edu.doc2.title': 'شهادة تخرج',
      'sectors.edu.doc2.sub': 'قسم الهندسة الكهربائية',
      'sectors.edu.doc2.status': 'موقّع',
      'sectors.edu.doc3.title': 'تعميم أكاديمي 44/2026',
      'sectors.edu.doc3.sub': 'عمادة القبول والتسجيل',
      'sectors.edu.doc3.status': 'بانتظار الاعتماد',
      'sectors.corp.title': 'من العقد إلى التجديد، دون أن يضيع شيء.',
      'sectors.corp.desc': 'عقود واتفاقيات، فواتير وملفات ضريبية، مواصفات مشاريع، SLAs وRFPs — مرتبطة بالعميل والمشروع والقسم، مع سير عمل للاعتماد والتوقيع.',
      'sectors.corp.li1': 'العقود والاتفاقيات والملاحق',
      'sectors.corp.li2': 'الفواتير والملفات الضريبية',
      'sectors.corp.li3': 'مواصفات المشاريع وRFPs',
      'sectors.corp.li4': 'SLAs وتجديدات العقود',
      'sectors.corp.li5': 'ربط العميل والمشروع والقسم والاحتفاظ القانوني',
      'sectors.corp.link': 'اقرأ عن النموذج المؤسسي',
      'sectors.corp.doc1.title': 'عقد خدمة — شركة أفق',
      'sectors.corp.doc1.sub': 'AFX-2026-0184 · 480,000 ريال',
      'sectors.corp.doc1.status': 'موقّع',
      'sectors.corp.doc2.title': 'فاتورة ضريبية — مارس',
      'sectors.corp.doc2.sub': 'مشروع بوابة البيانات',
      'sectors.corp.doc2.status': 'معتمدة',
      'sectors.corp.doc3.title': 'SLA — منصة التشغيل',
      'sectors.corp.doc3.sub': 'تجديد Q3 2026',
      'sectors.corp.doc3.status': 'قيد المراجعة',

      'features.eyebrow': 'القدرات',
      'features.title': 'كل ما تحتاجه الأرشفة المؤسسية.',
      'features.sub': 'ليست مساحة تخزين. أرشيفكس يفهم المستند، يستخرج بياناته، يربطه بسياقه، ويحميه بصلاحيات وسجل تدقيق — ثم يجعله قابلاً للبحث في لحظة.',
      'feature.ocr.title': 'OCR عربي + إنجليزي',
      'feature.ocr.desc': 'نص قابل للبحث من الممسوح والصور، مع الحفاظ على التنسيق الأصلي وثنائية اللغة في المستند الواحد.',
      'feature.ai.title': 'استخراج ذكي للبيانات',
      'feature.ai.desc': 'حقول وبيانات وصفية مع نسبة ثقة وإحداثيات، وقواعد واضحة للمراجعة البشرية عند انخفاض الثقة.',
      'feature.search.title': 'بحث شامل',
      'feature.search.desc': 'بحث لغوي ودلالي في النص والميتاداتا والأشخاص، مع تصفية دقيقة بالقسم والتاريخ والنوع.',
      'feature.rbac.title': 'صلاحيات RBAC',
      'feature.rbac.desc': 'أدوار على مستوى المؤسسة والقسم والمستند، وعزل متعدد المستأجرين عبر RLS في قاعدة البيانات.',
      'feature.audit.title': 'سجل تدقيق غير قابل للتعديل',
      'feature.audit.desc': 'سجل append-only بسلسلة تجزئة لكل عملية، جاهز للمراجعة الداخلية والامتثال والتحقيق.',
      'feature.workflow.title': 'سير عمل وتوقيع رقمي',
      'feature.workflow.desc': 'اعتماد متعدد المراحل، توقيع رقمي، إشعارات وتصعيد تلقائي عند التأخر — دون بريد متفرق.',
      'feature.retention.title': 'احتفاظ وحوكمة',
      'feature.retention.desc': 'سياسات احتفاظ، تعليق قانوني، وأرشفة باردة بتكلفة منخفضة مع استرجاع مضمون.',
      'feature.bilingual.title': 'ثنائي اللغة بالكامل',
      'feature.bilingual.desc': 'واجهة RTL/LTR كاملة، ومحتوى عربي وإنجليزي في المستند نفسه، دون ترجمة تفقد المعنى.',

      'flow.eyebrow': 'كيف يعمل',
      'flow.title': 'من المسح الضوئي إلى المعرفة، في أربع خطوات.',
      'flow.sub': 'خط أنابيب واحد يتعامل مع الرفع، OCR، الاستخراج، التصنيف، المراجعة، التوقيع، والأرشفة — مع حالة واضحة لكل مستند.',
      'flow.s1.title': 'امسح أو ارفع',
      'flow.s1.desc': 'سحب وإفلات، ماسح ضوئي، بريد إلكتروني، أو API. المستند يدخل الطابور فوراً.',
      'flow.s2.title': 'افهم',
      'flow.s2.desc': 'OCR عربي وإنجليزي، استخراج حقول وبيانات وصفية، وتصنيف تلقائي حسب النوع والقسم.',
      'flow.s3.title': 'راجع واعتمد',
      'flow.s3.desc': 'مراجعة بشرية للحقول منخفضة الثقة، سير عمل متعدد المراحل، وتوقيع رقمي موثّق.',
      'flow.s4.title': 'ابحث وأرشف',
      'flow.s4.desc': 'بحث فوري في المحتوى والميتاداتا، سياسات احتفاظ، وسجل تدقيق لكل خطوة.',
      'flow.card.title': 'عقد خدمة — شركة أفق',
      'flow.card.sub': 'AFX-2026-0184 · PDF · 12 صفحة',
      'flow.card.ai': 'استخراج AI',
      'flow.card.review': '4 حقول جاهزة للمراجعة',
      'flow.card.open': 'فتح المستند',
      'field.contract': 'رقم العقد',
      'field.start': 'تاريخ البدء',
      'field.start.value': '01 مارس 2026',
      'field.value': 'قيمة العقد',
      'field.value.value': '480,000 ريال',
      'field.notice': 'مدة الإشعار',
      'field.notice.value': '30 يومًا',

      'security.eyebrow': 'الأمان والحوكمة',
      'security.title': 'الحوكمة ليست إضافة. إنها الأساس.',
      'security.desc': 'صُمم أرشيفكس للمؤسسات التي لا تحتمل فقدان مستند أو تجاوز صلاحية. العزل، التشفير، التدقيق، والاحتفاظ — جزء من التصميم من اليوم الأول.',
      'security.note': '* خارطة الامتثال قيد التنفيذ — هذه معايير تصميم وليست شهادات صادرة.',
      'security.p1': 'عزل متعدد المستأجرين عبر RLS',
      'security.p2': 'سلسلة تجزئة لسجل التدقيق',
      'security.p3': 'OIDC / SAML مع MFA',
      'security.p4': 'تشفير أثناء النقل والتخزين',
      'security.p5': 'نسخ احتياطي واستعادة مُختبرة',
      'security.p6': 'سياسات احتفاظ وتعليق قانوني',

      'arch.eyebrow': 'المعمارية',
      'arch.title': 'تبدأ بسيطة، وتتوسع بثبات.',
      'arch.desc': 'Modular Monolith واضح الحدود، قاعدة بيانات واحدة مع RLS، وطوابير معالجة مستقلة. وعند الحاجة، OpenSearch وخدمات منفصلة — دون إعادة كتابة.',
      'arch.cta': 'اقرأ وثيقة المعمارية',
      'arch.label.ui': 'الواجهة',
      'arch.label.api': 'الخدمات',
      'arch.label.data': 'البيانات',
      'arch.label.infra': 'التشغيل',

      'roadmap.eyebrow': 'خارطة الطريق',
      'roadmap.title': '24 أسبوعاً إلى إطلاق تجريبي.',
      'roadmap.sub': 'نطاق MVP محدد: 6 أنواع مستندات، 3 عملاء تجريبيين، وفريق من 10 أشخاص. كل مرحلة لها بوابة قبول واضحة.',
      'phase.1.weeks': '0–4 أسابيع',
      'phase.1.title': 'الاكتشاف والتأسيس',
      'phase.1.desc': 'ورش مع العملاء، نماذج أولية، عقود البيانات، واختيار المزوّدين.',
      'phase.2.weeks': '5–12 أسبوعاً',
      'phase.2.title': 'النواة',
      'phase.2.desc': 'الرفع، OCR، البحث، الصلاحيات، وسجل التدقيق الأساسي.',
      'phase.3.weeks': '13–20 أسبوعاً',
      'phase.3.title': 'الذكاء والحوكمة',
      'phase.3.desc': 'الاستخراج الذكي، سير العمل، التوقيع، الاحتفاظ، وتقارير الامتثال.',
      'phase.4.weeks': '21–24 أسبوعاً',
      'phase.4.title': 'الإطلاق التجريبي',
      'phase.4.desc': '3 عملاء، اختبار أداء وأمن، تدريب، وقياس NPS والاعتماد.',

      'docs.eyebrow': 'وثائق المشروع',
      'docs.title': 'التصميم كاملاً، ليس صورة فقط.',
      'docs.sub': 'حزمة تصميم قابلة للتنفيذ: معمارية، مخطط قاعدة بيانات، نظام هوية وواجهة، وخارطة MVP — مع نموذج تفاعلي حقيقي.',
      'docs.1.title': 'المعمارية والنظام',
      'docs.1.desc': 'المكوّنات، خط أنابيب OCR/AI، البحث، التعدد المستأجر، الأمان، النشر، والمراقبة.',
      'docs.1.meta': '4 أقسام · قراءة 12 دقيقة',
      'docs.2.title': 'قاعدة البيانات',
      'docs.2.desc': '36 جدولاً، ERD، قيود، RLS، فهارس عربية، احتفاظ، ترحيل ونسخ احتياطي.',
      'docs.2.meta': '36 جدولاً · قراءة 15 دقيقة',
      'docs.3.title': 'الهوية والواجهة',
      'docs.3.desc': 'التسمية، الشعار، الألوان، الطباعة، المخططات السلكية، المكونات، وRTL والوصول.',
      'docs.3.meta': 'نظام تصميم · قراءة 10 دقائق',
      'docs.4.title': 'خارطة MVP',
      'docs.4.desc': 'المراحل، الفريق، الميزانية، التسعير، مؤشرات النجاح، خطة التجربة، والمخاطر.',
      'docs.4.meta': '24 أسبوعاً · قراءة 12 دقيقة',

      'cta.title': 'جاهز ترى الأرشيف يفكّر؟',
      'cta.sub': 'سجّل الدخول أو أنشئ حساباً تجريبياً، ثم افتح المنصة وبدّل اللغة والقطاع والثيم وجرّب البحث والرفع ومعاينة المستند.',
      'cta.demo': 'ابدأ الآن',
      'cta.docs': 'تصفّح الوثائق',
      'cta.note': 'عرض تصميمي · لا يحتاج تسجيل · جميع البيانات وهمية',

      'footer.about': 'الأرشيف الذي يفكّر. منصة أرشفة وإدارة مستندات ذكية، ثنائية اللغة، للمؤسسات التعليمية والشركات.',
      'footer.product': 'المنتج',
      'footer.demo': 'دخول المنصة',
      'footer.docs': 'الوثائق',
      'footer.architecture': 'المعمارية',
      'footer.roadmap': 'خارطة الطريق',
      'footer.sectors': 'القطاعات',
      'footer.edu': 'التعليم',
      'footer.corp': 'الشركات',
      'footer.brand': 'الهوية البصرية',
      'footer.project': 'المشروع',
      'footer.db': 'قاعدة البيانات',
      'footer.schema': 'مخطط SQL',
      'footer.readme': 'README',
      'footer.rights': '© 2026 Archifex — جميع الحقوق محفوظة لشركة مَدار فَلَك.',
      'footer.disclaimer': 'عرض تصميمي مستقل · جميع الأسماء والبيانات وهمية',
      'footer.built': 'صُنع بعناية · RTL أولاً',
      'footer.top': 'إلى الأعلى',
    },

    en: {
      'meta.title': 'Archifex | Document Archiving System - by MadarFalak',
      'meta.desc': 'Archifex by MadarFalak: a multi-tenant document archiving platform with isolated workspaces, RLS protection, and a 30-day free trial. Arabic + English OCR, smart search, precise permissions, and an audit trail.',
      'a11y.skip': 'Skip to content',
      'a11y.mainnav': 'Main navigation',
      'a11y.theme': 'Toggle theme',
      'a11y.theme.light': 'Switch to light mode',
      'a11y.theme.dark': 'Switch to dark mode',
      'a11y.lang': 'Switch language to Arabic',
      'a11y.lang.short': 'ع',
      'a11y.menu': 'Menu',

      'brand.primary': 'Archifex',
      'brand.secondary': 'أرشيفكس',
      'nav.platform': 'Platform',
      'nav.sectors': 'Sectors',
      'nav.security': 'Security',
      'nav.roadmap': 'Roadmap',
      'nav.docs': 'Docs',
      'header.demo': 'Enter the platform',

      'hero.badge': 'Smart archiving platform · Arabic / English',
      'hero.title1': 'Your institutional archive,',
      'hero.title2': 'now thinking with you.',
      'hero.sub': 'Archifex turns millions of documents into searchable, trusted knowledge. Arabic and English OCR, AI-powered data extraction, and end-to-end governance — from the first scan to the final signature.',
      'hero.cta1': 'Enter the interactive dashboard',
      'hero.cta2': 'Explore the docs',
      'hero.meta1': 'Secure sign-in',
      'hero.meta2': 'Demo data',
      'hero.meta3': 'Works on mobile',
      'hero.shot.url': 'archifex.app / dashboard',
      'hero.float1.title': 'Extraction accuracy',
      'hero.float1.sub': '98.6% · AR + EN',
      'hero.float2.title': '12 documents',
      'hero.float2.sub': 'Extraction complete',
      'hero.float3.title': 'Signature complete',
      'hero.float3.sub': 'Service contract · Ufuq',
      'hero.shot.alt': 'Archifex dashboard — interactive prototype',

      'stats.1': 'Demo extraction accuracy',
      'stats.2': 'Native bilingual OCR',
      'stats.3': 'Tables in the data model',
      'stats.4': 'Weeks to an MVP',

      'sectors.eyebrow': 'Built for how you work',
      'sectors.title': 'Two sectors. One system.',
      'sectors.sub': 'Education demands student-record privacy and academic identity linkage. Enterprises demand contract-to-client-to-project traceability and compliance. Archifex understands the difference and unifies the experience.',
      'sectors.tabs.aria': 'Choose a sector',
      'sectors.tab.edu': 'Education',
      'sectors.tab.corp': 'Enterprise',
      'sectors.edu.title': 'From a student file to a council decision.',
      'sectors.edu.desc': 'Academic records, certificates, transcripts, appointment letters, and circulars — linked to college, department, and program, with permissions that prevent unauthorized access.',
      'sectors.edu.li1': 'Student records and academic identity',
      'sectors.edu.li2': 'Certificates, transcripts, and grade reports',
      'sectors.edu.li3': 'Appointment letters and academic circulars',
      'sectors.edu.li4': 'Link every document to college, department, and program',
      'sectors.edu.li5': 'Retention and audit trail ready for accreditation',
      'sectors.edu.link': 'Read the education model',
      'sectors.edu.doc1.title': 'Student record — 2025/2026',
      'sectors.edu.doc1.sub': 'College of Engineering · Computer program',
      'sectors.edu.doc1.status': 'Complete',
      'sectors.edu.doc2.title': 'Graduation certificate',
      'sectors.edu.doc2.sub': 'Electrical Engineering Department',
      'sectors.edu.doc2.status': 'Signed',
      'sectors.edu.doc3.title': 'Academic circular 44/2026',
      'sectors.edu.doc3.sub': 'Deanship of Admission and Registration',
      'sectors.edu.doc3.status': 'Pending approval',
      'sectors.corp.title': 'From contract to renewal, without losing a thing.',
      'sectors.corp.desc': 'Contracts, agreements, invoices, tax files, project specifications, SLAs, and RFPs — linked to client, project, and department, with approval and signature workflows.',
      'sectors.corp.li1': 'Contracts, agreements, and amendments',
      'sectors.corp.li2': 'Invoices and tax files',
      'sectors.corp.li3': 'Project specifications and RFPs',
      'sectors.corp.li4': 'SLAs and contract renewals',
      'sectors.corp.li5': 'Client, project, and department linkage with legal retention',
      'sectors.corp.link': 'Read the enterprise model',
      'sectors.corp.doc1.title': 'Service contract — Ufuq',
      'sectors.corp.doc1.sub': 'AFX-2026-0184 · SAR 480,000',
      'sectors.corp.doc1.status': 'Signed',
      'sectors.corp.doc2.title': 'Tax invoice — March',
      'sectors.corp.doc2.sub': 'Data Gateway project',
      'sectors.corp.doc2.status': 'Approved',
      'sectors.corp.doc3.title': 'SLA — Operations platform',
      'sectors.corp.doc3.sub': 'Q3 2026 renewal',
      'sectors.corp.doc3.status': 'In review',

      'features.eyebrow': 'Capabilities',
      'features.title': 'Everything institutional archiving needs.',
      'features.sub': 'Not storage. Archifex understands the document, extracts its data, connects it to context, protects it with permissions and an audit trail — then makes it searchable in an instant.',
      'feature.ocr.title': 'Arabic + English OCR',
      'feature.ocr.desc': 'Searchable text from scans and images, preserving layout and bilingual content in the same document.',
      'feature.ai.title': 'AI data extraction',
      'feature.ai.desc': 'Fields and metadata with confidence scores and bounding boxes, plus clear human-review rules when confidence drops.',
      'feature.search.title': 'Universal search',
      'feature.search.desc': 'Lexical and semantic search across text, metadata, and people, with precise filters by department, date, and type.',
      'feature.rbac.title': 'RBAC permissions',
      'feature.rbac.desc': 'Roles at organization, department, and document level, with tenant isolation enforced by database RLS.',
      'feature.audit.title': 'Tamper-evident audit log',
      'feature.audit.desc': 'An append-only, hash-chained record of every action, ready for internal review, compliance, and investigations.',
      'feature.workflow.title': 'Workflows & e-signature',
      'feature.workflow.desc': 'Multi-stage approvals, digital signatures, notifications, and automatic escalation — without scattered email.',
      'feature.retention.title': 'Retention & governance',
      'feature.retention.desc': 'Retention policies, legal hold, and low-cost cold archiving with guaranteed retrieval.',
      'feature.bilingual.title': 'Fully bilingual',
      'feature.bilingual.desc': 'Complete RTL/LTR interface, with Arabic and English content in the same document — without losing meaning in translation.',

      'flow.eyebrow': 'How it works',
      'flow.title': 'From scan to knowledge, in four steps.',
      'flow.sub': 'One pipeline handles upload, OCR, extraction, classification, review, signature, and archiving — with a clear state for every document.',
      'flow.s1.title': 'Scan or upload',
      'flow.s1.desc': 'Drag and drop, scanner, email, or API. The document enters the queue immediately.',
      'flow.s2.title': 'Understand',
      'flow.s2.desc': 'Arabic and English OCR, field and metadata extraction, and automatic classification by type and department.',
      'flow.s3.title': 'Review & approve',
      'flow.s3.desc': 'Human review for low-confidence fields, multi-stage workflows, and an auditable digital signature.',
      'flow.s4.title': 'Search & archive',
      'flow.s4.desc': 'Instant search across content and metadata, retention policies, and an audit trail for every step.',
      'flow.card.title': 'Service contract — Ufuq',
      'flow.card.sub': 'AFX-2026-0184 · PDF · 12 pages',
      'flow.card.ai': 'AI extraction',
      'flow.card.review': '4 fields ready for review',
      'flow.card.open': 'Open document',
      'field.contract': 'Contract number',
      'field.start': 'Start date',
      'field.start.value': '1 March 2026',
      'field.value': 'Contract value',
      'field.value.value': 'SAR 480,000',
      'field.notice': 'Notice period',
      'field.notice.value': '30 days',

      'security.eyebrow': 'Security & governance',
      'security.title': 'Governance is not an add-on. It is the foundation.',
      'security.desc': 'Archifex is built for organizations that cannot afford a lost document or a permission bypass. Isolation, encryption, audit, and retention are designed in from day one.',
      'security.note': '* Compliance roadmap in progress — these are design principles, not issued certifications.',
      'security.p1': 'Tenant isolation enforced with RLS',
      'security.p2': 'Hash-chained audit log',
      'security.p3': 'OIDC / SAML with MFA',
      'security.p4': 'Encryption in transit and at rest',
      'security.p5': 'Tested backup and restore',
      'security.p6': 'Retention policies and legal hold',

      'arch.eyebrow': 'Architecture',
      'arch.title': 'Starts simple. Scales steadily.',
      'arch.desc': 'A modular monolith with clear boundaries, one database with RLS, and independent processing queues. When needed, OpenSearch and separate services — without a rewrite.',
      'arch.cta': 'Read the architecture doc',
      'arch.label.ui': 'Interface',
      'arch.label.api': 'Services',
      'arch.label.data': 'Data',
      'arch.label.infra': 'Operations',

      'roadmap.eyebrow': 'Roadmap',
      'roadmap.title': '24 weeks to a pilot launch.',
      'roadmap.sub': 'A focused MVP: 6 document types, 3 pilot clients, and a team of 10. Every phase has a clear acceptance gate.',
      'phase.1.weeks': '0–4 weeks',
      'phase.1.title': 'Discovery & foundation',
      'phase.1.desc': 'Client workshops, prototypes, data contracts, and vendor selection.',
      'phase.2.weeks': '5–12 weeks',
      'phase.2.title': 'Core',
      'phase.2.desc': 'Upload, OCR, search, permissions, and the core audit log.',
      'phase.3.weeks': '13–20 weeks',
      'phase.3.title': 'Intelligence & governance',
      'phase.3.desc': 'AI extraction, workflows, signature, retention, and compliance reports.',
      'phase.4.weeks': '21–24 weeks',
      'phase.4.title': 'Pilot launch',
      'phase.4.desc': '3 clients, performance and security testing, training, and NPS measurement.',

      'docs.eyebrow': 'Project documents',
      'docs.title': 'The full design, not just a picture.',
      'docs.sub': 'An executable design package: architecture, database schema, brand and UI system, and an MVP roadmap — with a real interactive prototype.',
      'docs.1.title': 'Architecture & system',
      'docs.1.desc': 'Components, OCR/AI pipeline, search, multi-tenancy, security, deployment, and observability.',
      'docs.1.meta': '4 sections · 12 min read',
      'docs.2.title': 'Database',
      'docs.2.desc': '36 tables, ERD, constraints, RLS, Arabic indexes, retention, migration, and backup.',
      'docs.2.meta': '36 tables · 15 min read',
      'docs.3.title': 'Brand & interface',
      'docs.3.desc': 'Naming, logo, color, typography, wireframes, components, RTL, and accessibility.',
      'docs.3.meta': 'Design system · 10 min read',
      'docs.4.title': 'MVP roadmap',
      'docs.4.desc': 'Phases, team, budget, pricing, success metrics, pilot plan, and risks.',
      'docs.4.meta': '24 weeks · 12 min read',

      'cta.title': 'Ready to see the archive think?',
      'cta.sub': 'Sign in or create a demo account, then open the platform, switch language, sector and theme, and try search, upload and document preview.',
      'cta.demo': 'Get started',
      'cta.docs': 'Browse the docs',
      'cta.note': 'Design concept · No sign-up · All data is fictional',

      'footer.about': 'The archive that thinks. A smart, bilingual document management platform for educational institutions and companies.',
      'footer.product': 'Product',
      'footer.demo': 'Sign in to demo',
      'footer.docs': 'Documents',
      'footer.architecture': 'Architecture',
      'footer.roadmap': 'Roadmap',
      'footer.sectors': 'Sectors',
      'footer.edu': 'Education',
      'footer.corp': 'Enterprise',
      'footer.brand': 'Brand system',
      'footer.project': 'Project',
      'footer.db': 'Database',
      'footer.schema': 'SQL schema',
      'footer.readme': 'README',
      'footer.rights': '© 2026 Archifex — All rights reserved to MadarFalak.',
      'footer.disclaimer': 'Independent design concept · All names and data are fictional',
      'footer.built': 'Crafted with care · RTL-first',
      'footer.top': 'Back to top',
    },
  };

  const t = (key) => (I18N[state.lang] && I18N[state.lang][key]) || (I18N.ar && I18N.ar[key]) || key;
  const $meta = (name) => $(`meta[name="${name}"]`);
  const $prop = (name) => $(`meta[property="${name}"]`);

  function applyTheme() {
    html.dataset.theme = state.theme;
    try { localStorage.setItem('archifex-theme', state.theme); } catch (e) {}
    const icon = $('#themeIcon use');
    if (icon) icon.setAttribute('href', state.theme === 'dark' ? '#i-sun' : '#i-moon');
    const btn = $('#themeBtn');
    if (btn) btn.setAttribute('aria-label', t(state.theme === 'dark' ? 'a11y.theme.light' : 'a11y.theme.dark'));
    const themeColor = $meta('theme-color');
    if (themeColor) themeColor.setAttribute('content', state.theme === 'dark' ? '#0F172A' : '#E2E8F0');
    const shot = $('#heroShot');
    if (shot) {
      shot.src = `assets/dashboard-${state.lang}-${state.theme}.png`;
      shot.alt = t('hero.shot.alt');
    }
  }

  function applyLang() {
    html.lang = state.lang;
    html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('archifex-lang', state.lang); } catch (e) {}

    document.title = t('meta.title');
    const desc = $meta('description');
    if (desc) desc.setAttribute('content', t('meta.desc'));
    const ogTitle = $prop('og:title');
    if (ogTitle) ogTitle.setAttribute('content', t('meta.title'));
    const ogDesc = $prop('og:description');
    if (ogDesc) ogDesc.setAttribute('content', t('meta.desc'));
    const ogLocale = $prop('og:locale');
    if (ogLocale) ogLocale.setAttribute('content', state.lang === 'ar' ? 'ar_SA' : 'en_US');

    $$('[data-i18n]').forEach((el) => {
      const value = I18N[state.lang][el.dataset.i18n];
      if (typeof value === 'string') el.textContent = value;
    });
    $$('[data-i18n-aria]').forEach((el) => {
      const value = I18N[state.lang][el.dataset.i18nAria];
      if (typeof value === 'string') el.setAttribute('aria-label', value);
    });
    $$('[data-i18n-alt]').forEach((el) => {
      const value = I18N[state.lang][el.dataset.i18nAlt];
      if (typeof value === 'string') el.setAttribute('alt', value);
    });

    const langBtn = $('#langBtn');
    if (langBtn) {
      langBtn.textContent = state.lang === 'ar' ? 'EN' : 'ع';
      langBtn.setAttribute('aria-label', t('a11y.lang'));
      langBtn.setAttribute('lang', state.lang === 'ar' ? 'en' : 'ar');
    }
    applyTheme();
  }

  function setSector(sector, persist = true) {
    state.sector = sector === 'corp' ? 'corp' : 'edu';
    if (persist) {
      try { localStorage.setItem('archifex-sector', state.sector); } catch (e) {}
    }
    $$('[data-sector]').forEach((btn) => {
      const selected = btn.dataset.sector === state.sector;
      btn.setAttribute('aria-selected', String(selected));
      btn.tabIndex = selected ? 0 : -1;
    });
    const edu = $('#panelEdu');
    const corp = $('#panelCorp');
    if (edu) edu.hidden = state.sector !== 'edu';
    if (corp) corp.hidden = state.sector !== 'corp';
  }

  function initSectorTabs() {
    const tabs = $$('[data-sector]');
    tabs.forEach((btn) => {
      btn.addEventListener('click', () => setSector(btn.dataset.sector));
      btn.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        const dir = html.dir === 'rtl' ? -1 : 1;
        const delta = e.key === 'ArrowRight' ? dir : -dir;
        const idx = tabs.indexOf(btn);
        const next = tabs[(idx + delta + tabs.length) % tabs.length];
        next.focus();
        setSector(next.dataset.sector);
      });
    });
    setSector(state.sector, false);
  }

  function initTheme() {
    const btn = $('#themeBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
    });
  }

  function initLang() {
    const btn = $('#langBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      state.lang = state.lang === 'ar' ? 'en' : 'ar';
      applyLang();
    });
  }

  function initHeader() {
    const header = $('#siteHeader');
    const onScroll = () => {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const menuBtn = $('#menuBtn');
    const nav = $('#mobileNav');
    if (!menuBtn || !nav) return;
    const close = () => {
      nav.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    };
    menuBtn.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1080) close();
    });
  }

  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    items.forEach((el) => io.observe(el));
  }

  function initExternalLinks() {
    $$('a[href^="http"]').forEach((a) => {
      if (a.hostname && a.hostname !== location.hostname) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    });
  }

  function initStorageSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'archifex-theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        state.theme = e.newValue;
        applyTheme();
      }
      if (e.key === 'archifex-lang' && (e.newValue === 'ar' || e.newValue === 'en')) {
        state.lang = e.newValue;
        applyLang();
      }
      if (e.key === 'archifex-sector' && (e.newValue === 'edu' || e.newValue === 'corp')) {
        setSector(e.newValue, false);
      }
    });
  }

  function init() {
    applyLang();
    initTheme();
    initLang();
    initSectorTabs();
    initHeader();
    initReveal();
    initExternalLinks();
    initStorageSync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
