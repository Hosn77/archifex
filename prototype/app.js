/* ==========================================================================
   ARCHIFEX — Dashboard prototype behaviour
   Pure vanilla JS · no build step · demo data only
   ========================================================================== */

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const html = document.documentElement;

  const L = (ar, en) => ({ ar, en });
  const pick = (value) => (typeof value === 'string' ? value : value[state.lang] ?? value.ar);
  const esc = (value) =>
    String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

  const params = new URLSearchParams(location.search);
  const paramLang = params.get('lang');
  const paramTheme = params.get('theme');
  const paramSector = params.get('sector');

  const state = {
    lang: ['ar', 'en'].includes(paramLang) ? paramLang : localStorage.getItem('archifex-lang') || 'ar',
    theme: ['dark', 'light'].includes(paramTheme) ? paramTheme : localStorage.getItem('archifex-theme') || 'dark',
    sector: ['edu', 'corp'].includes(paramSector) ? paramSector : localStorage.getItem('archifex-sector') || 'edu',
    range: '7',
    filter: 'all',
    query: '',
    doc: null,
    paletteIndex: 0,
    lastFocus: null,
    uploading: false,
  };

  /* ---------------------------------------------------------------------
     Translations
     --------------------------------------------------------------------- */
  const T = {
    ar: {
      'doc.title': 'Archifex | لوحة التحكم - من شركة مَدار فَلَك',
      'a11y.skip': 'تجاوز إلى المحتوى',
      'a11y.close': 'إغلاق',
      'a11y.logout': 'تسجيل الخروج',
      'a11y.menu': 'القائمة',
      'a11y.theme': 'تبديل المظهر',
      'a11y.notifications': 'الإشعارات',

      'nav.group.main': 'الفضاء العام',
      'nav.dashboard': 'لوحة التحكم',
      'nav.documents': 'المستندات',
      'nav.search': 'البحث الذكي',
      'nav.workflows': 'سير العمل والتوقيع',
      'nav.group.library': 'المكتبة',
      'nav.categories': 'التصنيفات',
      'nav.projects': 'المشاريع والأقسام',
      'nav.cold': 'الأرشيف البارد',
      'nav.group.gov': 'الحوكمة',
      'nav.users': 'المستخدمون والصلاحيات',
      'nav.audit': 'سجل المراجعة',
      'nav.settings': 'الإعدادات',
      'nav.entities.edu': 'الطلاب',
      'nav.entities.corp': 'العملاء',
      'nav.workspace.edu': 'بيئة تعليمية',
      'nav.workspace.corp': 'بيئة مؤسسية',

      'storage.title': 'مساحة التخزين',
      'storage.used': '1.36 TB من 2 TB',
      'storage.upgrade': 'ترقية الخطة',
      'user.role': 'مديرة النظام',

      'top.search': 'ابحث في المستندات والمحتوى والأشخاص…',
      'top.upload': 'رفع مستند',

      'notif.title': 'الإشعارات',
      'notif.mark': 'تحديد الكل كمقروء',
      'notif.1.title': 'تم اعتماد عقد الخدمة SLA',
      'notif.1.sub': 'وقّعه د. خالد — شركة أفق التقنية',
      'notif.1.time': 'منذ 5 دقائق',
      'notif.2.title': 'اكتمل استخراج بيانات 12 مستندًا',
      'notif.2.sub': 'ثقة متوسطة 97.4% — جاهزة للمراجعة',
      'notif.2.time': 'منذ 22 دقيقة',
      'notif.3.title': 'طلب توقيع بانتظارك',
      'notif.3.sub': 'محضر مجلس القسم — كلية الهندسة',
      'notif.3.time': 'منذ ساعة',
      'notif.all': 'عرض كل الإشعارات',

      'page.eyebrow': 'لوحة التحكم',
      'page.greeting': 'مرحبًا بعودتك، سارة',
      'page.subtitle': 'إليك نظرة سريعة على أرشيف مؤسستك اليوم. هناك {n} مستندًا بانتظار الاعتماد.',
      'page.scan': 'مسح ضوئي',
      'page.upload': 'مستند جديد',
      'sector.edu': 'تعليمي',
      'sector.corp': 'مؤسسي',

      'kpi.docs': 'إجمالي المستندات',
      'kpi.docs.sub': '+1,240 هذا الشهر',
      'kpi.pending': 'بانتظار الاعتماد',
      'kpi.pending.badge': '5 عاجلة',
      'kpi.pending.sub': 'متوسط زمن الاعتماد: 1.4 يوم',
      'kpi.ai': 'دقة الاستخراج الذكي',
      'kpi.ai.sub': 'عربي + إنجليزي · آخر 30 يومًا',
      'kpi.storage': 'المساحة المستخدمة',
      'kpi.storage.badge': 'الخطة الاحترافية',
      'kpi.storage.sub': '1.36 TB من أصل 2 TB',

      'chart.title': 'نشاط الأرشفة',
      'chart.sub': 'المستندات المرفوعة مقابل المعالجة آليًا',
      'chart.days': 'أيام',
      'chart.day': 'يومًا',
      'chart.month': 'شهرًا',
      'chart.uploaded': 'تم رفعها',
      'chart.processed': 'معالجة آليًا',
      'chart.summary.7': '1,240 مستندًا هذا الأسبوع',
      'chart.summary.30': '6,800 مستند هذا الشهر',
      'chart.summary.12': '49,210 مستندًا هذا العام',

      'table.title': 'أحدث المستندات',
      'table.sub': 'مرتبة حسب آخر نشاط',
      'table.search': 'بحث سريع…',
      'table.filter': 'تصفية',
      'table.export': 'تصدير',
      'table.tab.all': 'الكل',
      'table.tab.pending': 'بانتظار الاعتماد',
      'table.tab.signed': 'موقّع',
      'table.tab.approved': 'معتمد',
      'table.col.doc': 'المستند',
      'table.col.category': 'التصنيف',
      'table.col.linked': 'مرتبط بـ',
      'table.col.owner': 'المسؤول',
      'table.col.date': 'التاريخ',
      'table.col.status': 'الحالة',
      'table.empty': 'لا توجد مستندات مطابقة',
      'table.count': 'عرض {shown} من {total} مستندًا',

      'ai.title': 'مساعد الأرشيف',
      'ai.sub': 'اسأل أرشيفك بلغتك الطبيعية',
      'ai.placeholder': 'ما مدة الإشعار في عقد الخدمة؟',
      'ai.send': 'إرسال',
      'ai.answerLabel': 'إجابة موثّقة',
      'ai.open': 'فتح البحث الدلالي',

      'workflow.title': 'بحاجة إلى توقيعك',
      'workflow.sub': '2 من 3 مستندات',
      'workflow.badge': 'عاجل',
      'workflow.open': 'فتح مركز التوقيع',
      'workflow.due.today': 'اليوم',
      'workflow.due.tomorrow': 'غدًا',
      'workflow.due.2days': 'بعد يومين',

      'audit.title': 'سجل النشاط',
      'audit.sub': 'آخر العمليات على الأرشيف',
      'audit.all': 'عرض الكل',
      'audit.open': 'عرض سجل المراجعة الكامل',

      'cat.title': 'توزيع التصنيفات',
      'cat.sub': 'أعلى 5 تصنيفات هذا الشهر',

      'footer.tagline': 'الأرشيف الذي يفكّر',
      'footer.help': 'المساعدة',
      'footer.privacy': 'الخصوصية',
      'footer.demo': 'نموذج تفاعلي',

      'drawer.internal': 'داخلي',
      'drawer.download': 'تنزيل',
      'drawer.more': 'المزيد',
      'drawer.tab.overview': 'نظرة عامة',
      'drawer.tab.content': 'المحتوى',
      'drawer.tab.audit': 'سجل المراجعة',
      'drawer.signature': 'التوقيع المعتمد',
      'drawer.approved': 'معتمد',
      'drawer.aiFields': 'البيانات المستخرجة آليًا',
      'drawer.fields': 'حقول',
      'drawer.aiNote': 'راجع الحقول منخفضة الثقة قبل الاعتماد النهائي.',
      'drawer.links': 'الروابط والبيانات الوصفية',
      'drawer.ocr': 'النص المستخرج (OCR)',
      'drawer.ocrSub': 'عربي · إنجليزي · 4 صفحات',
      'drawer.copy': 'نسخ النص',
      'drawer.rerun': 'إعادة المعالجة',
      'drawer.share': 'مشاركة',
      'drawer.sign': 'توقيع واعتماد',

      'upload.title': 'رفع مستندات جديدة',
      'upload.sub': 'ستتم المعالجة بالـ OCR والذكاء الاصطناعي تلقائيًا بعد الرفع.',
      'upload.drop': 'أفلت الملفات هنا',
      'upload.or': 'أو',
      'upload.browse': 'تصفّح من جهازك',
      'upload.types': 'PDF, JPG, PNG, DOCX · حتى 200 MB لكل ملف',
      'upload.category': 'التصنيف',
      'upload.confidentiality': 'درجة السرية',
      'upload.internal': 'داخلي',
      'upload.confidential': 'سري',
      'upload.public': 'عام',
      'upload.ocr': 'استخراج النص (OCR)',
      'upload.ocr.sub': 'عربي + إنجليزي، مع الحفاظ على التنسيق',
      'upload.ai': 'تصنيف واستخراج ذكي',
      'upload.ai.sub': 'اقتراح التصنيف والحقول المفتاحية تلقائيًا',
      'upload.notify': 'إشعار المسؤول',
      'upload.notify.sub': 'إرسال تنبيه بعد اكتمال المعالجة',
      'upload.uploading': 'جارٍ الرفع والمعالجة…',
      'upload.cancel': 'إلغاء',
      'upload.start': 'بدء الرفع',

      'palette.title': 'البحث الشامل',
      'palette.placeholder': 'اكتب للبحث في المستندات والمحتوى أو تنفيذ إجراء…',
      'palette.nav': 'للتنقل',
      'palette.open': 'للفتح',
      'palette.close': 'للإغلاق',
      'palette.actions': 'إجراءات سريعة',
      'palette.docs': 'مستندات',
      'palette.cats': 'تصنيفات',
      'palette.upload': 'رفع مستند جديد',
      'palette.scan': 'مسح ضوئي مباشر',
      'palette.folder': 'إنشاء مجلد',
      'palette.invite': 'دعوة عضو للفريق',
      'palette.noresults': 'لا توجد نتائج مطابقة',

      'cat.academic': 'السجلات الأكاديمية',
      'cat.certificates': 'الشهادات',
      'cat.correspondence': 'المراسلات الإدارية',
      'cat.circulars': 'التعاميم',
      'cat.contracts': 'العقود والاتفاقيات',
      'cat.invoices': 'الفواتير والملفات الضريبية',
      'cat.projects': 'وثائق المشاريع',
      'cat.bids': 'العطاءات وطلبات العروض',
      'cat.hr': 'الموارد البشرية',
      'cat.minutes': 'المحاضر والقرارات',

      'status.approved': 'معتمد',
      'status.pending': 'بانتظار الاعتماد',
      'status.signed': 'موقّع',
      'status.processing': 'قيد المعالجة',
      'status.archived': 'مؤرشف',
      'status.rejected': 'مرفوض',

      'link.student': 'طالب',
      'link.dept': 'قسم',
      'link.client': 'عميل',
      'link.project': 'مشروع',
      'link.university': 'الجامعة',
      'link.category': 'تصنيف',

      'field.studentName': 'اسم الطالب',
      'field.academicNo': 'الرقم الأكاديمي',
      'field.program': 'البرنامج',
      'field.issueDate': 'تاريخ الإصدار',
      'field.gpa': 'المعدل التراكمي',
      'field.client': 'اسم العميل',
      'field.contractNo': 'رقم العقد',
      'field.value': 'قيمة العقد',
      'field.startDate': 'تاريخ البدء',
      'field.notice': 'مدة الإشعار',

      'meta.category': 'التصنيف',
      'meta.owner': 'المسؤول',
      'meta.version': 'الإصدار',
      'meta.pages': 'الصفحات',
      'meta.size': 'الحجم',
      'meta.retention': 'مدة الاحتفاظ',
      'meta.confidentiality': 'السرية',
      'meta.language': 'اللغة',
      'meta.retentionValue': '7 سنوات',
      'meta.internal': 'داخلي',
      'meta.languageValue': 'عربي / إنجليزي',
      'meta.versionValue': '2.0',
      'meta.pagesValue': '4 صفحات',
      'meta.sizeValue': '2.4 MB',

      'toast.upgrade': 'سيتم نقلك إلى صفحة الخطط والاشتراك.',
      'toast.logout': 'تم إنهاء الجلسة التجريبية.',
      'toast.notif': 'تم فتح الإشعار.',
      'toast.profile': 'قائمة الحساب ستظهر هنا.',
      'toast.filter': 'لوحة التصفية المتقدمة ستظهر هنا.',
      'toast.export': 'تم تجهيز ملف Excel للتصدير (تجريبي).',
      'toast.page': 'هذه نسخة تجريبية — بقية الصفحات غير متاحة.',
      'toast.section': 'هذه الشاشة ضمن المرحلة التالية من النموذج.',
      'toast.ai': 'سيتم فتح البحث الدلالي الكامل.',
      'toast.workflow': 'مركز التوقيع: 3 مستندات بانتظارك.',
      'toast.audit': 'سجل المراجعة الكامل (Append-only).',
      'toast.help': 'مركز المساعدة والدعم.',
      'toast.privacy': 'سياسة الخصوصية وحماية البيانات.',
      'toast.download': 'بدأ تنزيل نسخة موقّعة من المستند.',
      'toast.more': 'إجراءات إضافية: نقل، مشاركة، حظر.',
      'toast.share': 'تم إنشاء رابط مشاركة صالح لمدة 24 ساعة.',
      'toast.sign': 'تم إرسال المستند إلى مسار التوقيع.',
      'toast.copy': 'تم نسخ النص المستخرج.',
      'toast.ocr': 'أُعيدت جدولة المعالجة بالـ OCR.',
      'toast.upload': 'تم رفع المستند وبدأت المعالجة الذكية.',
      'toast.ocrdone': 'اكتملت معالجة المستند واستخراج الحقول.',
      'toast.markread': 'تم تحديد جميع الإشعارات كمقروءة.',
      'toast.scan': 'جارٍ فتح الماسح الضوئي (تجريبي).',
      'toast.folder': 'تم إنشاء مجلد جديد (تجريبي).',
      'toast.invite': 'تم إرسال دعوة للعضو الجديد.',
      'toast.category': 'تم فتح التصنيف.',
      'toast.ai.answer': 'تم توليد إجابة جديدة من 3 مصادر موثّقة.',
      'toast.no.file': 'اختر ملفًا أولًا أو استخدم بيانات تجريبية.',

      'notif.markread.short': 'تم التحديث',
    },

    en: {
      'doc.title': 'Archifex | Dashboard - by MadarFalak',
      'a11y.skip': 'Skip to content',
      'a11y.close': 'Close',
      'a11y.logout': 'Sign out',
      'a11y.menu': 'Menu',
      'a11y.theme': 'Toggle theme',
      'a11y.notifications': 'Notifications',

      'nav.group.main': 'Workspace',
      'nav.dashboard': 'Dashboard',
      'nav.documents': 'Documents',
      'nav.search': 'Smart search',
      'nav.workflows': 'Workflows & signing',
      'nav.group.library': 'Library',
      'nav.categories': 'Categories',
      'nav.projects': 'Projects & departments',
      'nav.cold': 'Cold archive',
      'nav.group.gov': 'Governance',
      'nav.users': 'Users & permissions',
      'nav.audit': 'Audit log',
      'nav.settings': 'Settings',
      'nav.entities.edu': 'Students',
      'nav.entities.corp': 'Clients',
      'nav.workspace.edu': 'Education workspace',
      'nav.workspace.corp': 'Corporate workspace',

      'storage.title': 'Storage',
      'storage.used': '1.36 TB of 2 TB',
      'storage.upgrade': 'Upgrade plan',
      'user.role': 'System administrator',

      'top.search': 'Search documents, content, people…',
      'top.upload': 'Upload',

      'notif.title': 'Notifications',
      'notif.mark': 'Mark all read',
      'notif.1.title': 'SLA agreement approved',
      'notif.1.sub': 'Signed by Dr. Khalid — Ufuq Technologies',
      'notif.1.time': '5 minutes ago',
      'notif.2.title': 'Data extracted from 12 documents',
      'notif.2.sub': '97.4% average confidence — ready for review',
      'notif.2.time': '22 minutes ago',
      'notif.3.title': 'Signature request pending',
      'notif.3.sub': 'Department council minutes — Engineering',
      'notif.3.time': '1 hour ago',
      'notif.all': 'View all notifications',

      'page.eyebrow': 'Dashboard',
      'page.greeting': 'Welcome back, Sarah',
      'page.subtitle': "Here is a quick look at your organization's archive. {n} documents are awaiting approval.",
      'page.scan': 'Scan',
      'page.upload': 'New document',
      'sector.edu': 'Education',
      'sector.corp': 'Enterprise',

      'kpi.docs': 'Total documents',
      'kpi.docs.sub': '+1,240 this month',
      'kpi.pending': 'Awaiting approval',
      'kpi.pending.badge': '5 urgent',
      'kpi.pending.sub': 'Average approval time: 1.4 days',
      'kpi.ai': 'AI extraction accuracy',
      'kpi.ai.sub': 'Arabic + English · last 30 days',
      'kpi.storage': 'Storage used',
      'kpi.storage.badge': 'Professional plan',
      'kpi.storage.sub': '1.36 TB of 2 TB',

      'chart.title': 'Archiving activity',
      'chart.sub': 'Uploaded vs. automatically processed',
      'chart.days': 'days',
      'chart.day': 'days',
      'chart.month': 'months',
      'chart.uploaded': 'Uploaded',
      'chart.processed': 'Auto-processed',
      'chart.summary.7': '1,240 documents this week',
      'chart.summary.30': '6,800 documents this month',
      'chart.summary.12': '49,210 documents this year',

      'table.title': 'Latest documents',
      'table.sub': 'Sorted by most recent activity',
      'table.search': 'Quick search…',
      'table.filter': 'Filter',
      'table.export': 'Export',
      'table.tab.all': 'All',
      'table.tab.pending': 'Awaiting approval',
      'table.tab.signed': 'Signed',
      'table.tab.approved': 'Approved',
      'table.col.doc': 'Document',
      'table.col.category': 'Category',
      'table.col.linked': 'Linked to',
      'table.col.owner': 'Owner',
      'table.col.date': 'Date',
      'table.col.status': 'Status',
      'table.empty': 'No matching documents',
      'table.count': 'Showing {shown} of {total} documents',

      'ai.title': 'Archive assistant',
      'ai.sub': 'Ask your archive in natural language',
      'ai.placeholder': 'What is the notice period in the service agreement?',
      'ai.send': 'Send',
      'ai.answerLabel': 'Grounded answer',
      'ai.open': 'Open semantic search',

      'workflow.title': 'Awaiting your signature',
      'workflow.sub': '2 of 3 documents',
      'workflow.badge': 'Urgent',
      'workflow.open': 'Open signing center',
      'workflow.due.today': 'Due today',
      'workflow.due.tomorrow': 'Due tomorrow',
      'workflow.due.2days': 'Due in 2 days',

      'audit.title': 'Activity log',
      'audit.sub': 'Latest archive operations',
      'audit.all': 'View all',
      'audit.open': 'View full audit log',

      'cat.title': 'Category distribution',
      'cat.sub': 'Top 5 categories this month',

      'footer.tagline': 'The archive that thinks',
      'footer.help': 'Help',
      'footer.privacy': 'Privacy',
      'footer.demo': 'Interactive prototype',

      'drawer.internal': 'Internal',
      'drawer.download': 'Download',
      'drawer.more': 'More',
      'drawer.tab.overview': 'Overview',
      'drawer.tab.content': 'Content',
      'drawer.tab.audit': 'Audit trail',
      'drawer.signature': 'Authorized signature',
      'drawer.approved': 'Approved',
      'drawer.aiFields': 'AI-extracted fields',
      'drawer.fields': 'fields',
      'drawer.aiNote': 'Review low-confidence fields before final approval.',
      'drawer.links': 'Links & metadata',
      'drawer.ocr': 'Extracted text (OCR)',
      'drawer.ocrSub': 'Arabic · English · 4 pages',
      'drawer.copy': 'Copy text',
      'drawer.rerun': 'Re-run OCR',
      'drawer.share': 'Share',
      'drawer.sign': 'Sign & approve',

      'upload.title': 'Upload new documents',
      'upload.sub': 'OCR and AI extraction run automatically after upload.',
      'upload.drop': 'Drop files here',
      'upload.or': 'or',
      'upload.browse': 'browse your device',
      'upload.types': 'PDF, JPG, PNG, DOCX · up to 200 MB each',
      'upload.category': 'Category',
      'upload.confidentiality': 'Confidentiality',
      'upload.internal': 'Internal',
      'upload.confidential': 'Confidential',
      'upload.public': 'Public',
      'upload.ocr': 'Text extraction (OCR)',
      'upload.ocr.sub': 'Arabic + English, layout preserved',
      'upload.ai': 'AI classification & extraction',
      'upload.ai.sub': 'Suggest category and key fields automatically',
      'upload.notify': 'Notify reviewer',
      'upload.notify.sub': 'Send an alert when processing is complete',
      'upload.uploading': 'Uploading & processing…',
      'upload.cancel': 'Cancel',
      'upload.start': 'Start upload',

      'palette.title': 'Global search',
      'palette.placeholder': 'Search documents and content, or run an action…',
      'palette.nav': 'to navigate',
      'palette.open': 'to open',
      'palette.close': 'to close',
      'palette.actions': 'Quick actions',
      'palette.docs': 'Documents',
      'palette.cats': 'Categories',
      'palette.upload': 'Upload a new document',
      'palette.scan': 'Start a live scan',
      'palette.folder': 'Create a folder',
      'palette.invite': 'Invite a team member',
      'palette.noresults': 'No matching results',

      'cat.academic': 'Academic records',
      'cat.certificates': 'Certificates',
      'cat.correspondence': 'Administrative correspondence',
      'cat.circulars': 'Circulars',
      'cat.contracts': 'Contracts & agreements',
      'cat.invoices': 'Invoices & tax files',
      'cat.projects': 'Project documents',
      'cat.bids': 'Bids & RFPs',
      'cat.hr': 'Human resources',
      'cat.minutes': 'Minutes & resolutions',

      'status.approved': 'Approved',
      'status.pending': 'Pending approval',
      'status.signed': 'Signed',
      'status.processing': 'Processing',
      'status.archived': 'Archived',
      'status.rejected': 'Rejected',

      'link.student': 'Student',
      'link.dept': 'Department',
      'link.client': 'Client',
      'link.project': 'Project',
      'link.university': 'University',
      'link.category': 'Category',

      'field.studentName': 'Student name',
      'field.academicNo': 'Academic ID',
      'field.program': 'Program',
      'field.issueDate': 'Issue date',
      'field.gpa': 'GPA',
      'field.client': 'Client name',
      'field.contractNo': 'Contract no.',
      'field.value': 'Contract value',
      'field.startDate': 'Start date',
      'field.notice': 'Notice period',

      'meta.category': 'Category',
      'meta.owner': 'Owner',
      'meta.version': 'Version',
      'meta.pages': 'Pages',
      'meta.size': 'Size',
      'meta.retention': 'Retention',
      'meta.confidentiality': 'Confidentiality',
      'meta.language': 'Language',
      'meta.retentionValue': '7 years',
      'meta.internal': 'Internal',
      'meta.languageValue': 'Arabic / English',
      'meta.versionValue': '2.0',
      'meta.pagesValue': '4 pages',
      'meta.sizeValue': '2.4 MB',

      'toast.upgrade': 'Opening plans and subscription.',
      'toast.logout': 'Demo session ended.',
      'toast.notif': 'Notification opened.',
      'toast.profile': 'Account menu will appear here.',
      'toast.filter': 'Advanced filter panel will appear here.',
      'toast.export': 'Excel export prepared (demo).',
      'toast.page': 'Prototype only — additional pages are not wired up.',
      'toast.section': 'This screen is part of the next prototype phase.',
      'toast.ai': 'Opening full semantic search.',
      'toast.workflow': 'Signing center: 3 documents awaiting you.',
      'toast.audit': 'Full append-only audit log.',
      'toast.help': 'Help & support center.',
      'toast.privacy': 'Privacy and data protection policy.',
      'toast.download': 'Downloading the signed copy.',
      'toast.more': 'More actions: move, share, legal hold.',
      'toast.share': 'Share link created and valid for 24 hours.',
      'toast.sign': 'Document sent to the signature workflow.',
      'toast.copy': 'Extracted text copied.',
      'toast.ocr': 'OCR re-processing scheduled.',
      'toast.upload': 'Document uploaded — smart processing started.',
      'toast.ocrdone': 'Processing complete; fields extracted.',
      'toast.markread': 'All notifications marked as read.',
      'toast.scan': 'Opening the document scanner (demo).',
      'toast.folder': 'New folder created (demo).',
      'toast.invite': 'Invitation sent to the new member.',
      'toast.category': 'Category opened.',
      'toast.ai.answer': 'New answer generated from 3 grounded sources.',
      'toast.no.file': 'Choose a file first, or use the demo file.',

      'notif.markread.short': 'Updated',
    },
  };

  const t = (key) => T[state.lang][key] ?? T.ar[key] ?? key;

  const locale = () => (state.lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB');
  const fmtNum = (n) => new Intl.NumberFormat('en-US').format(n);
  const fmtDate = (iso, options = { day: 'numeric', month: 'short' }) =>
    new Intl.DateTimeFormat(locale(), options).format(new Date(`${iso}T12:00:00`));

  /* ---------------------------------------------------------------------
     Demo data
     --------------------------------------------------------------------- */
  const LINK = {
    student: 'link.student',
    dept: 'link.dept',
    client: 'link.client',
    project: 'link.project',
    university: 'link.university',
  };

  const DATA = {
    edu: {
      workspace: L('جامعة النور', 'Al-Noor University'),
      kpis: {
        docs: 24860,
        delta: '12.4%',
        pending: 18,
        accuracy: '98.2%',
        storage: 68,
        docsSub: L('+1,240 هذا الشهر', '+1,240 this month'),
        pendingSub: L('متوسط زمن الاعتماد: 1.4 يوم', 'Average approval time: 1.4 days'),
        aiSub: L('عربي + إنجليزي · آخر 30 يومًا', 'Arabic + English · last 30 days'),
        storageSub: L('1.36 TB من أصل 2 TB', '1.36 TB of 2 TB'),
      },
      docs: [
        {
          id: 'edu-1',
          title: L('شهادة تخرج — أحمد الشامي', 'Graduation certificate — Ahmed Al-Shami'),
          ext: 'pdf',
          meta: 'PDF · 2.4 MB',
          category: 'cat.academic',
          linkType: 'student',
          linkValue: '2023-1045',
          owner: L('سارة العتيبي', 'Sarah Alotaibi'),
          initials: 'SA',
          date: '2026-10-12',
          status: 'approved',
        },
        {
          id: 'edu-2',
          title: L('قرار تكليف رقم ٤٤٧', 'Assignment decision No. 447'),
          ext: 'pdf',
          meta: 'PDF · 1.1 MB',
          category: 'cat.correspondence',
          linkType: 'dept',
          linkValue: L('علوم الحاسب', 'Computer Science'),
          owner: L('خالد الحربي', 'Khalid Alharbi'),
          initials: 'KH',
          date: '2026-10-11',
          status: 'pending',
        },
        {
          id: 'edu-3',
          title: L('كشف درجات — ليان عبدالله', 'Transcript — Layan Abdullah'),
          ext: 'doc',
          meta: 'DOCX · 680 KB',
          category: 'cat.academic',
          linkType: 'student',
          linkValue: '2022-0871',
          owner: L('سارة العتيبي', 'Sarah Alotaibi'),
          initials: 'SA',
          date: '2026-10-10',
          status: 'signed',
        },
        {
          id: 'edu-4',
          title: L('تعميم بدء الفصل الثاني', 'Second semester circular'),
          ext: 'pdf',
          meta: 'PDF · 420 KB',
          category: 'cat.circulars',
          linkType: 'university',
          linkValue: L('الجامعة', 'University'),
          owner: L('منى الزهراني', 'Mona Alzahrani'),
          initials: 'MZ',
          date: '2026-10-09',
          status: 'approved',
        },
        {
          id: 'edu-5',
          title: L('عقد ابتعاث — عمر حسن', 'Scholarship contract — Omar Hassan'),
          ext: 'pdf',
          meta: 'PDF · 3.2 MB',
          category: 'cat.contracts',
          linkType: 'student',
          linkValue: '2021-0342',
          owner: L('خالد الحربي', 'Khalid Alharbi'),
          initials: 'KH',
          date: '2026-10-08',
          status: 'processing',
        },
        {
          id: 'edu-6',
          title: L('محضر مجلس القسم — الهندسة', 'Department council minutes — Engineering'),
          ext: 'pdf',
          meta: 'PDF · 890 KB',
          category: 'cat.minutes',
          linkType: 'dept',
          linkValue: L('كلية الهندسة', 'Engineering'),
          owner: L('سارة العتيبي', 'Sarah Alotaibi'),
          initials: 'SA',
          date: '2026-10-07',
          status: 'archived',
        },
      ],
      ai: {
        suggestions: [
          L('شروط الابتعاث في قرار ٤٤٧', 'Scholarship terms in decision 447'),
          L('الطلاب المتأخرون عن السداد', 'Students with overdue payments'),
          L('ملخص محضر مجلس القسم', 'Summarize the council minutes'),
        ],
        question: L('ما شروط الابتعاث في قرار التكليف رقم ٤٤٧؟', 'What are the scholarship terms in assignment decision 447?'),
        answer: L(
          'يشترط القرار <mark>معدلًا تراكميًا لا يقل عن 3.50</mark> و<mark>خدمة سنة واحدة</mark> بعد التخرج، مع تعهد خطي من ولي الأمر. تنطبق الشروط على المقبولين بدءًا من الفصل الثاني 2026.',
          'The decision requires a <mark>GPA of at least 3.50</mark> and <mark>one year of service</mark> after graduation, plus a written guardian commitment. Terms apply to candidates admitted from the second semester of 2026.'
        ),
        sources: [
          L('قرار تكليف ٤٤٧ · ص 2', 'Decision 447 · p. 2'),
          L('لائحة الابتعاث ٢٠٢٥ · م 3', 'Scholarship policy 2025 · art. 3'),
          L('سجل الطالب 2021-0342', 'Student record 2021-0342'),
        ],
      },
      workflow: [
        {
          docId: 'edu-6',
          name: L('محضر مجلس القسم — الهندسة', 'Council minutes — Engineering'),
          meta: L('كلية الهندسة', 'Engineering'),
          due: 'today',
          initials: 'KH',
          ext: 'pdf',
        },
        {
          docId: 'edu-2',
          name: L('قرار تكليف رقم ٤٤٧', 'Assignment decision No. 447'),
          meta: L('علوم الحاسب', 'Computer Science'),
          due: 'tomorrow',
          initials: 'MZ',
          ext: 'pdf',
        },
        {
          docId: 'edu-5',
          name: L('عقد ابتعاث — عمر حسن', 'Scholarship contract — Omar Hassan'),
          meta: L('السجلات الأكاديمية', 'Academic records'),
          due: '2days',
          initials: 'SA',
          ext: 'pdf',
        },
      ],
      audit: [
        {
          icon: 'ok',
          text: L('اعتمدت <strong>سارة العتيبي</strong> شهادة تخرج', '<strong>Sarah Alotaibi</strong> approved a graduation certificate'),
          time: L('منذ 5 دقائق', '5 min ago'),
        },
        {
          icon: 'ai',
          text: L('استخرج الذكاء الاصطناعي <strong>5 حقول</strong> من عقد ابتعاث', 'AI extracted <strong>5 fields</strong> from a scholarship contract'),
          time: L('منذ 18 دقيقة', '18 min ago'),
        },
        {
          icon: '',
          text: L('رفع <strong>خالد الحربي</strong> قرار تكليف جديد', '<strong>Khalid Alharbi</strong> uploaded a new assignment decision'),
          time: L('منذ 42 دقيقة', '42 min ago'),
        },
        {
          icon: 'warn',
          text: L('طلب <strong>ياسر العمري</strong> نسخة من كشف درجات', '<strong>Yasser Alamri</strong> requested a transcript copy'),
          time: L('منذ ساعة', '1 hour ago'),
        },
      ],
      cats: [
        { key: 'cat.academic', count: '8,450', pct: 34 },
        { key: 'cat.certificates', count: '5,470', pct: 22 },
        { key: 'cat.correspondence', count: '4,480', pct: 18 },
        { key: 'cat.circulars', count: '3,470', pct: 14 },
        { key: 'cat.contracts', count: '2,980', pct: 12 },
      ],
      drawer: {
        entity: L('جامعة النور', 'Al-Noor University'),
        dept: L('عمادة شؤون الطلاب', 'Deanship of Student Affairs'),
        paperTitle: L('شهادة تخرج', 'Graduation Certificate'),
        ref: 'REF 2026/447',
        fields: [
          { key: 'field.studentName', value: L('أحمد محمد الشامي', 'Ahmed Mohammed Al-Shami'), conf: 99 },
          { key: 'field.academicNo', value: '2023-1045', conf: 98 },
          { key: 'field.program', value: L('بكالوريوس علوم الحاسب', 'BSc Computer Science'), conf: 96 },
          { key: 'field.issueDate', value: L('12 أكتوبر 2026', '12 October 2026'), conf: 94 },
          { key: 'field.gpa', value: '3.82 / 4.00', conf: 88 },
        ],
        tags: [L('شهادة', 'Certificate'), L('دفعة 2026', 'Class of 2026'), L('معتمد', 'Verified')],
        ocr: L(
          'الجمهورية العربية — جامعة النور\nعمادة شؤون الطلاب — إدارة السجلات الأكاديمية\n\nتشهد الجامعة بأن الطالب [[أحمد محمد الشامي]]\nالرقم الأكاديمي: [[2023-1045]]\nقد أتم متطلبات درجة البكالوريوس في [[علوم الحاسب]]\nبتقدير عام جيد جدًا بمعدل تراكمي [[3.82 من 4.00]].\n\nتاريخ الإصدار: [[12 أكتوبر 2026]]\nرقم الوثيقة: UN-2026-88431\n\nهذه الوثيقة صادرة إلكترونيًا ويمكن التحقق منها عبر بوابة الجامعة.',
          'Republic of Arabia — Al-Noor University\nDeanship of Student Affairs — Academic Records\n\nThis certifies that student [[Ahmed Mohammed Al-Shami]]\nAcademic ID: [[2023-1045]]\nhas completed the requirements for the Bachelor of Science in [[Computer Science]]\nwith a GPA of [[3.82 out of 4.00]].\n\nIssue date: [[12 October 2026]]\nDocument no.: UN-2026-88431\n\nThis document is issued electronically and can be verified via the university portal.'
        ),
        timeline: [
          { dot: 'ok', title: L('تمت إضافة التوقيع الرقمي', 'Digital signature applied'), who: L('خالد الحربي', 'Khalid Alharbi'), time: L('12 أكتوبر 2026 · 14:32', '12 Oct 2026 · 14:32') },
          { dot: 'ai', title: L('اكتمل استخراج الحقول (5/5)', 'Field extraction completed (5/5)'), who: L('محرك Archifex AI', 'Archifex AI engine'), time: L('12 أكتوبر 2026 · 14:29', '12 Oct 2026 · 14:29') },
          { dot: '', title: L('اكتمل OCR عربي + إنجليزي', 'Arabic + English OCR completed'), who: L('خط المعالجة الآلي', 'Automation pipeline'), time: L('12 أكتوبر 2026 · 14:28', '12 Oct 2026 · 14:28') },
          { dot: 'warn', title: L('تم الرفع وإجراء فحص الفيروسات', 'Uploaded and virus-scanned'), who: L('سارة العتيبي', 'Sarah Alotaibi'), time: L('12 أكتوبر 2026 · 14:27', '12 Oct 2026 · 14:27') },
          { dot: '', title: L('إنشاء المستند في الأرشيف', 'Document created in archive'), who: L('سارة العتيبي', 'Sarah Alotaibi'), time: L('12 أكتوبر 2026 · 14:27', '12 Oct 2026 · 14:27') },
        ],
      },
    },

    corp: {
      workspace: L('شركة أفق التقنية', 'Ufuq Technologies'),
      kpis: {
        docs: 31420,
        delta: '8.7%',
        pending: 23,
        accuracy: '97.6%',
        storage: 74,
        docsSub: L('+2,110 هذا الشهر', '+2,110 this month'),
        pendingSub: L('متوسط زمن الاعتماد: 2.1 يوم', 'Average approval time: 2.1 days'),
        aiSub: L('عربي + إنجليزي · آخر 30 يومًا', 'Arabic + English · last 30 days'),
        storageSub: L('1.48 TB من أصل 2 TB', '1.48 TB of 2 TB'),
      },
      docs: [
        {
          id: 'corp-1',
          title: L('عقد خدمة SLA — أفق التقنية', 'Service agreement — Ufuq Technologies'),
          ext: 'pdf',
          meta: 'PDF · 4.2 MB',
          category: 'cat.contracts',
          linkType: 'client',
          linkValue: 'AFAQ',
          owner: L('ريم القحطاني', 'Reem Alqahtani'),
          initials: 'RC',
          date: '2026-10-12',
          status: 'approved',
        },
        {
          id: 'corp-2',
          title: L('فاتورة #INV-2041 — منصة نُور', 'Invoice #INV-2041 — Noor platform'),
          ext: 'pdf',
          meta: 'PDF · 760 KB',
          category: 'cat.invoices',
          linkType: 'project',
          linkValue: 'NOOR',
          owner: L('ياسر العمري', 'Yasser Alamri'),
          initials: 'YA',
          date: '2026-10-11',
          status: 'pending',
        },
        {
          id: 'corp-3',
          title: L('وثيقة متطلبات — تطبيق الرياض', 'Requirements — Riyadh app'),
          ext: 'doc',
          meta: 'DOCX · 1.8 MB',
          category: 'cat.projects',
          linkType: 'project',
          linkValue: 'RB-APP',
          owner: L('ريم القحطاني', 'Reem Alqahtani'),
          initials: 'RC',
          date: '2026-10-10',
          status: 'signed',
        },
        {
          id: 'corp-4',
          title: L('عرض فني RFP-88 — وزارة الاتصالات', 'Technical proposal RFP-88 — Ministry of Communications'),
          ext: 'pdf',
          meta: 'PDF · 6.1 MB',
          category: 'cat.bids',
          linkType: 'project',
          linkValue: 'RFP-88',
          owner: L('منى الزهراني', 'Mona Alzahrani'),
          initials: 'MZ',
          date: '2026-10-09',
          status: 'approved',
        },
        {
          id: 'corp-5',
          title: L('اتفاقية سرية NDA — سحابة', 'NDA — Sahaba Cloud'),
          ext: 'pdf',
          meta: 'PDF · 920 KB',
          category: 'cat.contracts',
          linkType: 'client',
          linkValue: 'SAHABA',
          owner: L('ياسر العمري', 'Yasser Alamri'),
          initials: 'YA',
          date: '2026-10-08',
          status: 'processing',
        },
        {
          id: 'corp-6',
          title: L('إقرار ضريبي Q3 — الإدارة المالية', 'Q3 tax filing — Finance'),
          ext: 'img',
          meta: 'JPG · 1.2 MB',
          category: 'cat.invoices',
          linkType: 'dept',
          linkValue: L('المالية', 'Finance'),
          owner: L('سارة العتيبي', 'Sarah Alotaibi'),
          initials: 'SA',
          date: '2026-10-07',
          status: 'archived',
        },
      ],
      ai: {
        suggestions: [
          L('مدة الإشعار في عقد SLA', 'Notice period in the SLA'),
          L('إجمالي فواتير Q3', 'Total Q3 invoices'),
          L('بنود السرية في NDA', 'Confidentiality clauses in the NDA'),
        ],
        question: L('ما مدة الإشعار المطلوبة لإنهاء عقد SLA مع أفق التقنية؟', 'What notice period is required to terminate the SLA with Ufuq?'),
        answer: L(
          'تنص المادة <mark>7.2</mark> على إشعار كتابي قبل <mark>60 يومًا</mark> من تاريخ الإنهاء، مع تسوية المستحقات خلال 30 يومًا. الاستثناء الوحيد هو الإخلال الجوهري (Material Breach).',
          'Clause <mark>7.2</mark> requires <mark>60 days</mark> written notice before termination, with outstanding fees settled within 30 days. The only exception is a material breach.'
        ),
        sources: [
          L('SLA-2026-041 · م 7.2', 'SLA-2026-041 · cl. 7.2'),
          L('ملحق الخدمات A', 'Service schedule A'),
          L('بريد الاعتماد 12 أكتوبر', 'Approval email, 12 Oct'),
        ],
      },
      workflow: [
        {
          docId: 'corp-1',
          name: L('عقد SLA — أفق التقنية', 'Service agreement — Ufuq'),
          meta: L('قيمة العقد: 480,000 ر.س', 'Contract value: SAR 480,000'),
          due: 'today',
          initials: 'KH',
          ext: 'pdf',
        },
        {
          docId: 'corp-2',
          name: L('فاتورة #INV-2041', 'Invoice #INV-2041'),
          meta: L('منصة نُور · 36,500 ر.س', 'Noor platform · SAR 36,500'),
          due: 'tomorrow',
          initials: 'MZ',
          ext: 'pdf',
        },
        {
          docId: 'corp-5',
          name: L('اتفاقية سرية NDA — سحابة', 'NDA — Sahaba Cloud'),
          meta: L('الإدارة القانونية', 'Legal department'),
          due: '2days',
          initials: 'SA',
          ext: 'pdf',
        },
      ],
      audit: [
        {
          icon: 'ok',
          text: L('اعتمدت <strong>ريم القحطاني</strong> عقد خدمة SLA', '<strong>Reem Alqahtani</strong> approved an SLA agreement'),
          time: L('منذ 7 دقائق', '7 min ago'),
        },
        {
          icon: 'ai',
          text: L('استخرج الذكاء الاصطناعي <strong>قيمة العقد ومدة الإشعار</strong>', 'AI extracted the <strong>contract value and notice period</strong>'),
          time: L('منذ 26 دقيقة', '26 min ago'),
        },
        {
          icon: '',
          text: L('رفع <strong>ياسر العمري</strong> فاتورة جديدة', '<strong>Yasser Alamri</strong> uploaded a new invoice'),
          time: L('منذ 51 دقيقة', '51 min ago'),
        },
        {
          icon: 'warn',
          text: L('شارك <strong>خالد الحربي</strong> رابطًا مؤقتًا مع عميل', '<strong>Khalid Alharbi</strong> shared a temporary client link'),
          time: L('منذ ساعتين', '2 hours ago'),
        },
      ],
      cats: [
        { key: 'cat.contracts', count: '9,740', pct: 31 },
        { key: 'cat.invoices', count: '7,540', pct: 24 },
        { key: 'cat.projects', count: '5,970', pct: 19 },
        { key: 'cat.bids', count: '4,400', pct: 14 },
        { key: 'cat.hr', count: '3,770', pct: 12 },
      ],
      drawer: {
        entity: L('شركة أفق التقنية', 'Ufuq Technologies'),
        dept: L('الإدارة القانونية', 'Legal Department'),
        paperTitle: L('عقد مستوى خدمة', 'Service Level Agreement'),
        ref: 'SLA-2026-041',
        fields: [
          { key: 'field.client', value: L('شركة أفق التقنية', 'Ufuq Technologies'), conf: 99 },
          { key: 'field.contractNo', value: 'SLA-2026-041', conf: 97 },
          { key: 'field.value', value: L('480,000 ر.س', 'SAR 480,000'), conf: 95 },
          { key: 'field.startDate', value: L('01 نوفمبر 2026', '01 November 2026'), conf: 93 },
          { key: 'field.notice', value: L('60 يومًا', '60 days'), conf: 86 },
        ],
        tags: [L('SLA', 'SLA'), L('أفق التقنية', 'Ufuq'), L('ساري', 'Active')],
        ocr: L(
          'اتفاقية مستوى الخدمة (SLA)\nبين: شركة أفق التقنية — الطرف الأول\nو: مؤسسة نُور الرقمية — الطرف الثاني\n\nرقم العقد: [[SLA-2026-041]]\nقيمة العقد: [[480,000 ريال سعودي]] سنويًا\nتاريخ البدء: [[01 نوفمبر 2026]]\nمدة الإشعار للإنهاء: [[60 يومًا]]\n\n7.2 يجوز لأي من الطرفين إنهاء الاتفاقية بإشعار كتابي قبل ستين (60) يومًا.\n7.3 تُسوّى المستحقات خلال ثلاثين (30) يومًا من تاريخ الإنهاء.\n\nملاحظة: يُعد الإخلال الجوهري سببًا للإنهاء الفوري دون إشعار.',
          'SERVICE LEVEL AGREEMENT (SLA)\nBetween: Ufuq Technologies — Party A\nAnd: Noor Digital — Party B\n\nContract no.: [[SLA-2026-041]]\nContract value: [[SAR 480,000]] per year\nStart date: [[01 November 2026]]\nTermination notice: [[60 days]]\n\n7.2 Either party may terminate this agreement with sixty (60) days prior written notice.\n7.3 Outstanding fees shall be settled within thirty (30) days of termination.\n\nNote: A material breach may result in immediate termination without notice.'
        ),
        timeline: [
          { dot: 'ok', title: L('تمت الموافقة النهائية', 'Final approval granted'), who: L('ريم القحطاني', 'Reem Alqahtani'), time: L('12 أكتوبر 2026 · 11:05', '12 Oct 2026 · 11:05') },
          { dot: 'ai', title: L('مراجعة الحقول المستخرجة (5/5)', 'Extracted fields reviewed (5/5)'), who: L('فريق العقود', 'Contracts team'), time: L('12 أكتوبر 2026 · 10:48', '12 Oct 2026 · 10:48') },
          { dot: '', title: L('اكتمل OCR عربي + إنجليزي', 'Arabic + English OCR completed'), who: L('خط المعالجة الآلي', 'Automation pipeline'), time: L('12 أكتوبر 2026 · 10:31', '12 Oct 2026 · 10:31') },
          { dot: 'warn', title: L('تم رفع النسخة الموقّعة', 'Signed copy uploaded'), who: L('ياسر العمري', 'Yasser Alamri'), time: L('12 أكتوبر 2026 · 10:29', '12 Oct 2026 · 10:29') },
          { dot: '', title: L('إنشاء المستند في مساحة العميل', 'Document created in client workspace'), who: L('ياسر العمري', 'Yasser Alamri'), time: L('12 أكتوبر 2026 · 10:29', '12 Oct 2026 · 10:29') },
        ],
      },
    },
  };

  const current = () => DATA[state.sector];

  /* ---------------------------------------------------------------------
     Theme & language
     --------------------------------------------------------------------- */
  function applyTheme(theme) {
    state.theme = theme;
    html.dataset.theme = theme;
    localStorage.setItem('archifex-theme', theme);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#E2E8F0' : '#0F172A');
    $('#themeToggle')?.setAttribute('aria-label', theme === 'light' ? t('a11y.theme') : t('a11y.theme'));
    drawChart();
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  function applyI18n() {
    const dict = T[state.lang];
    html.lang = state.lang;
    html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    document.title = t('doc.title');
    $('#langLabel').textContent = state.lang === 'ar' ? 'EN' : 'ع';
    $('#langToggle').setAttribute('aria-label', state.lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');

    $$('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    $$('[data-i18n-ph]').forEach((el) => {
      const key = el.dataset.i18nPh;
      if (dict[key] !== undefined) el.placeholder = dict[key];
    });
    $$('[data-i18n-aria]').forEach((el) => {
      const key = el.dataset.i18nAria;
      if (dict[key] !== undefined) el.setAttribute('aria-label', dict[key]);
    });
  }

  function setLanguage(lang) {
    state.lang = lang;
    localStorage.setItem('archifex-lang', lang);
    applyI18n();
    renderAll();
    if (state.doc) renderDrawer(state.doc);
  }

  function toggleLanguage() {
    setLanguage(state.lang === 'ar' ? 'en' : 'ar');
  }

  /* ---------------------------------------------------------------------
     Static + sector rendering
     --------------------------------------------------------------------- */
  function renderAll() {
    renderSector();
    renderDate();
    drawChart();
    renderAI();
    renderTable();
    renderWorkflow();
    renderAudit();
    renderCategories();
    renderPalette();
  }

  function renderDate() {
    const d = new Date('2026-10-20T12:00:00');
    $('#pageDate').textContent = new Intl.DateTimeFormat(locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  }

  function renderSector() {
    const data = current();
    $$('.seg-btn').forEach((btn) => {
      const active = btn.dataset.sector === state.sector;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    $('#workspaceName').textContent = pick(data.workspace);
    $('#workspaceType').textContent = t(`nav.workspace.${state.sector}`);
    $('#entitiesLabel').textContent = t(`nav.entities.${state.sector}`);
    const use = $('#entitiesIcon use');
    if (use) use.setAttribute('href', state.sector === 'edu' ? '#i-graduation' : '#i-users');

    $('#kpiDocs').textContent = fmtNum(data.kpis.docs);
    $('#kpiDocsDelta').textContent = data.kpis.delta;
    $('#kpiPending').textContent = fmtNum(data.kpis.pending);
    $('#kpiAccuracy').textContent = data.kpis.accuracy;
    $('#kpiStorage').textContent = `${data.kpis.storage}%`;

    const setSub = (key, value) => {
      const el = $(`[data-i18n="${key}"]`);
      if (el) el.textContent = pick(value);
    };
    setSub('kpi.docs.sub', data.kpis.docsSub);
    setSub('kpi.pending.sub', data.kpis.pendingSub);
    setSub('kpi.ai.sub', data.kpis.aiSub);
    setSub('kpi.storage.sub', data.kpis.storageSub);

    const subtitle = $('[data-i18n="page.subtitle"]');
    if (subtitle) subtitle.textContent = t('page.subtitle').replace('{n}', fmtNum(data.kpis.pending));

    const pct = $('.storage-pct');
    if (pct) pct.textContent = `${data.kpis.storage}%`;
    const bar = $('.storage-bar span');
    if (bar) bar.style.width = `${data.kpis.storage}%`;
    const meta = $('.storage-meta [data-i18n="storage.used"]');
    if (meta) meta.textContent = state.sector === 'edu' ? t('storage.used') : (state.lang === 'ar' ? '1.48 TB من 2 TB' : '1.48 TB of 2 TB');

    $$('.storage-track span, .confidence-track span').forEach((el) => {
      if (el.closest('.storage-track')) el.style.width = `${data.kpis.storage}%`;
    });
  }

  /* ---------------------------------------------------------------------
     Chart
     --------------------------------------------------------------------- */
  const CHART = {
    7: {
      uploaded: [118, 146, 132, 178, 164, 204, 232],
      processed: [96, 130, 118, 158, 148, 184, 208],
      labels: ['14', '15', '16', '17', '18', '19', '20'],
    },
    30: {
      uploaded: [420, 380, 460, 510, 490, 560, 610, 580, 650, 700, 680, 760],
      processed: [380, 350, 420, 470, 450, 520, 570, 540, 610, 650, 630, 720],
      labels: ['22/9', '29/9', '6/10', '13/10', '20/10'],
    },
    12: {
      uploaded: [3200, 2980, 3520, 3810, 3650, 4020, 4300, 4180, 4620, 4910, 4780, 5240],
      processed: [2900, 2760, 3240, 3520, 3390, 3760, 4020, 3900, 4310, 4580, 4470, 4890],
      labels: ['نوفمبر', 'يناير', 'مارس', 'مايو', 'يوليو', 'سبتمبر'],
    },
  };

  function smoothPath(points) {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
  }

  function drawChart() {
    const svg = $('#activityChart');
    if (!svg) return;
    const conf = CHART[state.range];
    const W = 760;
    const H = 260;
    const pad = { top: 18, right: 16, bottom: 30, left: 48 };
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;
    const all = [...conf.uploaded, ...conf.processed];
    const max = Math.ceil(Math.max(...all) / 100) * 100;
    const stepX = innerW / (conf.uploaded.length - 1);
    const toPoints = (arr) =>
      arr.map((v, i) => ({ x: pad.left + i * stepX, y: pad.top + innerH - (v / max) * innerH }));

    const up = toPoints(conf.uploaded);
    const proc = toPoints(conf.processed);
    const upPath = smoothPath(up);
    const procPath = smoothPath(proc);
    const areaPath = `${upPath} L ${up[up.length - 1].x.toFixed(2)} ${pad.top + innerH} L ${up[0].x.toFixed(2)} ${pad.top + innerH} Z`;
    const css = getComputedStyle(html);
    const chartLine = css.getPropertyValue('--chart-line').trim() || '#d9dce3';
    const chartLine2 = css.getPropertyValue('--chart-line-2').trim() || '#737681';
    const chartFill = css.getPropertyValue('--chart-fill').trim() || '#e9ebf0';

    const grid = [0, 0.25, 0.5, 0.75, 1]
      .map((f) => {
        const y = pad.top + innerH * f;
        const val = Math.round(max * (1 - f));
        return `<line class="grid-line" x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}"/>
          <text x="${pad.left - 10}" y="${y + 3}" text-anchor="end">${fmtNum(val)}</text>`;
      })
      .join('');

    const labels = conf.labels;
    const xLabels = labels
      .map((label, i) => {
        const x = pad.left + (i * innerW) / (labels.length - 1);
        return `<text class="axis-label" x="${x}" y="${H - 9}" text-anchor="middle">${esc(label)}</text>`;
      })
      .join('');

    const points = up
      .map(
        (p, i) => `
        <circle class="point" cx="${p.x}" cy="${p.y}" r="3" fill="var(--card)" stroke="var(--chart-line)" stroke-width="1.4">
          <title>${fmtNum(conf.uploaded[i])} · ${esc(labels[Math.min(i, labels.length - 1)])}</title>
        </circle>`
      )
      .join('');

    svg.innerHTML = `
      <defs>
        <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${chartFill}" stop-opacity="0.22"/>
          <stop offset="0.7" stop-color="${chartFill}" stop-opacity="0.045"/>
          <stop offset="1" stop-color="${chartFill}" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${chartLine}" stop-opacity="0.55"/>
          <stop offset="0.55" stop-color="${chartLine}"/>
          <stop offset="1" stop-color="${chartLine}"/>
        </linearGradient>
      </defs>
      ${grid}
      ${xLabels}
      <path d="${areaPath}" fill="url(#chartArea)"/>
      <path d="${procPath}" fill="none" stroke="${chartLine2}" stroke-width="1.4" stroke-dasharray="4 4" stroke-linecap="round" opacity="0.75"/>
      <path class="chart-line" pathLength="1" d="${upPath}" fill="none" stroke="url(#chartStroke)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
      ${points}
    `;

    const summary = $('#chartSummary');
    if (summary) summary.textContent = t(`chart.summary.${state.range}`);
    $$('.range-btn').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.range === String(state.range)));
  }

  /* ---------------------------------------------------------------------
     AI assistant
     --------------------------------------------------------------------- */
  function renderAI() {
    const ai = current().ai;
    $('#aiAnswerText').innerHTML = pick(ai.answer);
    $('#aiInput').placeholder = pick(ai.question);
    $('#aiSources').innerHTML = ai.sources
      .map(
        (s) =>
          `<span class="ai-source"><svg class="ic"><use href="#i-file"/></svg>${esc(pick(s))}</span>`
      )
      .join('');
    $('#aiSuggestions').innerHTML = ai.suggestions
      .map((s) => `<button class="ai-suggestion" type="button">${esc(pick(s))}</button>`)
      .join('');

    $$('.ai-suggestion').forEach((btn) => {
      btn.addEventListener('click', () => {
        $('#aiInput').value = btn.textContent;
        toast('toast.ai.answer');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Table
     --------------------------------------------------------------------- */
  function statusChip(status) {
    return `<span class="status-chip ${status}">${t(`status.${status}`)}</span>`;
  }

  function rowMatches(doc, query) {
    if (!query) return true;
    const haystack = [
      pick(doc.title),
      doc.title.ar,
      doc.title.en,
      t(doc.category),
      pick(doc.owner),
      pick(doc.linkValue),
      doc.linkValue,
      t(`status.${doc.status}`),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  }

  function renderTable() {
    // The dashboard shows the latest six; the Documents view paginates the full library.
    const docs = current().docs.slice(0, 6);
    const filtered = docs.filter(
      (doc) =>
        (state.filter === 'all' || doc.status === state.filter) &&
        rowMatches(doc, state.query.trim())
    );

    const body = $('#tableBody');
    body.innerHTML = filtered
      .map(
        (doc) => `
      <tr data-doc="${doc.id}">
        <td><input type="checkbox" aria-label="${esc(pick(doc.title))}" /></td>
        <td>
          <div class="doc-cell">
            <span class="file-badge ${doc.ext}">
              <svg class="ic"><use href="#i-${doc.ext === 'img' ? 'image' : 'file'}"/></svg>
              <em>${doc.ext === 'img' ? 'IMG' : doc.ext === 'doc' ? 'DOC' : 'PDF'}</em>
            </span>
            <span class="doc-name"><strong>${esc(pick(doc.title))}</strong><small>${esc(doc.meta)}</small></span>
          </div>
        </td>
        <td class="doc-cat">${esc(t(doc.category))}</td>
        <td>
          <span class="doc-link">
            <span>${esc(pick(doc.linkValue))}</span>
            <small>${esc(t(LINK[doc.linkType]))}</small>
          </span>
        </td>
        <td>
          <span class="owner-cell"><span class="avatar owner-av">${doc.initials}</span>${esc(pick(doc.owner))}</span>
        </td>
        <td><span class="doc-date">${fmtDate(doc.date)}</span></td>
        <td>${statusChip(doc.status)}</td>
        <td><button class="row-actions" type="button" data-toast="toast.more" aria-label="${esc(t('drawer.more'))}"><svg class="ic"><use href="#i-more"/></svg></button></td>
      </tr>`
      )
      .join('');

    $('#emptyState').hidden = filtered.length > 0;
    $('#tableCount').textContent = t('table.count')
      .replace('{shown}', fmtNum(filtered.length))
      .replace('{total}', fmtNum(current().kpis.docs));

    $$('.tab').forEach((tab) => {
      const active = tab.dataset.filter === state.filter;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    const selectAll = $('#selectAll');
    if (selectAll) selectAll.checked = false;

    body.querySelectorAll('tr').forEach((tr) => {
      tr.addEventListener('click', (e) => {
        if (e.target.closest('input, .row-actions')) return;
        openDrawer(tr.dataset.doc);
      });
      tr.querySelector('input')?.addEventListener('change', (e) => {
        tr.classList.toggle('is-selected', e.target.checked);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Workflow / audit / categories
     --------------------------------------------------------------------- */
  function renderWorkflow() {
    $('#workflowList').innerHTML = current().workflow
      .map(
        (item) => `
      <button class="workflow-item" type="button" data-open-doc="${item.docId}">
        <span class="workflow-ico"><svg class="ic"><use href="#i-file"/></svg></span>
        <span class="workflow-info">
          <span class="workflow-name">${esc(pick(item.name))}</span>
          <span class="workflow-meta"><span>${esc(pick(item.meta))}</span><span>·</span><span class="workflow-due">${esc(t(`workflow.due.${item.due}`))}</span></span>
        </span>
        <span class="avatar workflow-av">${item.initials}</span>
      </button>`
      )
      .join('');

    $$('[data-open-doc]').forEach((btn) => {
      btn.addEventListener('click', () => openDrawer(btn.dataset.openDoc));
    });
  }

  function renderAudit() {
    $('#auditList').innerHTML = current().audit
      .map(
        (item) => `
      <div class="audit-item">
        <span class="audit-ico ${item.icon}"><svg class="ic"><use href="#i-${item.icon === 'ai' ? 'sparkles' : item.icon === 'ok' ? 'check' : item.icon === 'warn' ? 'pen' : 'eye'}"/></svg></span>
        <span class="audit-body">
          <span class="audit-text">${pick(item.text)}</span>
          <span class="audit-time">${esc(pick(item.time))}</span>
        </span>
      </div>`
      )
      .join('');
  }

  function renderCategories() {
    $('#catList').innerHTML = current().cats
      .map(
        (cat) => `
      <div class="cat-row">
        <div class="cat-top">
          <span class="cat-name"><i class="cat-dot"></i>${esc(t(cat.key))}</span>
          <span class="cat-count">${cat.count}</span>
        </div>
        <div class="cat-track"><span style="width:${cat.pct}%"></span></div>
      </div>`
      )
      .join('');
  }

  /* ---------------------------------------------------------------------
     Drawer
     --------------------------------------------------------------------- */
  function findDoc(id) {
    return current().docs.find((doc) => doc.id === id);
  }

  function renderDrawer(doc) {
    const d = current().drawer;
    $('#drawerTitle').textContent = pick(doc.title);
    $('#drawerMeta').textContent = `${t(doc.category)} · ${doc.meta} · ${t('meta.pagesValue')}`;
    const status = $('#drawerStatus');
    status.className = `status-chip ${doc.status}`;
    status.textContent = t(`status.${doc.status}`);
    $('#drawerFileBadge').className = `file-badge ${doc.ext}`;

    $('#paperEntity').textContent = pick(d.entity);
    $('#paperDept').textContent = pick(d.dept);
    $('#paperTitle').textContent = pick(doc.title);
    $('.paper-ref').textContent = d.ref;

    $('#fieldList').innerHTML = d.fields
      .map((field) => {
        const cls = field.conf >= 95 ? 'conf-high' : field.conf >= 90 ? 'conf-mid' : 'conf-low';
        return `
        <div class="field-row">
          <span class="field-key">${esc(t(field.key))}</span>
          <span class="field-val">${esc(pick(field.value))}</span>
          <span class="field-conf">
            <span class="field-conf-track"><span class="${cls}" style="width:${field.conf}%"></span></span>
            <em>${field.conf}%</em>
          </span>
        </div>`;
      })
      .join('');

    const metaPairs = [
      ['meta.category', t(doc.category)],
      ['meta.owner', pick(doc.owner)],
      ['meta.version', t('meta.versionValue')],
      ['meta.pages', t('meta.pagesValue')],
      ['meta.size', t('meta.sizeValue')],
      ['meta.retention', t('meta.retentionValue')],
      ['meta.confidentiality', t('meta.internal')],
      ['meta.language', t('meta.languageValue')],
    ];
    $('#metaGrid').innerHTML = metaPairs
      .map(([key, value]) => `<div><dt>${esc(t(key))}</dt><dd>${esc(value)}</dd></div>`)
      .join('');

    $('#tagRow').innerHTML = d.tags.map((tag) => `<span class="tag">${esc(pick(tag))}</span>`).join('');
    $('#ocrBox').innerHTML = esc(pick(d.ocr)).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');
    $('#drawerTimeline').innerHTML = d.timeline
      .map(
        (item) => `
      <div class="timeline-item">
        <span class="timeline-dot ${item.dot}"></span>
        <span class="timeline-body">
          <strong>${esc(pick(item.title))}</strong>
          <span>${esc(pick(item.who))}</span>
          <time>${esc(pick(item.time))}</time>
        </span>
      </div>`
      )
      .join('');
  }

  function openDrawer(id) {
    const doc = findDoc(id);
    if (!doc) return;
    state.doc = doc;
    state.lastFocus = document.activeElement;
    renderDrawer(doc);
    $('#drawer').hidden = false;
    $('#drawerOverlay').hidden = false;
    document.body.style.overflow = 'hidden';
    $$('.dtab').forEach((tab, i) => tab.classList.toggle('is-active', i === 0));
    $$('.dpanel').forEach((panel, i) => panel.classList.toggle('is-active', i === 0));
    setTimeout(() => $('#drawerClose').focus(), 60);
  }

  function closeDrawer() {
    $('#drawer').hidden = true;
    $('#drawerOverlay').hidden = true;
    document.body.style.overflow = '';
    state.doc = null;
    state.lastFocus?.focus?.();
  }

  /* ---------------------------------------------------------------------
     Upload modal
     --------------------------------------------------------------------- */
  let pendingFiles = [];

  function openUpload() {
    $('#uploadModal').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#uploadProgress').hidden = true;
    $('#uploadBar').style.width = '0%';
    $('#uploadPct').textContent = '0%';
    $('#uploadStart').disabled = false;
    setTimeout(() => $('#dropzone').focus(), 60);
  }

  function closeUpload() {
    if (state.uploading) return;
    $('#uploadModal').hidden = true;
    document.body.style.overflow = state.doc ? 'hidden' : '';
    $('#fileInput').value = '';
    pendingFiles = [];
    $('#fileList').innerHTML = '';
    $('#uploadProgress').hidden = true;
  }

  function addFiles(files) {
    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      pendingFiles.push({
        name: file.name,
        size: file.size,
        ext: ext === 'png' || ext === 'jpg' || ext === 'jpeg' ? 'img' : ext === 'docx' || ext === 'doc' ? 'doc' : 'pdf',
      });
    });
    renderFileList();
  }

  function renderFileList() {
    $('#fileList').innerHTML = pendingFiles
      .map(
        (file, i) => `
      <div class="file-item">
        <span class="file-badge ${file.ext}"><svg class="ic"><use href="#i-${file.ext === 'img' ? 'image' : 'file'}"/></svg><em>${file.ext === 'img' ? 'IMG' : file.ext === 'doc' ? 'DOC' : 'PDF'}</em></span>
        <span class="file-item-info"><strong>${esc(file.name)}</strong><small>${(file.size / 1024 / 1024).toFixed(1)} MB</small></span>
        <button class="icon-btn" type="button" data-remove-file="${i}" aria-label="${esc(t('a11y.close'))}"><svg class="ic"><use href="#i-close"/></svg></button>
      </div>`
      )
      .join('');
    $$('[data-remove-file]').forEach((btn) => {
      btn.addEventListener('click', () => {
        pendingFiles.splice(Number(btn.dataset.removeFile), 1);
        renderFileList();
      });
    });
  }

  function startUpload() {
    if (state.uploading) return;
    if (!pendingFiles.length) {
      pendingFiles.push({ name: 'SLA-2026-041-signed.pdf', size: 2.4 * 1024 * 1024, ext: 'pdf' });
      renderFileList();
    }
    state.uploading = true;
    $('#uploadProgress').hidden = false;
    $('#uploadStart').disabled = true;
    let pct = 0;
    const timer = setInterval(() => {
      pct = Math.min(100, pct + Math.random() * 16 + 6);
      $('#uploadBar').style.width = `${pct}%`;
      $('#uploadPct').textContent = `${Math.round(pct)}%`;
      if (pct >= 100) {
        clearInterval(timer);
        const file = pendingFiles[0];
        setTimeout(() => {
          state.uploading = false;
          closeUpload();
          addUploadedRow(file.name);
          toast('toast.upload');
          setTimeout(() => toast('toast.ocrdone'), 3800);
        }, 500);
      }
    }, 180);
  }

  function addUploadedRow(filename) {
    const title = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const doc = {
      id: `upload-${Date.now()}`,
      title: L(title, title),
      ext: 'pdf',
      meta: 'PDF · 2.4 MB',
      category: 'cat.contracts',
      linkType: state.sector === 'edu' ? 'dept' : 'client',
      linkValue: state.sector === 'edu' ? L('علوم الحاسب', 'Computer Science') : 'AFAQ',
      owner: L('سارة العتيبي', 'Sarah Alotaibi'),
      initials: 'SA',
      date: '2026-10-20',
      status: 'processing',
    };
    current().docs.unshift(doc);
    state.filter = 'all';
    renderTable();
    setTimeout(() => {
      doc.status = 'approved';
      renderTable();
    }, 5200);
  }

  /* ---------------------------------------------------------------------
     Command palette
     --------------------------------------------------------------------- */
  function paletteItems() {
    const data = current();
    const items = [
      { type: 'action', id: 'upload', icon: 'upload', title: t('palette.upload'), sub: t('nav.documents'), kbd: 'U' },
      { type: 'action', id: 'scan', icon: 'scan', title: t('palette.scan'), sub: t('page.scan'), kbd: 'S' },
      { type: 'action', id: 'folder', icon: 'folder', title: t('palette.folder'), sub: t('nav.categories'), kbd: 'F' },
      { type: 'action', id: 'invite', icon: 'users', title: t('palette.invite'), sub: t('nav.users'), kbd: 'I' },
      ...data.docs.slice(0, 4).map((doc) => ({
        type: 'doc',
        id: doc.id,
        icon: doc.ext === 'img' ? 'image' : 'file',
        title: pick(doc.title),
        sub: `${t(doc.category)} · ${t(`status.${doc.status}`)}`,
        kbd: '',
      })),
      ...data.cats.slice(0, 3).map((cat) => ({
        type: 'cat',
        id: cat.key,
        icon: 'tag',
        title: t(cat.key),
        sub: `${cat.count} ${t('nav.documents')}`,
        kbd: '',
      })),
    ];
    const q = $('#paletteInput').value.trim().toLowerCase();
    return q ? items.filter((item) => `${item.title} ${item.sub}`.toLowerCase().includes(q)) : items;
  }

  function renderPalette() {
    const items = paletteItems();
    state.paletteIndex = Math.min(state.paletteIndex, Math.max(0, items.length - 1));
    if (!items.length) {
      $('#paletteList').innerHTML = `<div class="empty-state"><svg class="ic"><use href="#i-search"/></svg><p>${esc(t('palette.noresults'))}</p></div>`;
      return;
    }
    let index = 0;
    let currentGroup = '';
    const rendered = items
      .map((item, i) => {
        const group = item.type === 'action' ? t('palette.actions') : item.type === 'doc' ? t('palette.docs') : t('palette.cats');
        let groupHtml = '';
        if (group !== currentGroup) {
          currentGroup = group;
          groupHtml = `<div class="palette-group-title">${esc(group)}</div>`;
        }
        const active = i === state.paletteIndex;
        return `${groupHtml}<button class="palette-item ${active ? 'is-active' : ''}" type="button" data-p-item="${i}">
          <span class="palette-ic"><svg class="ic"><use href="#i-${item.icon}"/></svg></span>
          <span class="palette-item-text"><strong>${esc(item.title)}</strong><small>${esc(item.sub)}</small></span>
          ${item.kbd ? `<kbd>${item.kbd}</kbd>` : ''}
        </button>`;
      })
      .join('');
    $('#paletteList').innerHTML = rendered;
    $$('[data-p-item]').forEach((btn) => {
      btn.addEventListener('click', () => executePalette(items[Number(btn.dataset.pItem)]));
      btn.addEventListener('mouseenter', () => {
        state.paletteIndex = Number(btn.dataset.pItem);
        $$('[data-p-item]').forEach((b) => b.classList.toggle('is-active', b === btn));
      });
    });
  }

  function openPalette() {
    state.lastFocus = document.activeElement;
    state.paletteIndex = 0;
    $('#palette').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#paletteInput').value = '';
    renderPalette();
    setTimeout(() => $('#paletteInput').focus(), 40);
  }

  function closePalette() {
    $('#palette').hidden = true;
    document.body.style.overflow = state.doc ? 'hidden' : '';
    state.lastFocus?.focus?.();
  }

  function executePalette(item) {
    if (!item) return;
    if (item.type === 'action' && item.id === 'upload') {
      closePalette();
      openUpload();
      return;
    }
    if (item.type === 'doc') {
      closePalette();
      openDrawer(item.id);
      return;
    }
    const messages = {
      scan: 'toast.scan',
      folder: 'toast.folder',
      invite: 'toast.invite',
      cat: 'toast.category',
    };
    toast(messages[item.type === 'cat' ? 'cat' : item.id] || 'toast.page');
    closePalette();
  }

  /* ---------------------------------------------------------------------
     Toasts
     --------------------------------------------------------------------- */
  function toast(key) {
    const msg = T[state.lang][key] ?? T.ar[key] ?? key;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<svg class="ic"><use href="#i-check"/></svg><span>${esc(msg)}</span>`;
    $('#toastWrap').appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 240);
    }, 3000);
  }

  /* ---------------------------------------------------------------------
     Event wiring
     --------------------------------------------------------------------- */
  function init() {
    applyTheme(state.theme);
    applyI18n();
    renderAll();

    $('#themeToggle').addEventListener('click', toggleTheme);
    $('#langToggle').addEventListener('click', toggleLanguage);

    $$('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.sector === state.sector) return;
        state.sector = btn.dataset.sector;
        localStorage.setItem('archifex-sector', state.sector);
        if (state.doc) closeDrawer();
        renderAll();
        if (state.doc) renderDrawer(state.doc);
      });
    });

    $$('.range-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.range = btn.dataset.range;
        drawChart();
      });
    });

    $$('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        state.filter = tab.dataset.filter;
        renderTable();
      });
    });

    $('#tableSearch').addEventListener('input', (e) => {
      state.query = e.target.value;
      renderTable();
    });

    $('#selectAll')?.addEventListener('change', (e) => {
      $$('#tableBody tr').forEach((tr) => {
        const cb = tr.querySelector('input');
        if (cb) cb.checked = e.target.checked;
        tr.classList.toggle('is-selected', e.target.checked);
      });
    });

    // Upload
    $('#topUploadBtn').addEventListener('click', openUpload);
    $('#pageUploadBtn').addEventListener('click', openUpload);
    $$('[data-close="upload"]').forEach((el) => el.addEventListener('click', closeUpload));
    $$('[data-close="palette"]').forEach((el) => el.addEventListener('click', closePalette));

    $('#dropzone').addEventListener('click', () => $('#fileInput').click());
    $('#dropzone').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $('#fileInput').click();
      }
    });
    $('#fileInput').addEventListener('change', (e) => addFiles(e.target.files));

    const dz = $('#dropzone');
    ['dragenter', 'dragover'].forEach((evt) =>
      dz.addEventListener(evt, (e) => {
        e.preventDefault();
        dz.classList.add('is-drag');
      })
    );
    ['dragleave', 'drop'].forEach((evt) =>
      dz.addEventListener(evt, (e) => {
        e.preventDefault();
        dz.classList.remove('is-drag');
      })
    );
    dz.addEventListener('drop', (e) => {
      if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
    });
    $('#uploadStart').addEventListener('click', startUpload);

    // Drawer
    $('#drawerClose').addEventListener('click', closeDrawer);
    $('#drawerOverlay').addEventListener('click', closeDrawer);
    $$('.dtab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.dtab').forEach((t2) => t2.classList.toggle('is-active', t2 === tab));
        $$('.dpanel').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.dpanel === tab.dataset.dtab));
      });
    });

    // Palette
    $('#globalSearchBtn').addEventListener('click', openPalette);
    $('#paletteInput').addEventListener('input', () => {
      state.paletteIndex = 0;
      renderPalette();
    });
    $('#paletteInput').addEventListener('keydown', (e) => {
      const items = paletteItems();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.paletteIndex = Math.min(items.length - 1, state.paletteIndex + 1);
        renderPalette();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        state.paletteIndex = Math.max(0, state.paletteIndex - 1);
        renderPalette();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executePalette(items[state.paletteIndex]);
      }
    });

    // Notifications
    const bell = $('#bellBtn');
    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = $('#notifMenu');
      menu.hidden = !menu.hidden;
      bell.setAttribute('aria-expanded', String(!menu.hidden));
    });
    $('#notifMenu').addEventListener('click', (e) => e.stopPropagation());
    $('#markRead').addEventListener('click', () => {
      $('#bellDot').classList.add('is-hidden');
      $$('.notif-item').forEach((el) => el.classList.remove('is-unread'));
      toast('toast.markread');
    });
    document.addEventListener('click', () => {
      if (!$('#notifMenu').hidden) {
        $('#notifMenu').hidden = true;
        bell.setAttribute('aria-expanded', 'false');
      }
    });

    // Sidebar (mobile)
    const openSidebar = () => {
      $('#sidebar').classList.add('is-open');
      $('#sidebarScrim').classList.add('is-open');
    };
    const closeSidebar = () => {
      $('#sidebar').classList.remove('is-open');
      $('#sidebarScrim').classList.remove('is-open');
    };
    $('#menuBtn').addEventListener('click', openSidebar);
    $('#sidebarClose').addEventListener('click', closeSidebar);
    $('#sidebarScrim').addEventListener('click', closeSidebar);
    $$('.nav-item').forEach((item) =>
      item.addEventListener('click', (e) => {
        e.preventDefault();
        closeSidebar();
      })
    );

    // AI form
    $('#aiForm').addEventListener('submit', (e) => {
      e.preventDefault();
      toast('toast.ai.answer');
    });

    // Generic demo toasts
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-toast]');
      if (target) {
        e.preventDefault();
        toast(target.dataset.toast);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        $('#palette').hidden ? openPalette() : closePalette();
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        openPalette();
      } else if (e.key === 'Escape') {
        if (!$('#palette').hidden) closePalette();
        else if (!$('#uploadModal').hidden) closeUpload();
        else if (!state.doc) closeSidebar();
        else closeDrawer();
        if (!$('#notifMenu').hidden) {
          $('#notifMenu').hidden = true;
          bell.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // focus polish for drawer overlay
    $('#drawerOverlay').addEventListener('mousedown', (e) => e.preventDefault());

    // Deep links for previewing states: ?demo=drawer|upload|palette&doc=edu-1
    const demo = params.get('demo');
    if (demo === 'drawer') openDrawer(params.get('doc') || current().docs[0].id);
    else if (demo === 'upload') openUpload();
    else if (demo === 'palette') openPalette();
    else if (demo === 'sidebar') openSidebar();
  }

  // Public bridge used by platform.js (interactive sections layered on top).
  window.ArchifexDemo = {
    state,
    DATA,
    current,
    t,
    L,
    pick,
    esc,
    locale,
    fmtNum,
    fmtDate,
    statusChip,
    applyTheme,
    applyI18n,
    setLanguage,
    renderAll,
    renderTable,
    renderWorkflow,
    renderAudit,
    renderCategories,
    findDoc,
    openDrawer,
    closeDrawer,
    openUpload,
    addUploadedRow,
    openPalette,
    toast,
  };

  document.addEventListener('DOMContentLoaded', init);
})();
