/* ==========================================================================
   ARCHIFEX — Interactive platform sections
   Loaded after app.js. Adds real views and actions on top of the demo shell.
   ========================================================================== */

(() => {
  'use strict';

  const D = window.ArchifexDemo;
  if (!D) {
    console.error('ArchifexDemo bridge is missing.');
    return;
  }

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const { state, DATA, current, L, pick, esc, fmtNum, fmtDate, statusChip } = D;

  const PAGE_SIZE = 6;
  const VIEWS = new Set([
    'dashboard',
    'documents',
    'search',
    'workflows',
    'categories',
    'entities',
    'projects',
    'cold',
    'users',
    'audit',
    'settings',
    'notifications',
  ]);

  const ui = {
    view: 'dashboard',
    page: { documents: 1 },
    docQuery: '',
    docCat: 'all',
    docStatus: 'all',
    searchQuery: '',
    entityQuery: '',
    coldQuery: '',
    auditQuery: '',
    notifUnreadOnly: false,
  };

  const tr = (ar, en) => (state.lang === 'ar' ? ar : en);
  const appView = () => $('#appView');

  const ROLE_LABELS = {
    admin: L('مدير النظام', 'Administrator'),
    manager: L('مدير أرشيف', 'Archive manager'),
    editor: L('محرر', 'Editor'),
    viewer: L('مشاهد', 'Viewer'),
  };

  /* ---------------------------------------------------------------------
     Session / current user
     --------------------------------------------------------------------- */
  function readSession() {
    try {
      const raw = sessionStorage.getItem('archifex-session-v1') || localStorage.getItem('archifex-session-v1');
      const session = raw ? JSON.parse(raw) : null;
      if (!session || !session.email) return null;
      if (session.expiresAt && Date.now() > session.expiresAt) return null;
      return session;
    } catch (e) {
      return null;
    }
  }

  const USER =
    readSession() || {
      name: 'سارة العتيبي',
      email: 'demo@archifex.sa',
      organization: 'جامعة النور',
      sector: 'edu',
      role: 'admin',
      initials: 'SA',
    };

  function initialsOf(name) {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return 'AF';
    return parts
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join('')
      .toUpperCase();
  }

  function roleLabel(role) {
    return pick(ROLE_LABELS[role] || ROLE_LABELS.viewer);
  }

  function applyUserIdentity() {
    const initials = USER.initials || initialsOf(USER.name);
    const firstName = String(USER.name || '').trim().split(/\s+/)[0] || USER.name;

    ['sidebarUserAvatar', 'profileAvatar', 'profileBtn'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = initials;
    });

    const sidebarName = $('#sidebarUserName');
    if (sidebarName) sidebarName.textContent = USER.name;
    const sidebarRole = $('#sidebarUserRole');
    if (sidebarRole) sidebarRole.textContent = roleLabel(USER.role);
    const profileName = $('#profileName');
    if (profileName) profileName.textContent = USER.name;
    const profileEmail = $('#profileEmail');
    if (profileEmail) profileEmail.textContent = USER.email;
    const displayOrg =
      USER.id === 'usr_demo'
        ? pick(current().workspace)
        : USER.organization || pick(current().workspace);
    const profileOrg = $('#profileOrg');
    if (profileOrg) profileOrg.textContent = displayOrg;
    const workspaceName = $('#workspaceName');
    if (workspaceName) workspaceName.textContent = displayOrg;
    const profileRole = $('#profileRole');
    if (profileRole) profileRole.textContent = roleLabel(USER.role);

    const greeting = $('[data-i18n="page.greeting"]');
    if (greeting) {
      greeting.textContent =
        state.lang === 'ar' ? `مرحبًا بعودتك، ${firstName}` : `Welcome back, ${firstName}`;
    }

    const settingsLabel = $('#profileSettings span');
    if (settingsLabel) settingsLabel.textContent = tr('إعدادات الحساب', 'Account settings');
    const themeLabel = $('#profileTheme span');
    if (themeLabel) themeLabel.textContent = tr('تبديل المظهر', 'Toggle theme');
    const logoutLabel = $('#profileLogout span');
    if (logoutLabel) logoutLabel.textContent = tr('تسجيل الخروج', 'Sign out');
  }

  /* ---------------------------------------------------------------------
     Demo data augmentation
     --------------------------------------------------------------------- */
  function hashLike() {
    try {
      const bytes = new Uint8Array(4);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return Math.random().toString(16).slice(2, 10);
    }
  }

  function makeDoc(id, titleAr, titleEn, ext, meta, category, linkType, linkAr, linkEn, ownerAr, ownerEn, initials, date, status) {
    return {
      id,
      title: L(titleAr, titleEn),
      ext,
      meta,
      category,
      linkType,
      linkValue: L(linkAr, linkEn),
      owner: L(ownerAr, ownerEn),
      initials,
      date,
      status,
    };
  }

  function ensurePlatformData(data, sector) {
    if (data.platform) return;
    const isEdu = sector === 'edu';

    if (isEdu) {
      data.docs.push(
        makeDoc('edu-7', 'محضر اجتماع مجلس الجامعة — أكتوبر', 'University council minutes — October', 'pdf', 'PDF · 1.6 MB', 'cat.minutes', 'dept', 'مجلس الجامعة', 'University Council', 'منى الزهراني', 'Mona Alzahrani', 'MZ', '2026-10-06', 'pending'),
        makeDoc('edu-8', 'خطاب توصية — نورة سالم', 'Recommendation letter — Noura Salem', 'pdf', 'PDF · 310 KB', 'cat.certificates', 'student', '2024-1180', '2024-1180', 'سارة العتيبي', 'Sarah Alotaibi', 'SA', '2026-10-05', 'approved'),
        makeDoc('edu-9', 'فاتورة رسوم دراسية — الدفعة الثانية', 'Tuition invoice — second instalment', 'pdf', 'PDF · 540 KB', 'cat.invoices', 'student', '2022-0871', '2022-0871', 'خالد الحربي', 'Khalid Alharbi', 'KH', '2026-10-04', 'signed'),
        makeDoc('edu-10', 'تعميم إجراءات الاختبارات النهائية', 'Final exams procedures circular', 'pdf', 'PDF · 680 KB', 'cat.circulars', 'university', 'الجامعة', 'University', 'منى الزهراني', 'Mona Alzahrani', 'MZ', '2026-10-03', 'approved'),
        makeDoc('edu-11', 'عقد صيانة مختبرات كلية الهندسة', 'Engineering labs maintenance contract', 'pdf', 'PDF · 2.1 MB', 'cat.contracts', 'dept', 'كلية الهندسة', 'Engineering', 'خالد الحربي', 'Khalid Alharbi', 'KH', '2026-10-02', 'processing'),
        makeDoc('edu-12', 'كشف درجات — عبدالله ناصر', 'Transcript — Abdullah Nasser', 'doc', 'DOCX · 720 KB', 'cat.academic', 'student', '2021-0342', '2021-0342', 'سارة العتيبي', 'Sarah Alotaibi', 'SA', '2026-10-01', 'archived')
      );
    } else {
      data.docs.push(
        makeDoc('corp-7', 'ملحق عقد — نطاق الخدمات السحابية', 'Contract addendum — cloud services scope', 'pdf', 'PDF · 2.8 MB', 'cat.contracts', 'client', 'SAHABA', 'SAHABA', 'ريم القحطاني', 'Reem Alqahtani', 'RC', '2026-10-06', 'pending'),
        makeDoc('corp-8', 'فاتورة #INV-2058 — سحابة', 'Invoice #INV-2058 — Sahaba', 'pdf', 'PDF · 820 KB', 'cat.invoices', 'client', 'SAHABA', 'SAHABA', 'ياسر العمري', 'Yasser Alamri', 'YA', '2026-10-05', 'approved'),
        makeDoc('corp-9', 'عرض فني — منصة الرياض', 'Technical proposal — Riyadh platform', 'pdf', 'PDF · 5.4 MB', 'cat.bids', 'project', 'RB-APP', 'RB-APP', 'منى الزهراني', 'Mona Alzahrani', 'MZ', '2026-10-04', 'signed'),
        makeDoc('corp-10', 'سياسة العمل عن بُعد', 'Remote work policy', 'pdf', 'PDF · 460 KB', 'cat.hr', 'dept', 'الموارد البشرية', 'Human Resources', 'سارة العتيبي', 'Sarah Alotaibi', 'SA', '2026-10-03', 'approved'),
        makeDoc('corp-11', 'محضر لجنة المخاطر — الربع الثالث', 'Risk committee minutes — Q3', 'pdf', 'PDF · 1.2 MB', 'cat.minutes', 'dept', 'الحوكمة', 'Governance', 'ريم القحطاني', 'Reem Alqahtani', 'RC', '2026-10-02', 'processing'),
        makeDoc('corp-12', 'ملف ضريبي Q2 — أرشيف', 'Q2 tax filing — archive', 'img', 'JPG · 980 KB', 'cat.invoices', 'dept', 'المالية', 'Finance', 'ياسر العمري', 'Yasser Alamri', 'YA', '2026-10-01', 'archived')
      );
    }

    const eduEntities = [
      { id: 'stu-1', name: L('أحمد محمد الشامي', 'Ahmed Mohammed Al-Shami'), no: '2023-1045', detail: L('بكالوريوس علوم الحاسب', 'BSc Computer Science'), dept: L('علوم الحاسب', 'Computer Science'), docs: 14, status: 'active' },
      { id: 'stu-2', name: L('ليان عبدالله', 'Layan Abdullah'), no: '2022-0871', detail: L('بكالوريوس إدارة أعمال', 'BBA'), dept: L('إدارة الأعمال', 'Business'), docs: 11, status: 'active' },
      { id: 'stu-3', name: L('عمر حسن', 'Omar Hassan'), no: '2021-0342', detail: L('ماجستير هندسة', 'MSc Engineering'), dept: L('كلية الهندسة', 'Engineering'), docs: 19, status: 'active' },
      { id: 'stu-4', name: L('نورة سالم', 'Noura Salem'), no: '2024-1180', detail: L('بكالوريوس طب', 'MBBS'), dept: L('كلية الطب', 'Medicine'), docs: 8, status: 'active' },
      { id: 'stu-5', name: L('عبدالله ناصر', 'Abdullah Nasser'), no: '2021-0342', detail: L('بكالوريوس نظم معلومات', 'BSc Information Systems'), dept: L('علوم الحاسب', 'Computer Science'), docs: 6, status: 'inactive' },
      { id: 'stu-6', name: L('ريم فهد', 'Reem Fahad'), no: '2025-0091', detail: L('بكالوريوس تصميم', 'BSc Design'), dept: L('الفنون والتصميم', 'Arts & Design'), docs: 4, status: 'active' },
    ];

    const corpEntities = [
      { id: 'cli-1', name: L('شركة أفق التقنية', 'Ufuq Technologies'), no: 'AFAQ', detail: L('منصة نُور', 'Noor platform'), dept: L('الإدارة القانونية', 'Legal'), docs: 28, status: 'active' },
      { id: 'cli-2', name: L('سحابة للخدمات السحابية', 'Sahaba Cloud'), no: 'SAHABA', detail: L('عقد NDA', 'NDA agreement'), dept: L('المالية', 'Finance'), docs: 17, status: 'active' },
      { id: 'cli-3', name: L('وزارة الاتصالات', 'Ministry of Communications'), no: 'RFP-88', detail: L('عرض فني', 'Technical proposal'), dept: L('الحوكمة', 'Governance'), docs: 22, status: 'active' },
      { id: 'cli-4', name: L('مؤسسة الرياض الرقمية', 'Riyadh Digital'), no: 'RB-APP', detail: L('تطبيق الرياض', 'Riyadh app'), dept: L('المشاريع', 'Projects'), docs: 13, status: 'active' },
      { id: 'cli-5', name: L('شركة نور للاستثمار', 'Noor Investment'), no: 'NOOR', detail: L('منصة نُور', 'Noor platform'), dept: L('المالية', 'Finance'), docs: 9, status: 'inactive' },
      { id: 'cli-6', name: L('مجموعة الأفق القابضة', 'Ufuq Holding'), no: 'UFQ-H', detail: L('حوكمة المجموعة', 'Group governance'), dept: L('الحوكمة', 'Governance'), docs: 7, status: 'active' },
    ];

    const eduProjects = [
      { id: 'prj-1', code: 'CS', name: L('قسم علوم الحاسب', 'Computer Science'), owner: L('د. خالد الحربي', 'Dr. Khalid Alharbi'), docs: '6,420', progress: 86, status: 'active' },
      { id: 'prj-2', code: 'ENG', name: L('كلية الهندسة', 'College of Engineering'), owner: L('د. منى الزهراني', 'Dr. Mona Alzahrani'), docs: '5,180', progress: 72, status: 'active' },
      { id: 'prj-3', code: 'BUS', name: L('كلية إدارة الأعمال', 'Business School'), owner: L('أ. سارة العتيبي', 'Sarah Alotaibi'), docs: '3,940', progress: 64, status: 'active' },
      { id: 'prj-4', code: 'MED', name: L('كلية الطب', 'College of Medicine'), owner: L('د. عمر حسن', 'Dr. Omar Hassan'), docs: '4,610', progress: 91, status: 'active' },
      { id: 'prj-5', code: 'ART', name: L('كلية الفنون والتصميم', 'Arts & Design'), owner: L('أ. ريم فهد', 'Reem Fahad'), docs: '1,870', progress: 48, status: 'active' },
      { id: 'prj-6', code: 'REG', name: L('عمادة القبول والتسجيل', 'Admissions & Registration'), owner: L('أ. عبدالله ناصر', 'Abdullah Nasser'), docs: '2,760', progress: 57, status: 'inactive' },
    ];

    const corpProjects = [
      { id: 'prj-1', code: 'NOOR', name: L('منصة نُور', 'Noor platform'), owner: L('ريم القحطاني', 'Reem Alqahtani'), docs: '8,240', progress: 72, status: 'active' },
      { id: 'prj-2', code: 'RB-APP', name: L('تطبيق الرياض', 'Riyadh app'), owner: L('منى الزهراني', 'Mona Alzahrani'), docs: '5,610', progress: 64, status: 'active' },
      { id: 'prj-3', code: 'RFP-88', name: L('عرض وزارة الاتصالات', 'Ministry RFP-88'), owner: L('ريم القحطاني', 'Reem Alqahtani'), docs: '3,120', progress: 88, status: 'active' },
      { id: 'prj-4', code: 'CLOUD', name: L('الهجرة السحابية', 'Cloud migration'), owner: L('ياسر العمري', 'Yasser Alamri'), docs: '2,780', progress: 41, status: 'active' },
      { id: 'prj-5', code: 'GOV', name: L('حوكمة المجموعة', 'Group governance'), owner: L('سارة العتيبي', 'Sarah Alotaibi'), docs: '1,960', progress: 76, status: 'active' },
      { id: 'prj-6', code: 'HR', name: L('الموارد البشرية', 'Human Resources'), owner: L('عبدالله ناصر', 'Abdullah Nasser'), docs: '1,440', progress: 53, status: 'inactive' },
    ];

    const team = [
      { id: 'usr-1', name: L(USER.name, USER.name), email: USER.email, role: USER.role || 'admin', status: 'active', last: L('الآن', 'Now'), initials: USER.initials || initialsOf(USER.name) },
      { id: 'usr-2', name: L('خالد الحربي', 'Khalid Alharbi'), email: 'khalid@archifex.sa', role: 'manager', status: 'active', last: L('منذ 8 دقائق', '8 min ago'), initials: 'KH' },
      { id: 'usr-3', name: L('منى الزهراني', 'Mona Alzahrani'), email: 'mona@archifex.sa', role: 'editor', status: 'active', last: L('منذ 22 دقيقة', '22 min ago'), initials: 'MZ' },
      { id: 'usr-4', name: L('ياسر العمري', 'Yasser Alamri'), email: 'yasser@archifex.sa', role: 'editor', status: 'active', last: L('منذ ساعة', '1 hour ago'), initials: 'YA' },
      { id: 'usr-5', name: L('ريم القحطاني', 'Reem Alqahtani'), email: 'reem@archifex.sa', role: 'viewer', status: 'inactive', last: L('أمس', 'Yesterday'), initials: 'RC' },
    ];

    const cold = isEdu
      ? [
          { id: 'cold-1', title: L('كشف درجات 2019 — دفعة متخرجة', '2019 transcript — graduated class'), category: 'cat.academic', owner: L('سارة العتيبي', 'Sarah Alotaibi'), date: '2024-06-12', size: '2.1 MB', retention: L('7 سنوات', '7 years'), last: L('منذ 8 أشهر', '8 months ago') },
          { id: 'cold-2', title: L('عقد صيانة مبنى كلية العلوم 2023', 'Science building maintenance 2023'), category: 'cat.contracts', owner: L('خالد الحربي', 'Khalid Alharbi'), date: '2023-11-02', size: '1.4 MB', retention: L('10 سنوات', '10 years'), last: L('منذ سنة', '1 year ago') },
          { id: 'cold-3', title: L('تعاميم القبول والتسجيل 2022', 'Admissions circulars 2022'), category: 'cat.circulars', owner: L('منى الزهراني', 'Mona Alzahrani'), date: '2022-09-18', size: '860 KB', retention: L('5 سنوات', '5 years'), last: L('منذ سنتين', '2 years ago') },
          { id: 'cold-4', title: L('محاضر مجلس الجامعة 2021', 'University council minutes 2021'), category: 'cat.minutes', owner: L('ريم القحطاني', 'Reem Alqahtani'), date: '2021-12-30', size: '3.2 MB', retention: L('دائم', 'Permanent'), last: L('منذ 3 سنوات', '3 years ago') },
        ]
      : [
          { id: 'cold-1', title: L('عقد خدمات 2019 — عميل سابق', '2019 service contract — former client'), category: 'cat.contracts', owner: L('ريم القحطاني', 'Reem Alqahtani'), date: '2024-05-10', size: '1.9 MB', retention: L('10 سنوات', '10 years'), last: L('منذ 9 أشهر', '9 months ago') },
          { id: 'cold-2', title: L('فواتير Q4 2022 — الإدارة المالية', 'Q4 2022 invoices — Finance'), category: 'cat.invoices', owner: L('ياسر العمري', 'Yasser Alamri'), date: '2023-01-14', size: '4.8 MB', retention: L('7 سنوات', '7 years'), last: L('منذ سنة', '1 year ago') },
          { id: 'cold-3', title: L('عروض فنية RFP-2022', 'RFP proposals 2022'), category: 'cat.bids', owner: L('منى الزهراني', 'Mona Alzahrani'), date: '2022-08-21', size: '6.2 MB', retention: L('5 سنوات', '5 years'), last: L('منذ سنتين', '2 years ago') },
          { id: 'cold-4', title: L('ملفات الموارد البشرية 2021', 'HR files 2021'), category: 'cat.hr', owner: L('سارة العتيبي', 'Sarah Alotaibi'), date: '2021-12-01', size: '2.7 MB', retention: L('دائم', 'Permanent'), last: L('منذ 3 سنوات', '3 years ago') },
        ];

    const notifications = [
      { id: 1, icon: 'success', title: L('تم اعتماد عقد الخدمة SLA', 'SLA agreement approved'), sub: L('وقّعه د. خالد — شركة أفق التقنية', 'Signed by Dr. Khalid — Ufuq Technologies'), time: L('منذ 5 دقائق', '5 min ago'), read: false },
      { id: 2, icon: 'ai', title: L('اكتمل استخراج بيانات 12 مستندًا', 'Data extraction completed for 12 documents'), sub: L('ثقة متوسطة 97.4% — جاهزة للمراجعة', 'Average confidence 97.4% — ready for review'), time: L('منذ 22 دقيقة', '22 min ago'), read: false },
      { id: 3, icon: 'warn', title: L('طلب توقيع بانتظارك', 'A signature request is waiting'), sub: L('محضر مجلس القسم — كلية الهندسة', 'Council minutes — Engineering'), time: L('منذ ساعة', '1 hour ago'), read: false },
      { id: 4, icon: 'success', title: L('تمت استعادة مستند من الأرشيف البارد', 'Document restored from cold archive'), sub: L('كشف درجات 2019 — دفعة متخرجة', '2019 transcript — graduated class'), time: L('منذ 3 ساعات', '3 hours ago'), read: true },
      { id: 5, icon: 'ai', title: L('اكتمل فحص الفيروسات للدفعة الجديدة', 'Virus scan completed for the new batch'), sub: L('24 مستندًا — لا توجد تهديدات', '24 documents — no threats found'), time: L('أمس', 'Yesterday'), read: true },
      { id: 6, icon: 'warn', title: L('اقتراب موعد احتفاظ مستندات', 'Retention date approaching'), sub: L('4 مستندات تنتهي مدة احتفاظها خلال 30 يومًا', '4 documents reach retention end in 30 days'), time: L('أمس', 'Yesterday'), read: true },
    ];

    data.platform = {
      entities: isEdu ? eduEntities : corpEntities,
      projects: isEdu ? eduProjects : corpProjects,
      team,
      cold,
      notifications,
      customCats: [],
      workflowTotal: data.workflow.length,
      activity: data.audit.map((item) => ({
        icon: item.icon,
        text: item.text,
        time: item.time,
        hash: hashLike(),
        actor: L('النظام', 'System'),
      })),
      settings: null,
    };
  }

  function platform() {
    return current().platform;
  }

  function categoryList() {
    const cats = [...current().cats, ...(platform().customCats || [])];
    return cats;
  }

  function catLabel(key, cat) {
    const found = cat || categoryList().find((item) => item.key === key);
    if (found && found.label) return pick(found.label);
    const translated = D.t(key);
    return translated === key ? key : translated;
  }

  function displayStatus(status) {
    if (status === 'active') return `<span class="status-chip approved">${tr('نشط', 'Active')}</span>`;
    if (status === 'inactive') return `<span class="status-chip rejected">${tr('موقوف', 'Suspended')}</span>`;
    return statusChip(status);
  }

  function todayLabel() {
    return new Intl.DateTimeFormat(D.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date('2026-10-20T12:00:00'));
  }

  function pageHead(eyebrow, title, sub, actions = '') {
    return `
      <section class="page-head">
        <div class="page-head-text">
          <div class="eyebrow">
            <span>${esc(eyebrow)}</span>
            <span class="eyebrow-sep"></span>
            <span>${esc(todayLabel())}</span>
          </div>
          <h1>${esc(title)}</h1>
          <p>${esc(sub)}</p>
        </div>
        <div class="page-head-actions">${actions}</div>
      </section>`;
  }

  function statCard(label, value, sub, icon) {
    return `
      <article class="app-stat">
        <div class="app-stat-top">
          <span class="app-stat-label">${esc(label)}</span>
          <span class="app-stat-icon"><svg class="ic"><use href="#i-${icon}"/></svg></span>
        </div>
        <strong>${esc(value)}</strong>
        <small>${esc(sub)}</small>
      </article>`;
  }

  function fileBadge(doc) {
    const ext = doc.ext === 'img' ? 'IMG' : doc.ext === 'doc' ? 'DOC' : 'PDF';
    return `<span class="file-badge ${doc.ext}"><svg class="ic"><use href="#i-${doc.ext === 'img' ? 'image' : 'file'}"/></svg><em>${ext}</em></span>`;
  }

  function docMatches(doc, query) {
    if (!query) return true;
    const haystack = [
      pick(doc.title),
      doc.title.ar,
      doc.title.en,
      catLabel(doc.category),
      pick(doc.owner),
      pick(doc.linkValue),
      typeof doc.linkValue === 'string' ? doc.linkValue : '',
      D.t(`status.${doc.status}`),
    ]
      .join(' ')
      .toLowerCase();
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .every((term) => haystack.includes(term));
  }

  function searchDocs(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    return current()
      .docs.map((doc) => {
        const title = pick(doc.title).toLowerCase();
        const haystack = [
          title,
          doc.title.ar,
          doc.title.en,
          catLabel(doc.category),
          pick(doc.owner),
          pick(doc.linkValue),
        ]
          .join(' ')
          .toLowerCase();
        let score = 0;
        terms.forEach((term) => {
          if (title.includes(term)) score += 45;
          else if (haystack.includes(term)) score += 22;
        });
        if (!score) return null;
        return { doc, score: Math.min(99, 55 + score) };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }

  /* ---------------------------------------------------------------------
     Toasts / modal
     --------------------------------------------------------------------- */
  function showToast(message) {
    const wrap = $('#toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<svg class="ic"><use href="#i-check"/></svg><span>${esc(message)}</span>`;
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 240);
    }, 3200);
  }

  function bodyOverflow() {
    const uploadOpen = $('#uploadModal') && !$('#uploadModal').hidden;
    const paletteOpen = $('#palette') && !$('#palette').hidden;
    document.body.style.overflow = D.state.doc || uploadOpen || paletteOpen ? 'hidden' : '';
  }

  function openModal({ title, sub = '', body = '', foot = '', onSubmit }) {
    closeProfileMenu();
    $('#appModalTitle').textContent = title;
    $('#appModalSub').textContent = sub;
    $('#appModalBody').innerHTML = body;
    $('#appModalFoot').innerHTML = foot;
    $('#appModal').hidden = false;
    document.body.style.overflow = 'hidden';
    const form = $('#appModalBody form');
    if (form && onSubmit) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        onSubmit(form);
      });
    }
    setTimeout(() => {
      const first = $('#appModalBody input:not([type="hidden"]), #appModalBody select, #appModalBody textarea');
      first?.focus({ preventScroll: true });
    }, 60);
  }

  function closeModal() {
    const modal = $('#appModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    $('#appModalBody').innerHTML = '';
    $('#appModalFoot').innerHTML = '';
    bodyOverflow();
  }

  function closeProfileMenu() {
    const menu = $('#profileMenu');
    const btn = $('#profileBtn');
    if (menu && !menu.hidden) {
      menu.hidden = true;
      btn?.setAttribute('aria-expanded', 'false');
    }
  }

  function closePalette() {
    const palette = $('#palette');
    if (palette) palette.hidden = true;
    bodyOverflow();
  }

  function slugify(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || `cat-${Date.now().toString(36)}`;
  }

  /* ---------------------------------------------------------------------
     Settings
     --------------------------------------------------------------------- */
  function settingsKey() {
    return `archifex-settings-v1:${USER.email || 'demo'}`;
  }

  function defaultSettings() {
    return {
      orgName: USER.organization || pick(current().workspace),
      orgEmail: USER.email,
      sector: state.sector,
      timezone: 'Asia/Riyadh',
      theme: state.theme,
      lang: state.lang,
      sessionTimeout: '30',
      notifEmail: true,
      notifWeekly: true,
      notifSign: true,
      twofa: false,
      watermark: true,
      plan: 'pro',
    };
  }

  function getSettings() {
    try {
      const raw = localStorage.getItem(settingsKey());
      const stored = raw ? JSON.parse(raw) : {};
      return { ...defaultSettings(), ...stored };
    } catch (e) {
      return defaultSettings();
    }
  }

  function saveSettings(patch) {
    const next = { ...getSettings(), ...patch };
    try {
      localStorage.setItem(settingsKey(), JSON.stringify(next));
    } catch (e) {}
    platform().settings = next;
    return next;
  }

  function patchSessionOrganization(name) {
    const key = 'archifex-session-v1';
    [sessionStorage, localStorage].forEach((store) => {
      try {
        const raw = store.getItem(key);
        if (!raw) return;
        const session = JSON.parse(raw);
        session.organization = name;
        store.setItem(key, JSON.stringify(session));
      } catch (e) {}
    });
  }

  /* ---------------------------------------------------------------------
     Activity log
     --------------------------------------------------------------------- */
  function logActivity(icon, textAr, textEn, actor) {
    const text = L(textAr, textEn);
    current().audit.unshift({ icon, text, time: L('الآن', 'Just now') });
    if (current().audit.length > 20) current().audit.pop();
    platform().activity.unshift({
      icon,
      text,
      time: L('الآن', 'Just now'),
      hash: hashLike(),
      actor: actor || L(USER.name, USER.name),
    });
    if (platform().activity.length > 80) platform().activity.pop();
    D.renderAudit();
    if (ui.view === 'audit') renderAuditView();
  }

  /* ---------------------------------------------------------------------
     Router
     --------------------------------------------------------------------- */
  const VIEW_META = {
    documents: { eyebrow: ['المكتبة', 'Library'], title: ['المستندات', 'Documents'], sub: ['كل مستندات المؤسسة مع الفلاتر والتصدير والفتح السريع.', 'Every institutional document with filters, export and quick open.'] },
    search: { eyebrow: ['المعرفة', 'Knowledge'], title: ['البحث الذكي', 'Smart search'], sub: ['ابحث بالمعنى في النصوص المستخرجة والبيانات الوصفية.', 'Search by meaning across extracted text and metadata.'] },
    workflows: { eyebrow: ['الحوكمة', 'Governance'], title: ['سير العمل والتوقيع', 'Workflows & signing'], sub: ['راجع طلبات التوقيع واعتمدها مع تسجيل كامل في سجل المراجعة.', 'Review and approve signature requests with a complete audit trail.'] },
    categories: { eyebrow: ['المكتبة', 'Library'], title: ['التصنيفات', 'Categories'], sub: ['نظّم المستندات في تصنيفات واضحة وابنِ سياسات الاحتفاظ.', 'Organize documents into clear categories and retention policies.'] },
    entities: { eyebrow: ['المكتبة', 'Library'], title: ['الطلاب', 'Students'], sub: ['سجل الطلاب وربط كل مستند بالسجل الأكاديمي.', 'Student records linked to their academic documents.'], titleCorp: ['العملاء', 'Clients'], subCorp: ['سجل العملاء وربط العقود والفواتير بكل حساب.', 'Client records linked to contracts and invoices.'] },
    projects: { eyebrow: ['المكتبة', 'Library'], title: ['المشاريع والأقسام', 'Projects & departments'], sub: ['تابع المستندات حسب المشروع أو القسم ونسبة الاكتمال.', 'Track documents by project or department and completion.'] },
    cold: { eyebrow: ['المكتبة', 'Library'], title: ['الأرشيف البارد', 'Cold archive'], sub: ['مستندات منخفضة الوصول محفوظة بأقل تكلفة مع استعادة فورية.', 'Low-access documents stored at the lowest cost with instant restore.'] },
    users: { eyebrow: ['الحوكمة', 'Governance'], title: ['المستخدمون والصلاحيات', 'Users & permissions'], sub: ['أدر فريق العمل والأدوار وصلاحيات الوصول.', 'Manage your team, roles and access permissions.'] },
    audit: { eyebrow: ['الحوكمة', 'Governance'], title: ['سجل المراجعة', 'Audit log'], sub: ['كل حدث موثّق ببصمة وسلسلة تحقق غير قابلة للتعديل.', 'Every event recorded with a hash and a verifiable chain.'] },
    settings: { eyebrow: ['الحوكمة', 'Governance'], title: ['الإعدادات', 'Settings'], sub: ['بيانات المؤسسة والمظهر والإشعارات والأمان والخطة.', 'Organization, appearance, notifications, security and plan.'] },
    notifications: { eyebrow: ['النشاط', 'Activity'], title: ['الإشعارات', 'Notifications'], sub: ['كل ما يحتاج انتباهك في مكان واحد.', 'Everything that needs your attention in one place.'] },
  };

  function metaText(pair) {
    return tr(pair[0], pair[1]);
  }

  function viewTitle(view) {
    const meta = VIEW_META[view];
    if (!meta) return tr('أرشيفكس', 'Archifex');
    if (view === 'entities' && state.sector === 'corp') return tr(meta.titleCorp[0], meta.titleCorp[1]);
    return metaText(meta.title);
  }

  function setView(view, options = {}) {
    if (!VIEWS.has(view)) view = 'dashboard';
    ui.view = view;
    const dashboard = view === 'dashboard';
    $('#dashboardView').hidden = !dashboard;
    appView().hidden = dashboard;

    $$('.nav-item').forEach((item) => {
      const active = item.dataset.view === view;
      item.classList.toggle('is-active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });

    if (dashboard) {
      appView().innerHTML = '';
    } else {
      renderView(view);
    }

    document.title = dashboard
      ? D.t('doc.title')
      : `${viewTitle(view)} — ${tr('أرشيفكس', 'Archifex')}`;

    if (!options.initial) {
      const target = `#${view}`;
      if (location.hash !== target) {
        try {
          if (options.replace) history.replaceState(null, '', target);
          else history.pushState(null, '', target);
        } catch (e) {
          location.hash = view;
        }
      }
    }

    if (!options.keepScroll) window.scrollTo({ top: 0, behavior: 'auto' });
    closeProfileMenu();
  }

  function renderActiveView() {
    if (ui.view !== 'dashboard') renderView(ui.view);
  }

  function renderView(view) {
    switch (view) {
      case 'documents':
        renderDocuments();
        break;
      case 'search':
        renderSearch();
        break;
      case 'workflows':
        renderWorkflows();
        break;
      case 'categories':
        renderCategoriesView();
        break;
      case 'entities':
        renderEntities();
        break;
      case 'projects':
        renderProjects();
        break;
      case 'cold':
        renderColdArchive();
        break;
      case 'users':
        renderUsers();
        break;
      case 'audit':
        renderAuditView();
        break;
      case 'settings':
        renderSettings();
        break;
      case 'notifications':
        renderNotifications();
        break;
      default:
        break;
    }
  }

  /* ---------------------------------------------------------------------
     Documents view
     --------------------------------------------------------------------- */
  function renderDocuments() {
    const all = current().docs;
    const filtered = all.filter(
      (doc) =>
        (ui.docCat === 'all' || doc.category === ui.docCat) &&
        (ui.docStatus === 'all' || doc.status === ui.docStatus) &&
        docMatches(doc, ui.docQuery.trim())
    );
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    ui.page.documents = Math.min(Math.max(1, ui.page.documents), pages);
    const start = (ui.page.documents - 1) * PAGE_SIZE;
    const pageDocs = filtered.slice(start, start + PAGE_SIZE);

    const counts = {
      approved: all.filter((doc) => doc.status === 'approved').length,
      pending: all.filter((doc) => doc.status === 'pending').length,
      processing: all.filter((doc) => doc.status === 'processing').length,
    };

    const catOptions = ['all', ...categoryList().map((cat) => cat.key)]
      .filter((key, index, array) => array.indexOf(key) === index)
      .map(
        (key) =>
          `<option value="${esc(key)}" ${ui.docCat === key ? 'selected' : ''}>${
            key === 'all' ? tr('كل التصنيفات', 'All categories') : esc(catLabel(key))
          }</option>`
      )
      .join('');

    const statuses = ['all', 'approved', 'pending', 'signed', 'processing', 'archived'];
    const statusOptions = statuses
      .map(
        (status) =>
          `<option value="${status}" ${ui.docStatus === status ? 'selected' : ''}>${
            status === 'all' ? tr('كل الحالات', 'All statuses') : D.t(`status.${status}`)
          }</option>`
      )
      .join('');

    const rows = pageDocs.length
      ? pageDocs
          .map(
            (doc) => `
        <tr data-doc="${doc.id}">
          <td>
            <div class="doc-cell">
              ${fileBadge(doc)}
              <span class="doc-name"><strong>${esc(pick(doc.title))}</strong><small>${esc(doc.meta)}</small></span>
            </div>
          </td>
          <td>${esc(catLabel(doc.category))}</td>
          <td><span class="owner-cell"><span class="avatar owner-av">${doc.initials}</span>${esc(pick(doc.owner))}</span></td>
          <td><span class="doc-date">${fmtDate(doc.date)}</span></td>
          <td>${statusChip(doc.status)}</td>
          <td><button class="row-actions" type="button" data-action="doc-menu" data-id="${doc.id}" aria-label="${esc(tr('خيارات', 'Options'))}"><svg class="ic"><use href="#i-more"/></svg></button></td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="6"><div class="table-empty"><svg class="ic"><use href="#i-search"/></svg><strong>${esc(tr('لا توجد مستندات مطابقة', 'No matching documents'))}</strong><span>${esc(tr('جرّب تعديل البحث أو الفلاتر.', 'Try adjusting your search or filters.'))}</span></div></td></tr>`;

    const actions = `
      <button class="btn btn-ghost" type="button" data-action="scan">
        <svg class="ic"><use href="#i-scan"/></svg><span>${esc(tr('مسح ضوئي', 'Scan'))}</span>
      </button>
      <button class="btn btn-primary" type="button" data-action="upload">
        <svg class="ic"><use href="#i-plus"/></svg><span>${esc(tr('مستند جديد', 'New document'))}</span>
      </button>`;

    appView().innerHTML = `
      ${pageHead(
        tr('المكتبة', 'Library'),
        tr('المستندات', 'Documents'),
        tr('كل مستندات المؤسسة مع الفلاتر والتصدير والفتح السريع.', 'Every institutional document with filters, export and quick open.'),
        actions
      )}
      <section class="app-stats">
        ${statCard(tr('إجمالي المستندات', 'Total documents'), fmtNum(all.length), tr('في المكتبة التجريبية', 'in the demo library'), 'files')}
        ${statCard(tr('معتمدة', 'Approved'), fmtNum(counts.approved), tr('جاهزة للاستخدام', 'ready to use'), 'check')}
        ${statCard(tr('بانتظار الاعتماد', 'Pending approval'), fmtNum(counts.pending), tr('تحتاج مراجعة', 'need review'), 'clock')}
        ${statCard(tr('قيد المعالجة', 'Processing'), fmtNum(counts.processing), tr('OCR واستخراج', 'OCR and extraction'), 'sparkles')}
      </section>
      <div class="app-toolbar">
        <label class="mini-search">
          <svg class="ic"><use href="#i-search"/></svg>
          <input id="docSearch" type="search" value="${esc(ui.docQuery)}" placeholder="${esc(tr('ابحث بالعنوان أو المسؤول…', 'Search title or owner…'))}" aria-label="${esc(tr('بحث المستندات', 'Search documents'))}" />
        </label>
        <select class="app-select" id="docCat" aria-label="${esc(tr('التصنيف', 'Category'))}">${catOptions}</select>
        <select class="app-select" id="docStatus" aria-label="${esc(tr('الحالة', 'Status'))}">${statusOptions}</select>
        <span class="app-spacer"></span>
        <button class="btn btn-ghost" type="button" data-action="export-docs">
          <svg class="ic"><use href="#i-download"/></svg><span>${esc(tr('تصدير CSV', 'Export CSV'))}</span>
        </button>
      </div>
      <section class="card table-card">
        <div class="table-wrap">
          <table class="doc-table app-table">
            <thead><tr>
              <th>${esc(tr('المستند', 'Document'))}</th>
              <th>${esc(tr('التصنيف', 'Category'))}</th>
              <th>${esc(tr('المسؤول', 'Owner'))}</th>
              <th>${esc(tr('التاريخ', 'Date'))}</th>
              <th>${esc(tr('الحالة', 'Status'))}</th>
              <th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <footer class="table-foot">
          <span class="table-count">${esc(
            tr(`عرض ${fmtNum(pageDocs.length)} من ${fmtNum(filtered.length)} مستندًا`, `Showing ${fmtNum(pageDocs.length)} of ${fmtNum(filtered.length)} documents`)
          )}</span>
          <div class="pager">
            <button class="icon-btn bordered" type="button" data-action="page" data-dir="-1" aria-label="${esc(tr('السابق', 'Previous'))}" ${ui.page.documents <= 1 ? 'disabled' : ''}><svg class="ic flip-x"><use href="#i-chevron"/></svg></button>
            <span class="pager-num">${ui.page.documents} / ${pages}</span>
            <button class="icon-btn bordered" type="button" data-action="page" data-dir="1" aria-label="${esc(tr('التالي', 'Next'))}" ${ui.page.documents >= pages ? 'disabled' : ''}><svg class="ic"><use href="#i-chevron"/></svg></button>
          </div>
        </footer>
      </section>`;
  }

  /* ---------------------------------------------------------------------
     Search view
     --------------------------------------------------------------------- */
  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, query) {
    const safe = esc(text);
    const terms = query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 1)
      .map(escapeRegExp);
    if (!terms.length) return safe;
    try {
      return safe.replace(new RegExp(`(${terms.join('|')})`, 'gi'), '<mark>$1</mark>');
    } catch (e) {
      return safe;
    }
  }

  function renderSearch() {
    const q = ui.searchQuery.trim();
    const scored = q ? searchDocs(q).slice(0, 6) : [];
    const fallback = current().docs.slice(0, 4).map((doc) => ({ doc, score: null }));
    const results = q ? scored : fallback;
    const ai = current().ai;

    const chips = ai.suggestions
      .map(
        (suggestion) =>
          `<button class="search-chip ${q === pick(suggestion) ? 'is-active' : ''}" type="button" data-action="search-chip" data-q="${esc(pick(suggestion))}">${esc(pick(suggestion))}</button>`
      )
      .join('');

    const resultsHtml = results.length
      ? results
          .map(
            (result) => `
        <button class="result-card" type="button" data-action="open-doc" data-id="${result.doc.id}">
          <span class="result-rank">${result.score ? `${result.score}%` : '•'}</span>
          <span class="result-body">
            <strong>${highlight(pick(result.doc.title), q)}</strong>
            <p>${esc(catLabel(result.doc.category))} · ${esc(pick(result.doc.owner))} · ${esc(fmtDate(result.doc.date))}</p>
            <span class="result-tags"><span>${esc(D.t(`status.${result.doc.status}`))}</span><span>${esc(result.doc.meta)}</span><span>${esc(pick(result.doc.linkValue))}</span></span>
          </span>
        </button>`
          )
          .join('')
      : `<div class="table-empty"><svg class="ic"><use href="#i-search"/></svg><strong>${esc(tr('لا توجد نتائج مطابقة', 'No matching results'))}</strong><span>${esc(tr('جرّب كلمة أخرى أو استخدم أحد الاقتراحات.', 'Try another term or use one of the suggestions.'))}</span></div>`;

    const actions = `
      <button class="btn btn-ghost" type="button" data-action="scan">
        <svg class="ic"><use href="#i-scan"/></svg><span>${esc(tr('مسح ضوئي', 'Scan'))}</span>
      </button>
      <button class="btn btn-primary" type="button" data-action="upload">
        <svg class="ic"><use href="#i-plus"/></svg><span>${esc(tr('إضافة مصدر', 'Add source'))}</span>
      </button>`;

    appView().innerHTML = `
      ${pageHead(tr('المعرفة', 'Knowledge'), tr('البحث الذكي', 'Smart search'), tr('ابحث بالمعنى في النصوص المستخرجة والبيانات الوصفية.', 'Search by meaning across extracted text and metadata.'), actions)}
      <section class="search-hero">
        <div class="eyebrow"><span>${esc(tr('بحث دلالي', 'Semantic search'))}</span><span class="eyebrow-sep"></span><span>${esc(tr('عربي + إنجليزي', 'Arabic + English'))}</span></div>
        <form class="search-box-large" id="smartSearchForm">
          <svg class="ic"><use href="#i-sparkles"/></svg>
          <input id="smartSearchInput" type="search" value="${esc(ui.searchQuery)}" placeholder="${esc(tr('اسأل أرشيفك… مثال: مدة الإشعار في عقد الخدمة', 'Ask your archive… e.g. notice period in the service agreement'))}" autocomplete="off" />
          <button class="btn btn-primary" type="submit"><svg class="ic"><use href="#i-search"/></svg><span>${esc(tr('بحث', 'Search'))}</span></button>
        </form>
        <div class="search-chips">${chips}</div>
      </section>
      <div class="search-layout">
        <section class="card table-card" style="padding:15px">
          <header class="table-head" style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <div>
              <h2 style="font-size:13px">${esc(q ? tr('نتائج البحث', 'Search results') : tr('مستندات مقترحة', 'Suggested documents'))}</h2>
              <p style="font-size:9.5px;color:var(--muted-2);margin-top:3px">${esc(q ? tr(`تم العثور على ${results.length} نتيجة`, `${results.length} results found`) : tr('أحدث المستندات في مساحة العمل', 'Latest documents in the workspace'))}</p>
            </div>
            ${q ? `<button class="text-btn" type="button" data-action="search-clear">${esc(tr('مسح', 'Clear'))}</button>` : ''}
          </header>
          <div class="search-results" style="margin-top:12px">${resultsHtml}</div>
        </section>
        <aside class="search-side">
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
              <h3 style="display:flex;align-items:center;gap:7px"><svg class="ic" style="width:14px;height:14px;color:var(--silver)"><use href="#i-sparkles"/></svg>${esc(tr('إجابة موثّقة', 'Grounded answer'))}</h3>
              <span class="ai-badge">AI</span>
            </div>
            <div class="search-answer">${pick(ai.answer)}</div>
            <div class="search-sources">
              ${ai.sources
                .map(
                  (source) =>
                    `<span class="search-source"><svg class="ic"><use href="#i-file"/></svg>${esc(pick(source))}</span>`
                )
                .join('')}
            </div>
          </div>
          <div class="card">
            <h3>${esc(tr('نطاق البحث', 'Search scope'))}</h3>
            <p>${esc(tr('يشمل البحث النص المستخرج، أسماء المالكين، التصنيفات والبيانات الوصفية.', 'Search covers extracted text, owners, categories and metadata.'))}</p>
            <div class="search-sources" style="margin-top:12px">
              <span class="search-source"><svg class="ic"><use href="#i-files"/></svg>${esc(tr(`${fmtNum(current().docs.length)} مستندًا في المكتبة`, `${fmtNum(current().docs.length)} documents in the library`))}</span>
              <span class="search-source"><svg class="ic"><use href="#i-tag"/></svg>${esc(tr(`${categoryList().length} تصنيفًا`, `${categoryList().length} categories`))}</span>
              <span class="search-source"><svg class="ic"><use href="#i-clock"/></svg>${esc(tr('فهرسة شبه فورية', 'Near real-time indexing'))}</span>
            </div>
          </div>
        </aside>
      </div>`;
  }

  /* ---------------------------------------------------------------------
     Workflows
     --------------------------------------------------------------------- */
  function renderWorkflows() {
    const workflow = current().workflow;
    const total = Math.max(platform().workflowTotal || workflow.length, workflow.length);
    const done = Math.max(0, total - workflow.length);
    const pct = total ? Math.round((done / total) * 100) : 100;

    const cards = workflow.length
      ? workflow
          .map(
            (item) => `
        <article class="wf-card">
          <div class="wf-card-main">
            <span class="file-badge pdf"><svg class="ic"><use href="#i-file"/></svg><em>PDF</em></span>
            <span class="wf-card-info">
              <strong>${esc(pick(item.name))}</strong>
              <small>${esc(pick(item.meta))}</small>
            </span>
          </div>
          <span class="wf-due">${esc(D.t(`workflow.due.${item.due}`))}</span>
          <div class="wf-card-actions">
            <button class="btn btn-ghost" type="button" data-action="wf-approve" data-id="${item.docId}"><svg class="ic"><use href="#i-check"/></svg><span>${esc(tr('اعتماد', 'Approve'))}</span></button>
            <button class="btn btn-primary" type="button" data-action="wf-sign" data-id="${item.docId}"><svg class="ic"><use href="#i-pen"/></svg><span>${esc(tr('توقيع', 'Sign'))}</span></button>
          </div>
        </article>`
          )
          .join('')
      : `<div class="table-empty"><svg class="ic"><use href="#i-check"/></svg><strong>${esc(tr('لا توجد طلبات معلّقة', 'No pending requests'))}</strong><span>${esc(tr('كل طلبات التوقيع مكتملة.', 'All signature requests are complete.'))}</span><button class="btn btn-ghost" type="button" data-action="upload">${esc(tr('رفع مستند للتوقيع', 'Upload a document to sign'))}</button></div>`;

    const actions = `
      <button class="btn btn-ghost" type="button" data-action="open-audit"><svg class="ic"><use href="#i-eye"/></svg><span>${esc(tr('سجل المراجعة', 'Audit log'))}</span></button>
      <button class="btn btn-primary" type="button" data-action="upload"><svg class="ic"><use href="#i-plus"/></svg><span>${esc(tr('طلب توقيع جديد', 'New signature request'))}</span></button>`;

    appView().innerHTML = `
      ${pageHead(tr('الحوكمة', 'Governance'), tr('سير العمل والتوقيع', 'Workflows & signing'), tr('راجع طلبات التوقيع واعتمدها مع تسجيل كامل في سجل المراجعة.', 'Review and approve signature requests with a complete audit trail.'), actions)}
      <section class="wf-summary">
        <span class="wf-ring" style="--pct:${pct}"><strong>${pct}%</strong></span>
        <div class="wf-summary-text">
          <h3>${esc(tr('تقدّم دورة التوقيع', 'Signing cycle progress'))}</h3>
          <p>${esc(tr(`${done} من ${total} مكتملة · ${workflow.length} بانتظارك`, `${done} of ${total} complete · ${workflow.length} waiting for you`))}</p>
        </div>
        <span class="app-spacer"></span>
        <span class="chip chip-amber">${esc(tr('التوقيع الإلكتروني', 'E-signature'))}</span>
      </section>
      <div class="wf-list">${cards}</div>
      <div class="app-note" style="margin-top:13px">
        <svg class="ic"><use href="#i-shield"/></svg>
        <span>${esc(tr('في النموذج التجريبي، يحفظ التوقيع الحالة ويضيف حدثاً موثّقاً في سجل المراجعة.', 'In the demo, signing updates the status and records a verifiable event in the audit log.'))}</span>
      </div>`;
  }

  /* ---------------------------------------------------------------------
     Categories
     --------------------------------------------------------------------- */
  function renderCategoriesView() {
    const cats = categoryList();
    const totalDocs = cats.reduce((sum, cat) => sum + Number(String(cat.count).replace(/[^\d]/g, '') || 0), 0);

    const cards = cats
      .map((cat, index) => {
        const count = cat.count || '0';
        const pct = cat.pct || Math.max(2, Math.round(100 / Math.max(cats.length, 1)));
        const custom = Boolean(cat.label);
        return `
          <article class="info-card">
            <div class="info-card-top">
              <span class="info-card-ico"><svg class="ic"><use href="#i-${custom ? 'folder' : 'tag'}"/></svg></span>
              <span class="status-chip ${custom ? 'pending' : 'approved'}">${esc(custom ? tr('مخصص', 'Custom') : tr('أساسي', 'Core'))}</span>
            </div>
            <h3>${esc(catLabel(cat.key, cat))}</h3>
            <p>${esc(tr(`${count} مستندًا · مرتبط بسياسة احتفاظ`, `${count} documents · retention policy linked`))}</p>
            <div class="progress-line"><span style="width:${pct}%"></span></div>
            <div class="info-card-foot">
              <span>${pct}%</span>
              <button class="text-btn" type="button" data-action="cat-view" data-cat="${esc(cat.key)}">${esc(tr('عرض المستندات', 'View documents'))}</button>
            </div>
          </article>`;
      })
      .join('');

    const actions = `
      <button class="btn btn-ghost" type="button" data-action="open-documents"><svg class="ic"><use href="#i-files"/></svg><span>${esc(tr('كل المستندات', 'All documents'))}</span></button>
      <button class="btn btn-primary" type="button" data-action="add-category"><svg class="ic"><use href="#i-plus"/></svg><span>${esc(tr('تصنيف جديد', 'New category'))}</span></button>`;

    appView().innerHTML = `
      ${pageHead(tr('المكتبة', 'Library'), tr('التصنيفات', 'Categories'), tr('نظّم المستندات في تصنيفات واضحة وابنِ سياسات الاحتفاظ.', 'Organize documents into clear categories and retention policies.'), actions)}
      <section class="app-stats">
        ${statCard(tr('التصنيفات', 'Categories'), fmtNum(cats.length), tr('أساسية ومخصصة', 'core and custom'), 'tag')}
        ${statCard(tr('مستندات مصنّفة', 'Categorized documents'), fmtNum(totalDocs), tr('في المكتبة', 'in the library'), 'files')}
        ${statCard(tr('سياسات الاحتفاظ', 'Retention policies'), fmtNum(cats.length), tr('مرتبطة تلقائياً', 'linked automatically'), 'shield')}
        ${statCard(tr('تصنيفات مخصصة', 'Custom categories'), fmtNum(platform().customCats.length), tr('أضافها فريقك', 'added by your team'), 'folder')}
      </section>
      <div class="card-grid">${cards}</div>
      <div class="app-note" style="margin-top:13px">
        <svg class="ic"><use href="#i-sparkles"/></svg>
        <span>${esc(tr('يمكنك إضافة تصنيف جديد وسيظهر فوراً في فلاتر المستندات والبحث.', 'Add a new category and it appears immediately in document filters and search.'))}</span>
      </div>`;
  }

  /* ---------------------------------------------------------------------
     Entities (students / clients)
     --------------------------------------------------------------------- */
  function renderEntities() {
    const isEdu = state.sector === 'edu';
    const entities = platform().entities.filter((entity) => {
      if (!ui.entityQuery.trim()) return true;
      const haystack = [pick(entity.name), entity.name.ar, entity.name.en, entity.no, pick(entity.detail), pick(entity.dept)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(ui.entityQuery.trim().toLowerCase());
    });

    const rows = entities.length
      ? entities
          .map(
            (entity) => `
        <tr data-entity="${entity.id}">
          <td><div class="doc-cell"><span class="entity-avatar">${esc(initialsOf(pick(entity.name)))}</span><span class="doc-name"><strong>${esc(pick(entity.name))}</strong><small>${esc(entity.no)}</small></span></div></td>
          <td>${esc(ui.view === 'entities' && !isEdu ? entity.no : pick(entity.detail))}</td>
          <td>${esc(isEdu ? pick(entity.dept) : pick(entity.detail))}</td>
          <td>${esc(fmtNum(entity.docs))}</td>
          <td>${displayStatus(entity.status)}</td>
          <td><button class="btn btn-ghost" type="button" data-action="entity-docs" data-value="${esc(entity.no)}">${esc(tr('المستندات', 'Documents'))}</button></td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="6"><div class="table-empty"><svg class="ic"><use href="#i-search"/></svg><strong>${esc(tr('لا توجد نتائج', 'No results'))}</strong></div></td></tr>`;

    const title = isEdu ? tr('الطلاب', 'Students') : tr('العملاء', 'Clients');
    const sub = isEdu
      ? tr('سجل الطلاب وربط كل مستند بالسجل الأكاديمي.', 'Student records linked to their academic documents.')
      : tr('سجل العملاء وربط العقود والفواتير بكل حساب.', 'Client records linked to contracts and invoices.');

    const actions = `
      <button class="btn btn-ghost" type="button" data-action="open-documents"><svg class="ic"><use href="#i-files"/></svg><span>${esc(tr('كل المستندات', 'All documents'))}</span></button>
      <button class="btn btn-primary" type="button" data-action="add-entity"><svg class="ic"><use href="#i-plus"/></svg><span>${esc(isEdu ? tr('طالب جديد', 'New student') : tr('عميل جديد', 'New client'))}</span></button>`;

    appView().innerHTML = `
      ${pageHead(tr('المكتبة', 'Library'), title, sub, actions)}
      <section class="app-stats">
        ${statCard(title, fmtNum(platform().entities.length), tr('سجل نشط', 'active records'), isEdu ? 'graduation' : 'users')}
        ${statCard(tr('نشط', 'Active'), fmtNum(platform().entities.filter((e) => e.status === 'active').length), tr('وصول كامل', 'full access'), 'check')}
        ${statCard(tr('موقوف', 'Suspended'), fmtNum(platform().entities.filter((e) => e.status === 'inactive').length), tr('بحاجة مراجعة', 'needs review'), 'alert')}
        ${statCard(tr('مستندات مرتبطة', 'Linked documents'), fmtNum(platform().entities.reduce((sum, e) => sum + Number(e.docs || 0), 0)), tr('عبر السجل', 'across records'), 'files')}
      </section>
      <div class="app-toolbar">
        <label class="mini-search"><svg class="ic"><use href="#i-search"/></svg><input id="entitySearch" type="search" value="${esc(ui.entityQuery)}" placeholder="${esc(isEdu ? tr('ابحث بالاسم أو الرقم الأكاديمي…', 'Search name or academic ID…') : tr('ابحث بالاسم أو الحساب…', 'Search name or account…'))}" /></label>
        <span class="app-spacer"></span>
        <span class="chip chip-silver">${esc(tr(`${entities.length} نتيجة`, `${entities.length} results`))}</span>
      </div>
      <section class="card table-card">
        <div class="table-wrap">
          <table class="doc-table app-table">
            <thead><tr>
              <th>${esc(isEdu ? tr('الطالب', 'Student') : tr('العميل', 'Client'))}</th>
              <th>${esc(isEdu ? tr('البرنامج', 'Program') : tr('الحساب', 'Account'))}</th>
              <th>${esc(isEdu ? tr('القسم', 'Department') : tr('جهة الاتصال', 'Contact'))}</th>
              <th>${esc(tr('المستندات', 'Documents'))}</th>
              <th>${esc(tr('الحالة', 'Status'))}</th>
              <th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------------------
     Projects / departments
     --------------------------------------------------------------------- */
  function renderProjects() {
    const isEdu = state.sector === 'edu';
    const projects = platform().projects;
    const title = isEdu ? tr('الأقسام والكليات', 'Departments & colleges') : tr('المشاريع', 'Projects');
    const sub = isEdu
      ? tr('تابع المستندات حسب القسم أو الكلية ونسبة الاكتمال.', 'Track documents by department or college and completion.')
      : tr('تابع المستندات حسب المشروع ونسبة الاكتمال.', 'Track documents by project and completion.');

    const cards = projects
      .map(
        (project) => `
      <article class="info-card">
        <div class="info-card-top">
          <span class="info-card-ico"><svg class="ic"><use href="#i-layers"/></svg></span>
          ${displayStatus(project.status)}
        </div>
        <h3>${esc(pick(project.name))}</h3>
        <p>${esc(tr('المسؤول', 'Owner'))}: ${esc(pick(project.owner))} · ${esc(project.docs)} ${esc(tr('مستندًا', 'documents'))}</p>
        <div class="progress-line"><span style="width:${Math.max(0, Math.min(100, project.progress))}%"></span></div>
        <div class="info-card-foot">
          <span>${esc(tr(`${project.code} · ${project.progress}% مكتمل`, `${project.code} · ${project.progress}% complete`))}</span>
          <button class="text-btn" type="button" data-action="project-docs" data-value="${esc(pick(project.name))}">${esc(tr('المستندات', 'Documents'))}</button>
        </div>
      </article>`
      )
      .join('');

    const actions = `
      <button class="btn btn-ghost" type="button" data-action="open-documents"><svg class="ic"><use href="#i-files"/></svg><span>${esc(tr('كل المستندات', 'All documents'))}</span></button>
      <button class="btn btn-primary" type="button" data-action="add-project"><svg class="ic"><use href="#i-plus"/></svg><span>${esc(isEdu ? tr('قسم جديد', 'New department') : tr('مشروع جديد', 'New project'))}</span></button>`;

    appView().innerHTML = `
      ${pageHead(tr('المكتبة', 'Library'), title, sub, actions)}
      <section class="app-stats">
        ${statCard(title, fmtNum(projects.length), tr('في مساحة العمل', 'in the workspace'), 'layers')}
        ${statCard(tr('نشطة', 'Active'), fmtNum(projects.filter((p) => p.status === 'active').length), tr('قيد العمل', 'in progress'), 'check')}
        ${statCard(tr('متوسط الاكتمال', 'Average completion'), `${Math.round(projects.reduce((sum, p) => sum + Number(p.progress || 0), 0) / Math.max(projects.length, 1))}%`, tr('لكل المشاريع', 'across projects'), 'workflow')}
        ${statCard(tr('مستندات مرتبطة', 'Linked documents'), fmtNum(projects.reduce((sum, p) => sum + Number(String(p.docs).replace(/[^\d]/g, '') || 0), 0)), tr('عبر المكتبة', 'across the library'), 'files')}
      </section>
      <div class="card-grid">${cards}</div>`;
  }

  /* ---------------------------------------------------------------------
     Cold archive
     --------------------------------------------------------------------- */
  function renderColdArchive() {
    const items = platform().cold.filter((item) => {
      if (!ui.coldQuery.trim()) return true;
      const haystack = [pick(item.title), item.title.ar, item.title.en, catLabel(item.category), pick(item.owner)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(ui.coldQuery.trim().toLowerCase());
    });

    const rows = items.length
      ? items
          .map(
            (item) => `
        <tr>
          <td><div class="doc-cell"><span class="file-badge pdf"><svg class="ic"><use href="#i-archive"/></svg><em>ARC</em></span><span class="doc-name"><strong>${esc(pick(item.title))}</strong><small>${esc(catLabel(item.category))} · ${esc(item.size)}</small></span></div></td>
          <td>${esc(pick(item.owner))}</td>
          <td>${esc(fmtDate(item.date))}</td>
          <td>${esc(pick(item.retention))}</td>
          <td>${esc(pick(item.last))}</td>
          <td><button class="btn btn-ghost" type="button" data-action="cold-restore" data-id="${item.id}"><svg class="ic"><use href="#i-upload"/></svg><span>${esc(tr('استعادة', 'Restore'))}</span></button></td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="6"><div class="table-empty"><svg class="ic"><use href="#i-archive"/></svg><strong>${esc(tr('الأرشيف البارد فارغ', 'Cold archive is empty'))}</strong></div></td></tr>`;

    const actions = `
      <button class="btn btn-ghost" type="button" data-action="open-settings"><svg class="ic"><use href="#i-settings"/></svg><span>${esc(tr('سياسة الاحتفاظ', 'Retention policy'))}</span></button>
      <button class="btn btn-primary" type="button" data-action="open-documents"><svg class="ic"><use href="#i-files"/></svg><span>${esc(tr('المكتبة', 'Library'))}</span></button>`;

    appView().innerHTML = `
      ${pageHead(tr('المكتبة', 'Library'), tr('الأرشيف البارد', 'Cold archive'), tr('مستندات منخفضة الوصول محفوظة بأقل تكلفة مع استعادة فورية.', 'Low-access documents stored at the lowest cost with instant restore.'), actions)}
      <section class="app-stats">
        ${statCard(tr('مستندات مؤرشفة', 'Archived documents'), fmtNum(platform().cold.length), tr('في التخزين البارد', 'in cold storage'), 'archive')}
        ${statCard(tr('مساحة موفّرة', 'Storage saved'), '18.4 GB', tr('مقارنة بالتخزين الساخن', 'vs hot storage'), 'database')}
        ${statCard(tr('سياسة الاحتفاظ', 'Retention policy'), tr('7 سنوات', '7 years'), tr('حسب التصنيف', 'by category'), 'clock')}
        ${statCard(tr('زمن الاستعادة', 'Restore time'), tr('< 3 دقائق', '< 3 minutes'), tr('في النموذج التجريبي', 'in the demo'), 'upload')}
      </section>
      <div class="app-toolbar">
        <label class="mini-search"><svg class="ic"><use href="#i-search"/></svg><input id="coldSearch" type="search" value="${esc(ui.coldQuery)}" placeholder="${esc(tr('ابحث في الأرشيف البارد…', 'Search cold archive…'))}" /></label>
        <span class="app-spacer"></span>
        <span class="chip chip-silver">${esc(tr(`${items.length} مستندًا`, `${items.length} documents`))}</span>
      </div>
      <section class="card table-card">
        <div class="table-wrap">
          <table class="doc-table app-table">
            <thead><tr>
              <th>${esc(tr('المستند', 'Document'))}</th>
              <th>${esc(tr('المسؤول', 'Owner'))}</th>
              <th>${esc(tr('تاريخ الأرشفة', 'Archived'))}</th>
              <th>${esc(tr('الاحتفاظ', 'Retention'))}</th>
              <th>${esc(tr('آخر وصول', 'Last access'))}</th>
              <th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      <div class="app-note" style="margin-top:13px">
        <svg class="ic"><use href="#i-archive"/></svg>
        <span>${esc(tr('الاستعادة تنقل المستند إلى المكتبة النشطة وتضيف حدثاً في سجل المراجعة.', 'Restoring moves the document to the active library and records an audit event.'))}</span>
      </div>`;
  }

  /* ---------------------------------------------------------------------
     Users & permissions
     --------------------------------------------------------------------- */
  function renderUsers() {
    const team = platform().team;
    const roles = ['admin', 'manager', 'editor', 'viewer'];

    const rows = team
      .map((member) => {
        const roleOptions = roles
          .map(
            (role) =>
              `<option value="${role}" ${member.role === role ? 'selected' : ''}>${esc(roleLabel(role))}</option>`
          )
          .join('');
        return `
        <tr>
          <td><div class="doc-cell"><span class="entity-avatar">${esc(member.initials || initialsOf(pick(member.name)))}</span><span class="doc-name"><strong>${esc(pick(member.name))}</strong><small>${esc(member.email)}</small></span></div></td>
          <td><select class="app-select" data-user-role="${member.id}" aria-label="${esc(tr('الدور', 'Role'))}">${roleOptions}</select></td>
          <td>${displayStatus(member.status)}</td>
          <td>${esc(pick(member.last))}</td>
          <td><button class="btn btn-ghost" type="button" data-action="user-toggle" data-id="${member.id}">${esc(member.status === 'active' ? tr('إيقاف', 'Suspend') : tr('تنشيط', 'Activate'))}</button></td>
        </tr>`;
      })
      .join('');

    const matrix = roles
      .map(
        (role) => `
      <div class="info-card">
        <div class="info-card-top"><span class="info-card-ico"><svg class="ic"><use href="#i-shield"/></svg></span><span class="chip chip-silver">${esc(roleLabel(role))}</span></div>
        <h3>${esc(roleLabel(role))}</h3>
        <p>${esc(
          role === 'admin'
            ? tr('كل الصلاحيات بما فيها الإعدادات والمستخدمون.', 'All permissions including settings and users.')
            : role === 'manager'
              ? tr('إدارة المكتبة وسير العمل والتقارير.', 'Manage library, workflows and reports.')
              : role === 'editor'
                ? tr('رفع المستندات وتحرير البيانات الوصفية.', 'Upload documents and edit metadata.')
                : tr('عرض المستندات المعتمدة فقط.', 'View approved documents only.')
        )}</p>
      </div>`
      )
      .join('');

    const actions = `
      <button class="btn btn-ghost" type="button" data-action="open-audit"><svg class="ic"><use href="#i-eye"/></svg><span>${esc(tr('سجل المراجعة', 'Audit log'))}</span></button>
      <button class="btn btn-primary" type="button" data-action="add-user"><svg class="ic"><use href="#i-plus"/></svg><span>${esc(tr('دعوة مستخدم', 'Invite user'))}</span></button>`;

    appView().innerHTML = `
      ${pageHead(tr('الحوكمة', 'Governance'), tr('المستخدمون والصلاحيات', 'Users & permissions'), tr('أدر فريق العمل والأدوار وصلاحيات الوصول.', 'Manage your team, roles and access permissions.'), actions)}
      <section class="app-stats">
        ${statCard(tr('أعضاء الفريق', 'Team members'), fmtNum(team.length), tr('في مساحة العمل', 'in the workspace'), 'users')}
        ${statCard(tr('نشط', 'Active'), fmtNum(team.filter((m) => m.status === 'active').length), tr('وصول حالي', 'current access'), 'check')}
        ${statCard(tr('مديرو النظام', 'Administrators'), fmtNum(team.filter((m) => m.role === 'admin').length), tr('صلاحيات كاملة', 'full permissions'), 'shield')}
        ${statCard(tr('الأدوار', 'Roles'), fmtNum(roles.length), tr('مستويات صلاحيات', 'permission levels'), 'layers')}
      </section>
      <section class="card table-card" style="margin-bottom:14px">
        <div class="table-wrap">
          <table class="doc-table app-table">
            <thead><tr>
              <th>${esc(tr('المستخدم', 'User'))}</th>
              <th>${esc(tr('الدور', 'Role'))}</th>
              <th>${esc(tr('الحالة', 'Status'))}</th>
              <th>${esc(tr('آخر نشاط', 'Last active'))}</th>
              <th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      <h2 style="font-size:14px;margin-bottom:11px">${esc(tr('مصفوفة الصلاحيات', 'Permission matrix'))}</h2>
      <div class="card-grid">${matrix}</div>`;
  }

  /* ---------------------------------------------------------------------
     Audit log
     --------------------------------------------------------------------- */
  function auditIcon(icon) {
    if (icon === 'ai') return 'sparkles';
    if (icon === 'ok') return 'check';
    if (icon === 'warn') return 'pen';
    if (icon === 'scan') return 'scan';
    if (icon === 'tag') return 'tag';
    if (icon === 'user') return 'users';
    if (icon === 'archive') return 'archive';
    return 'eye';
  }

  function renderAuditView() {
    const query = ui.auditQuery.trim().toLowerCase();
    const activity = platform().activity.filter((item) => {
      if (!query) return true;
      const text = `${pick(item.text)} ${item.text.ar} ${item.text.en} ${pick(item.actor)} ${item.hash}`
        .replace(/<[^>]+>/g, ' ')
        .toLowerCase();
      return text.includes(query);
    });

    const rows = activity.length
      ? activity
          .map(
            (item) => `
        <tr>
          <td><div class="doc-cell"><span class="audit-row-ico ${esc(item.icon)}"><svg class="ic"><use href="#i-${auditIcon(item.icon)}"/></svg></span><span class="doc-name"><strong style="font-weight:400">${pick(item.text)}</strong><small>${esc(pick(item.actor))}</small></span></div></td>
          <td>${esc(pick(item.time))}</td>
          <td><span class="audit-hash">${esc(item.hash)}</span></td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="3"><div class="table-empty"><svg class="ic"><use href="#i-search"/></svg><strong>${esc(tr('لا توجد أحداث مطابقة', 'No matching events'))}</strong></div></td></tr>`;

    const actions = `
      <button class="btn btn-ghost" type="button" data-action="verify-audit"><svg class="ic"><use href="#i-shield"/></svg><span>${esc(tr('التحقق من السلسلة', 'Verify chain'))}</span></button>
      <button class="btn btn-ghost" type="button" data-action="export-audit"><svg class="ic"><use href="#i-download"/></svg><span>${esc(tr('تصدير', 'Export'))}</span></button>`;

    appView().innerHTML = `
      ${pageHead(tr('الحوكمة', 'Governance'), tr('سجل المراجعة', 'Audit log'), tr('كل حدث موثّق ببصمة وسلسلة تحقق غير قابلة للتعديل.', 'Every event recorded with a hash and a verifiable chain.'), actions)}
      <section class="app-stats">
        ${statCard(tr('إجمالي الأحداث', 'Total events'), fmtNum(platform().activity.length), tr('في السجل', 'in the log'), 'eye')}
        ${statCard(tr('أحداث آلية', 'Automated events'), fmtNum(platform().activity.filter((i) => i.icon === 'ai').length), tr('OCR واستخراج', 'OCR and extraction'), 'sparkles')}
        ${statCard(tr('توقيعات واعتمادات', 'Signatures & approvals'), fmtNum(platform().activity.filter((i) => /توقيع|اعتماد|sign|approv/i.test(pick(i.text))).length), tr('موثّقة', 'recorded'), 'pen')}
        ${statCard(tr('حالة السلسلة', 'Chain status'), tr('سليمة', 'Verified'), tr('آخر تحقق الآن', 'last checked now'), 'shield')}
      </section>
      <div class="app-toolbar">
        <label class="mini-search"><svg class="ic"><use href="#i-search"/></svg><input id="auditSearch" type="search" value="${esc(ui.auditQuery)}" placeholder="${esc(tr('ابحث في الأحداث أو المستخدمين…', 'Search events or users…'))}" /></label>
        <span class="app-spacer"></span>
        <span class="chip chip-silver">${esc(tr(`${activity.length} حدثاً`, `${activity.length} events`))}</span>
      </div>
      <section class="card table-card">
        <div class="table-wrap">
          <table class="doc-table app-table audit-table">
            <thead><tr>
              <th>${esc(tr('الحدث', 'Event'))}</th>
              <th>${esc(tr('الوقت', 'Time'))}</th>
              <th>${esc(tr('البصمة', 'Hash'))}</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>`;
  }

  /* ---------------------------------------------------------------------
     Settings
     --------------------------------------------------------------------- */
  function formField(label, name, value, type = 'text', extra = '') {
    return `
      <label class="app-form-field">
        <span>${esc(label)}</span>
        <input class="app-input" type="${type}" name="${name}" value="${esc(value)}" ${extra} />
      </label>`;
  }

  function selectField(label, name, options, selected) {
    return `
      <label class="app-form-field">
        <span>${esc(label)}</span>
        <select class="app-select" name="${name}">
          ${options
            .map(
              (option) =>
                `<option value="${esc(option.value)}" ${String(selected) === String(option.value) ? 'selected' : ''}>${esc(option.label)}</option>`
            )
            .join('')}
        </select>
      </label>`;
  }

  function switchRow(name, label, sub, checked) {
    return `
      <label class="switch-row">
        <input type="checkbox" name="${name}" ${checked ? 'checked' : ''} />
        <span class="switch-ui" aria-hidden="true"></span>
        <span><strong>${esc(label)}</strong><small>${esc(sub)}</small></span>
      </label>`;
  }

  function renderSettings() {
    const settings = getSettings();
    const planNames = { starter: tr('الأساسية', 'Starter'), pro: tr('الاحترافية', 'Professional'), enterprise: tr('المؤسسية', 'Enterprise') };

    const actions = `
      <button class="btn btn-primary" type="submit" form="settingsForm"><svg class="ic"><use href="#i-check"/></svg><span>${esc(tr('حفظ التغييرات', 'Save changes'))}</span></button>`;

    appView().innerHTML = `
      ${pageHead(tr('الحوكمة', 'Governance'), tr('الإعدادات', 'Settings'), tr('بيانات المؤسسة والمظهر والإشعارات والأمان والخطة.', 'Organization, appearance, notifications, security and plan.'), actions)}
      <form id="settingsForm">
        <div class="settings-grid">
          <div style="display:flex;flex-direction:column;gap:13px">
            <section class="card settings-card">
              <h3>${esc(tr('بيانات المؤسسة', 'Organization profile'))}</h3>
              <p>${esc(tr('تظهر هذه البيانات في مساحة العمل والتقارير.', 'These details appear across the workspace and reports.'))}</p>
              <div class="settings-list">
                <div class="app-form-grid" style="margin-top:10px">
                  ${formField(tr('اسم المؤسسة', 'Organization name'), 'orgName', settings.orgName, 'text', 'required')}
                  ${formField(tr('البريد الإداري', 'Admin email'), 'orgEmail', settings.orgEmail, 'email', 'required')}
                  ${selectField(tr('نوع المؤسسة', 'Organization type'), 'sector', [
                    { value: 'edu', label: tr('تعليمي', 'Education') },
                    { value: 'corp', label: tr('مؤسسي', 'Enterprise') },
                  ], settings.sector)}
                  ${selectField(tr('المنطقة الزمنية', 'Time zone'), 'timezone', [
                    { value: 'Asia/Riyadh', label: tr('الرياض (GMT+3)', 'Riyadh (GMT+3)') },
                    { value: 'Asia/Dubai', label: tr('دبي (GMT+4)', 'Dubai (GMT+4)') },
                    { value: 'UTC', label: 'UTC' },
                  ], settings.timezone)}
                </div>
              </div>
            </section>

            <section class="card settings-card">
              <h3>${esc(tr('المظهر واللغة', 'Appearance & language'))}</h3>
              <p>${esc(tr('تُحفظ التفضيلات في هذا المتصفح.', 'Preferences are saved in this browser.'))}</p>
              <div class="settings-list">
                <div class="app-form-grid" style="margin-top:10px">
                  ${selectField(tr('المظهر', 'Theme'), 'theme', [
                    { value: 'dark', label: tr('داكن', 'Dark') },
                    { value: 'light', label: tr('فاتح', 'Light') },
                  ], settings.theme)}
                  ${selectField(tr('لغة الواجهة', 'Interface language'), 'lang', [
                    { value: 'ar', label: 'العربية' },
                    { value: 'en', label: 'English' },
                  ], settings.lang)}
                </div>
              </div>
            </section>

            <section class="card settings-card">
              <h3>${esc(tr('الأمان', 'Security'))}</h3>
              <p>${esc(tr('خيارات الحماية والجلسات في النموذج التجريبي.', 'Protection and session options in the demo.'))}</p>
              <div class="settings-list">
                ${switchRow('twofa', tr('التحقق بخطوتين', 'Two-factor authentication'), tr('رمز إضافي عند تسجيل الدخول', 'Extra code at sign-in'), settings.twofa)}
                ${switchRow('watermark', tr('علامة مائية للمستندات', 'Document watermark'), tr('اسم المستخدم والتاريخ على المعاينات', 'User and date on previews'), settings.watermark)}
                <div class="setting-row">
                  <div class="setting-label"><strong>${esc(tr('مدة الجلسة', 'Session timeout'))}</strong><small>${esc(tr('تسجيل خروج تلقائي بعد عدم النشاط', 'Automatic sign-out after inactivity'))}</small></div>
                  <div class="setting-control">
                    <select class="app-select" name="sessionTimeout">
                      ${[15, 30, 60, 120].map((minutes) => `<option value="${minutes}" ${String(settings.sessionTimeout) === String(minutes) ? 'selected' : ''}>${minutes} ${esc(tr('دقيقة', 'minutes'))}</option>`).join('')}
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div style="display:flex;flex-direction:column;gap:13px">
            <section class="card settings-card">
              <h3>${esc(tr('الإشعارات', 'Notifications'))}</h3>
              <p>${esc(tr('اختر ما يصلك عبر البريد ولوحة التحكم.', 'Choose what reaches you by email and in the dashboard.'))}</p>
              <div class="settings-list">
                ${switchRow('notifEmail', tr('إشعارات البريد', 'Email notifications'), tr('ملخص يومي وطلبات التوقيع', 'Daily digest and signature requests'), settings.notifEmail)}
                ${switchRow('notifWeekly', tr('الملخص الأسبوعي', 'Weekly digest'), tr('تقرير أداء الأرشيف كل أحد', 'Archive performance every Sunday'), settings.notifWeekly)}
                ${switchRow('notifSign', tr('تنبيهات التوقيع', 'Signature alerts'), tr('عند وصول طلب جديد', 'When a new request arrives'), settings.notifSign)}
              </div>
            </section>

            <section class="card settings-card">
              <h3>${esc(tr('الخطة والتخزين', 'Plan & storage'))}</h3>
              <p>${esc(tr('الخطة الحالية وحدود التخزين.', 'Current plan and storage limits.'))}</p>
              <div class="plan-card is-active">
                <div><strong>${esc(planNames[settings.plan] || planNames.pro)}</strong><small>${esc(tr('2 TB تخزين · مستخدمون غير محدودين', '2 TB storage · unlimited users'))}</small></div>
                <em>${settings.plan === 'enterprise' ? tr('مخصص', 'Custom') : settings.plan === 'starter' ? '499' : '1,499'} ${settings.plan === 'enterprise' ? '' : tr('ر.س/شهر', 'SAR/mo')}</em>
              </div>
              <button class="btn btn-ghost" type="button" data-action="open-upgrade" style="width:100%;margin-top:10px"><svg class="ic"><use href="#i-arrow"/></svg><span>${esc(tr('مقارنة الخطط والترقية', 'Compare plans & upgrade'))}</span></button>
            </section>

            <section class="card settings-card">
              <h3>${esc(tr('الجلسة', 'Session'))}</h3>
              <p>${esc(tr('أنت مسجل الدخول باسم', 'Signed in as'))} <strong>${esc(USER.email)}</strong>.</p>
              <button class="btn btn-ghost" type="button" data-action="logout" style="width:100%;margin-top:10px"><svg class="ic"><use href="#i-logout"/></svg><span>${esc(tr('تسجيل الخروج', 'Sign out'))}</span></button>
            </section>
          </div>
        </div>
      </form>`;
  }

  /* ---------------------------------------------------------------------
     Notifications
     --------------------------------------------------------------------- */
  function syncNotificationUI() {
    const list = platform().notifications;
    const unread = list.filter((item) => !item.read).length;
    const dot = $('#bellDot');
    if (dot) dot.classList.toggle('is-hidden', unread === 0);
    $$('.notif-item[data-notif]').forEach((el) => {
      const item = list.find((entry) => String(entry.id) === el.dataset.notif);
      if (item) el.classList.toggle('is-unread', !item.read);
    });
    if (ui.view === 'notifications') renderNotifications();
  }

  function markAllNotificationsRead() {
    platform().notifications.forEach((item) => {
      item.read = true;
    });
    $$('.notif-item').forEach((el) => el.classList.remove('is-unread'));
    $('#bellDot')?.classList.add('is-hidden');
    syncNotificationUI();
  }

  function renderNotifications() {
    const all = platform().notifications;
    const list = ui.notifUnreadOnly ? all.filter((item) => !item.read) : all;
    const unread = all.filter((item) => !item.read).length;

    const items = list.length
      ? list
          .map(
            (item) => `
        <article class="notif-page-item ${item.read ? '' : 'is-unread'}">
          <span class="notif-ico ${esc(item.icon)}"><svg class="ic"><use href="#i-${item.icon === 'ai' ? 'sparkles' : item.icon === 'success' ? 'check' : item.icon === 'warn' ? 'pen' : 'bell'}"/></svg></span>
          <div class="notif-page-body">
            <strong>${esc(pick(item.title))}</strong>
            <p>${esc(pick(item.sub))}</p>
            <time>${esc(pick(item.time))}</time>
          </div>
          <button class="btn btn-ghost" type="button" data-action="notif-toggle" data-id="${item.id}">${esc(item.read ? tr('تعليم كغير مقروء', 'Mark unread') : tr('تعليم كمقروء', 'Mark read'))}</button>
        </article>`
          )
          .join('')
      : `<div class="table-empty"><svg class="ic"><use href="#i-bell"/></svg><strong>${esc(tr('لا توجد إشعارات', 'No notifications'))}</strong></div>`;

    const actions = `
      <button class="btn btn-ghost" type="button" data-action="notif-filter"><svg class="ic"><use href="#i-filter"/></svg><span>${esc(ui.notifUnreadOnly ? tr('عرض الكل', 'Show all') : tr('غير المقروء فقط', 'Unread only'))}</span></button>
      <button class="btn btn-primary" type="button" data-action="mark-all-read"><svg class="ic"><use href="#i-check"/></svg><span>${esc(tr('تحديد الكل كمقروء', 'Mark all read'))}</span></button>`;

    appView().innerHTML = `
      ${pageHead(tr('النشاط', 'Activity'), tr('الإشعارات', 'Notifications'), tr('كل ما يحتاج انتباهك في مكان واحد.', 'Everything that needs your attention in one place.'), actions)}
      <section class="app-stats">
        ${statCard(tr('إجمالي الإشعارات', 'Total notifications'), fmtNum(all.length), tr('في مركز النشاط', 'in the activity centre'), 'bell')}
        ${statCard(tr('غير مقروء', 'Unread'), fmtNum(unread), tr('يحتاج انتباهك', 'needs attention'), 'alert')}
        ${statCard(tr('طلبات توقيع', 'Signature requests'), fmtNum(all.filter((i) => i.icon === 'warn').length), tr('بانتظار إجراء', 'waiting for action'), 'pen')}
        ${statCard(tr('آلية', 'Automated'), fmtNum(all.filter((i) => i.icon === 'ai').length), tr('من محرك المعالجة', 'from the pipeline'), 'sparkles')}
      </section>
      <div class="notif-page-list">${items}</div>`;
  }

  /* ---------------------------------------------------------------------
     Modals
     --------------------------------------------------------------------- */
  function openDocMenu(doc) {
    if (!doc) return;
    const archived = doc.status === 'archived';
    openModal({
      title: pick(doc.title),
      sub: `${catLabel(doc.category)} · ${doc.meta} · ${D.t(`status.${doc.status}`)}`,
      body: `
        <div class="modal-actions-list">
          <button type="button" data-action="open-doc" data-id="${doc.id}"><svg class="ic"><use href="#i-file"/></svg><span>${esc(tr('فتح المستند', 'Open document'))}</span></button>
          <button type="button" data-action="doc-download" data-id="${doc.id}"><svg class="ic"><use href="#i-download"/></svg><span>${esc(tr('تنزيل نسخة نصية', 'Download text copy'))}</span></button>
          <button type="button" data-action="doc-share" data-id="${doc.id}"><svg class="ic"><use href="#i-users"/></svg><span>${esc(tr('مشاركة رابط مؤقت', 'Share a temporary link'))}</span></button>
          <button type="button" data-action="doc-sign" data-id="${doc.id}"><svg class="ic"><use href="#i-pen"/></svg><span>${esc(tr('توقيع واعتماد', 'Sign & approve'))}</span></button>
          <button type="button" data-action="${archived ? 'doc-restore' : 'doc-archive'}" data-id="${doc.id}"><svg class="ic"><use href="#i-${archived ? 'upload' : 'archive'}"/></svg><span>${esc(archived ? tr('استعادة من الأرشيف', 'Restore from archive') : tr('نقل إلى الأرشيف البارد', 'Move to cold archive'))}</span></button>
        </div>`,
      foot: `<button class="btn btn-ghost" type="button" data-action="close-modal">${esc(tr('إغلاق', 'Close'))}</button>`,
    });
  }

  function shareDoc(doc) {
    if (!doc) return;
    const link = `${location.origin}/prototype/?share=${hashLike()}${hashLike()}&doc=${encodeURIComponent(doc.id)}`;
    openModal({
      title: tr('مشاركة المستند', 'Share document'),
      sub: pick(doc.title),
      body: `
        <p class="modal-copy">${esc(tr('أنشئ رابطاً مؤقتاً للمشاركة الخارجية. ينتهي الرابط تلقائياً بعد 7 أيام ويُسجّل في سجل المراجعة.', 'Create a temporary external link. It expires automatically after 7 days and is recorded in the audit log.'))}</p>
        <div class="share-link"><input class="app-input" id="shareLinkInput" type="text" readonly value="${esc(link)}" /></div>
        <div class="app-form-grid" style="margin-top:12px">
          <label class="app-form-field"><span>${esc(tr('الصلاحية', 'Permission'))}</span><select class="app-select" id="sharePermission"><option>${esc(tr('عرض فقط', 'View only'))}</option><option>${esc(tr('تعليق', 'Comment'))}</option></select></label>
          <label class="app-form-field"><span>${esc(tr('تنتهي بعد', 'Expires in'))}</span><select class="app-select" id="shareExpiry"><option>7 ${esc(tr('أيام', 'days'))}</option><option>24 ${esc(tr('ساعة', 'hours'))}</option><option>30 ${esc(tr('يومًا', 'days'))}</option></select></label>
        </div>`,
      foot: `
        <button class="btn btn-ghost" type="button" data-action="close-modal">${esc(tr('إغلاق', 'Close'))}</button>
        <button class="btn btn-primary" type="button" data-action="copy-share"><svg class="ic"><use href="#i-files"/></svg><span>${esc(tr('نسخ الرابط', 'Copy link'))}</span></button>`,
    });
    logActivity('ok', `شارك <strong>${esc(USER.name)}</strong> رابطاً مؤقتاً لمستند`, `<strong>${esc(USER.name)}</strong> shared a temporary document link`);
  }

  function openFilterModal() {
    const catOptions = ['all', ...categoryList().map((cat) => cat.key)]
      .filter((key, index, array) => array.indexOf(key) === index)
      .map(
        (key) =>
          `<option value="${esc(key)}" ${ui.docCat === key ? 'selected' : ''}>${
            key === 'all' ? tr('كل التصنيفات', 'All categories') : esc(catLabel(key))
          }</option>`
      )
      .join('');
    const statuses = ['all', 'approved', 'pending', 'signed', 'processing', 'archived'];
    const statusOptions = statuses
      .map(
        (status) =>
          `<option value="${status}" ${ui.docStatus === status ? 'selected' : ''}>${
            status === 'all' ? tr('كل الحالات', 'All statuses') : D.t(`status.${status}`)
          }</option>`
      )
      .join('');

    openModal({
      title: tr('تصفية المستندات', 'Filter documents'),
      sub: tr('اختر التصنيف والحالة ثم اعرض النتائج.', 'Choose a category and status, then view the results.'),
      body: `
        <form id="filterForm">
          <div class="app-form-grid">
            <label class="app-form-field"><span>${esc(tr('التصنيف', 'Category'))}</span><select class="app-select" name="category">${catOptions}</select></label>
            <label class="app-form-field"><span>${esc(tr('الحالة', 'Status'))}</span><select class="app-select" name="status">${statusOptions}</select></label>
          </div>
          <label class="app-form-field" style="margin-top:11px"><span>${esc(tr('بحث نصي', 'Text search'))}</span><input class="app-input" type="search" name="query" value="${esc(ui.docQuery)}" placeholder="${esc(tr('عنوان أو مسؤول…', 'Title or owner…'))}" /></label>
        </form>`,
      foot: `
        <button class="btn btn-ghost" type="button" data-action="close-modal">${esc(tr('إلغاء', 'Cancel'))}</button>
        <button class="btn btn-primary" type="submit" form="filterForm">${esc(tr('تطبيق الفلتر', 'Apply filter'))}</button>`,
      onSubmit: (form) => {
        const data = new FormData(form);
        ui.docCat = String(data.get('category') || 'all');
        ui.docStatus = String(data.get('status') || 'all');
        ui.docQuery = String(data.get('query') || '');
        ui.page.documents = 1;
        closeModal();
        setView('documents');
      },
    });
  }

  function openWorkspaceModal() {
    const sector = state.sector;
    openModal({
      title: tr('تبديل مساحة العمل', 'Switch workspace'),
      sub: tr('لكل بيئة بياناتها ومستنداتها التجريبية.', 'Each environment has its own demo data and documents.'),
      body: `
        <div class="modal-actions-list">
          <button type="button" data-action="workspace-switch" data-sector="edu" class="${sector === 'edu' ? 'is-active' : ''}" style="${sector === 'edu' ? 'border-color:var(--line-strong);background:rgba(255,255,255,.05)' : ''}">
            <svg class="ic"><use href="#i-graduation"/></svg>
            <span><strong style="display:block;font-size:11px">${esc(tr('جامعة النور', 'Al-Noor University'))}</strong><small style="display:block;font-size:9px;color:var(--muted-2);margin-top:2px">${esc(tr('بيئة تعليمية · 24,860 مستندًا', 'Education · 24,860 documents'))}</small></span>
          </button>
          <button type="button" data-action="workspace-switch" data-sector="corp" class="${sector === 'corp' ? 'is-active' : ''}" style="${sector === 'corp' ? 'border-color:var(--line-strong);background:rgba(255,255,255,.05)' : ''}">
            <svg class="ic"><use href="#i-building"/></svg>
            <span><strong style="display:block;font-size:11px">${esc(tr('شركة أفق التقنية', 'Ufuq Technologies'))}</strong><small style="display:block;font-size:9px;color:var(--muted-2);margin-top:2px">${esc(tr('بيئة مؤسسية · 31,420 مستندًا', 'Enterprise · 31,420 documents'))}</small></span>
          </button>
        </div>`,
      foot: `<button class="btn btn-ghost" type="button" data-action="close-modal">${esc(tr('إغلاق', 'Close'))}</button>`,
    });
  }

  function openUpgradeModal() {
    const settings = getSettings();
    const plans = [
      { id: 'starter', name: tr('الأساسية', 'Starter'), price: '499', storage: tr('500 GB', '500 GB'), users: tr('10 مستخدمين', '10 users') },
      { id: 'pro', name: tr('الاحترافية', 'Professional'), price: '1,499', storage: tr('2 TB', '2 TB'), users: tr('مستخدمون غير محدودين', 'Unlimited users') },
      { id: 'enterprise', name: tr('المؤسسية', 'Enterprise'), price: tr('مخصص', 'Custom'), storage: tr('10 TB+', '10 TB+'), users: tr('صلاحيات متقدمة', 'Advanced controls') },
    ];
    const cards = plans
      .map(
        (plan) => `
      <button class="plan-card ${settings.plan === plan.id ? 'is-active' : ''}" type="button" data-action="upgrade-plan" data-plan="${plan.id}" style="width:100%;background:transparent;text-align:start">
        <div><strong>${esc(plan.name)}</strong><small>${esc(plan.storage)} · ${esc(plan.users)}</small></div>
        <em>${esc(plan.price)}${plan.id === 'enterprise' ? '' : ` ${esc(tr('ر.س/شهر', 'SAR/mo'))}`}</em>
      </button>`
      )
      .join('');

    openModal({
      title: tr('ترقية الخطة', 'Upgrade plan'),
      sub: tr('غيّر الخطة التجريبية فوراً. لا توجد مدفوعات حقيقية.', 'Change the demo plan instantly. No real payments.'),
      body: `<div class="modal-actions-list">${cards}</div>`,
      foot: `<button class="btn btn-ghost" type="button" data-action="close-modal">${esc(tr('إغلاق', 'Close'))}</button>`,
    });
  }

  function openScanModal() {
    openModal({
      title: tr('مسح ضوئي', 'Scan document'),
      sub: tr('محاكاة مسح ضوئي مع OCR عربي وإنجليزي.', 'Simulate a scan with Arabic and English OCR.'),
      body: `
        <div class="app-note"><svg class="ic"><use href="#i-scan"/></svg><span>${esc(tr('ضع المستند في الماسح ثم ابدأ. سيتم إنشاء مستند جديد وربطه بالمكتبة.', 'Place the document in the scanner, then start. A new document will be created and linked to the library.'))}</span></div>
        <div class="progress-line" style="height:8px;margin-top:16px"><span id="scanProgress" style="width:0%"></span></div>
        <p class="modal-copy" id="scanStatus" style="margin-top:10px">${esc(tr('جاهز للمسح', 'Ready to scan'))}</p>`,
      foot: `
        <button class="btn btn-ghost" type="button" data-action="close-modal">${esc(tr('إلغاء', 'Cancel'))}</button>
        <button class="btn btn-primary" type="button" data-action="scan-start"><svg class="ic"><use href="#i-scan"/></svg><span>${esc(tr('بدء المسح', 'Start scan'))}</span></button>`,
    });
  }

  function openHelpModal() {
    openModal({
      title: tr('مركز المساعدة', 'Help centre'),
      sub: tr('دليل سريع للنموذج التفاعلي.', 'A quick guide to the interactive demo.'),
      body: `
        <div class="modal-copy">
          <p><strong>${esc(tr('الحساب التجريبي', 'Demo account'))}</strong></p>
          <p><code>demo@archifex.sa</code> · <code>Demo@2026</code></p>
          <ul>
            <li>${esc(tr('استخدم القائمة الجانبية للتنقل بين المستندات والبحث وسير العمل والتصنيفات.', 'Use the sidebar to move between documents, search, workflows and categories.'))}</li>
            <li>${esc(tr('اضغط / أو Ctrl+K لفتح لوحة الأوامر.', 'Press / or Ctrl+K to open the command palette.'))}</li>
            <li>${esc(tr('كل الإجراءات تُسجّل في سجل المراجعة وتحفظ في هذا المتصفح.', 'Every action is recorded in the audit log and stored in this browser.'))}</li>
          </ul>
        </div>`,
      foot: `<button class="btn btn-primary" type="button" data-action="close-modal">${esc(tr('فهمت', 'Got it'))}</button>`,
    });
  }

  function openPrivacyModal() {
    openModal({
      title: tr('الخصوصية', 'Privacy'),
      sub: tr('كيف يتعامل النموذج مع بياناتك؟', 'How the demo handles your data.'),
      body: `
        <div class="modal-copy">
          <p>${esc(tr('هذا نموذج واجهة أمامي فقط. لا يتم إرسال بياناتك إلى أي خادم.', 'This is a front-end interface prototype. No data is sent to any server.'))}</p>
          <ul>
            <li>${esc(tr('الحساب وكلمة المرور المشفرة والجلسة تُحفظ في التخزين المحلي للمتصفح.', 'Your account, hashed password and session are stored in browser local storage.'))}</li>
            <li>${esc(tr('يمكنك مسح كل البيانات عبر تسجيل الخروج ثم حذف بيانات الموقع من المتصفح.', 'You can clear everything by signing out and clearing site data in your browser.'))}</li>
            <li>${esc(tr('المستندات والبيانات المعروضة تجريبية بالكامل.', 'All displayed documents and data are fictional.'))}</li>
          </ul>
        </div>`,
      foot: `<button class="btn btn-primary" type="button" data-action="close-modal">${esc(tr('إغلاق', 'Close'))}</button>`,
    });
  }

  function openAddCategoryModal() {
    openModal({
      title: tr('تصنيف جديد', 'New category'),
      sub: tr('سيظهر التصنيف فوراً في فلاتر المستندات.', 'The category appears immediately in document filters.'),
      body: `
        <form id="addCategoryForm">
          <div class="app-form-grid">
            ${formField(tr('الاسم بالعربية', 'Arabic name'), 'nameAr', '', 'text', 'required placeholder="مثال: عقود الشراكة"')}
            ${formField(tr('الاسم بالإنجليزية', 'English name'), 'nameEn', '', 'text', 'placeholder="e.g. Partnership contracts"')}
          </div>
        </form>`,
      foot: `
        <button class="btn btn-ghost" type="button" data-action="close-modal">${esc(tr('إلغاء', 'Cancel'))}</button>
        <button class="btn btn-primary" type="submit" form="addCategoryForm">${esc(tr('إضافة التصنيف', 'Add category'))}</button>`,
      onSubmit: (form) => {
        const data = new FormData(form);
        const nameAr = String(data.get('nameAr') || '').trim();
        const nameEn = String(data.get('nameEn') || '').trim() || nameAr;
        if (!nameAr) return showToast(tr('أدخل اسم التصنيف.', 'Enter a category name.'));
        const key = `custom.${slugify(nameAr)}`;
        if (categoryList().some((cat) => cat.key === key)) {
          return showToast(tr('هذا التصنيف موجود بالفعل.', 'This category already exists.'));
        }
        platform().customCats.push({ key, label: L(nameAr, nameEn), count: '0', pct: 2 });
        logActivity('tag', `أنشأ <strong>${esc(USER.name)}</strong> تصنيف <strong>${esc(nameAr)}</strong>`, `<strong>${esc(USER.name)}</strong> created the category <strong>${esc(nameEn)}</strong>`);
        closeModal();
        renderCategoriesView();
        showToast(tr('تم إنشاء التصنيف.', 'Category created.'));
      },
    });
  }

  function openAddEntityModal() {
    const isEdu = state.sector === 'edu';
    openModal({
      title: isEdu ? tr('طالب جديد', 'New student') : tr('عميل جديد', 'New client'),
      sub: tr('أضف سجلاً تجريبياً واربطه بالمستندات.', 'Add a demo record and link it to documents.'),
      body: `
        <form id="addEntityForm">
          <div class="app-form-grid">
            ${formField(tr('الاسم بالعربية', 'Arabic name'), 'nameAr', '', 'text', 'required')}
            ${formField(tr('الاسم بالإنجليزية', 'English name'), 'nameEn', '', 'text')}
            ${formField(isEdu ? tr('الرقم الأكاديمي', 'Academic ID') : tr('رقم الحساب', 'Account no.'), 'no', '', 'text', 'required')}
            ${formField(isEdu ? tr('البرنامج', 'Program') : tr('جهة الاتصال', 'Contact'), 'detail', '', 'text')}
            ${formField(isEdu ? tr('القسم', 'Department') : tr('القسم المسؤول', 'Department'), 'dept', '', 'text')}
          </div>
        </form>`,
      foot: `
        <button class="btn btn-ghost" type="button" data-action="close-modal">${esc(tr('إلغاء', 'Cancel'))}</button>
        <button class="btn btn-primary" type="submit" form="addEntityForm">${esc(tr('إضافة', 'Add'))}</button>`,
      onSubmit: (form) => {
        const data = new FormData(form);
        const nameAr = String(data.get('nameAr') || '').trim();
        const nameEn = String(data.get('nameEn') || '').trim() || nameAr;
        const no = String(data.get('no') || '').trim();
        if (!nameAr || !no) return showToast(tr('أدخل الاسم والرقم.', 'Enter a name and number.'));
        platform().entities.push({
          id: `ent-${Date.now().toString(36)}`,
          name: L(nameAr, nameEn),
          no,
          detail: L(String(data.get('detail') || '—'), String(data.get('detail') || '—')),
          dept: L(String(data.get('dept') || '—'), String(data.get('dept') || '—')),
          docs: 0,
          status: 'active',
        });
        logActivity('user', `أضاف <strong>${esc(USER.name)}</strong> سجل ${isEdu ? 'طالب' : 'عميل'} جديد`, `<strong>${esc(USER.name)}</strong> added a new ${isEdu ? 'student' : 'client'} record`);
        closeModal();
        renderEntities();
        showToast(tr('تمت إضافة السجل.', 'Record added.'));
      },
    });
  }

  function openAddProjectModal() {
    const isEdu = state.sector === 'edu';
    openModal({
      title: isEdu ? tr('قسم جديد', 'New department') : tr('مشروع جديد', 'New project'),
      sub: tr('أضف مساحة عمل جديدة للمستندات.', 'Add a new workspace for documents.'),
      body: `
        <form id="addProjectForm">
          <div class="app-form-grid">
            ${formField(tr('الاسم بالعربية', 'Arabic name'), 'nameAr', '', 'text', 'required')}
            ${formField(tr('الاسم بالإنجليزية', 'English name'), 'nameEn', '', 'text')}
            ${formField(tr('الرمز', 'Code'), 'code', '', 'text', 'required placeholder="PRJ-01"')}
            ${formField(tr('المسؤول', 'Owner'), 'owner', USER.name, 'text')}
            ${formField(tr('نسبة الاكتمال', 'Completion %'), 'progress', '35', 'number', 'min="0" max="100"')}
          </div>
        </form>`,
      foot: `
        <button class="btn btn-ghost" type="button" data-action="close-modal">${esc(tr('إلغاء', 'Cancel'))}</button>
        <button class="btn btn-primary" type="submit" form="addProjectForm">${esc(tr('إضافة', 'Add'))}</button>`,
      onSubmit: (form) => {
        const data = new FormData(form);
        const nameAr = String(data.get('nameAr') || '').trim();
        const nameEn = String(data.get('nameEn') || '').trim() || nameAr;
        const code = String(data.get('code') || '').trim();
        if (!nameAr || !code) return showToast(tr('أدخل الاسم والرمز.', 'Enter a name and code.'));
        platform().projects.push({
          id: `prj-${Date.now().toString(36)}`,
          code,
          name: L(nameAr, nameEn),
          owner: L(String(data.get('owner') || USER.name), String(data.get('owner') || USER.name)),
          docs: '0',
          progress: Math.max(0, Math.min(100, Number(data.get('progress') || 0))),
          status: 'active',
        });
        logActivity('layers', `أنشأ <strong>${esc(USER.name)}</strong> ${isEdu ? 'قسماً' : 'مشروعاً'} جديداً`, `<strong>${esc(USER.name)}</strong> created a new ${isEdu ? 'department' : 'project'}`);
        closeModal();
        renderProjects();
        showToast(tr('تم إنشاء مساحة العمل.', 'Workspace created.'));
      },
    });
  }

  function openAddUserModal() {
    openModal({
      title: tr('دعوة مستخدم', 'Invite user'),
      sub: tr('الدعوة محاكاة ولن يُرسل بريد حقيقي.', 'The invitation is simulated; no real email is sent.'),
      body: `
        <form id="addUserForm">
          <div class="app-form-grid">
            ${formField(tr('الاسم الكامل', 'Full name'), 'name', '', 'text', 'required')}
            ${formField(tr('البريد الإلكتروني', 'Email'), 'email', '', 'email', 'required placeholder="name@company.sa"')}
            ${selectField(tr('الدور', 'Role'), 'role', [
              { value: 'admin', label: roleLabel('admin') },
              { value: 'manager', label: roleLabel('manager') },
              { value: 'editor', label: roleLabel('editor') },
              { value: 'viewer', label: roleLabel('viewer') },
            ], 'editor')}
            ${formField(tr('القسم', 'Department'), 'dept', '', 'text')}
          </div>
        </form>`,
      foot: `
        <button class="btn btn-ghost" type="button" data-action="close-modal">${esc(tr('إلغاء', 'Cancel'))}</button>
        <button class="btn btn-primary" type="submit" form="addUserForm">${esc(tr('إرسال الدعوة', 'Send invite'))}</button>`,
      onSubmit: (form) => {
        const data = new FormData(form);
        const name = String(data.get('name') || '').trim();
        const email = String(data.get('email') || '').trim().toLowerCase();
        if (!name || !email) return showToast(tr('أدخل الاسم والبريد.', 'Enter a name and email.'));
        if (platform().team.some((member) => member.email === email)) {
          return showToast(tr('هذا البريد موجود بالفعل.', 'This email already exists.'));
        }
        platform().team.push({
          id: `usr-${Date.now().toString(36)}`,
          name: L(name, name),
          email,
          role: String(data.get('role') || 'editor'),
          status: 'active',
          last: L('دعوة جديدة', 'New invite'),
          initials: initialsOf(name),
        });
        logActivity('user', `دعا <strong>${esc(USER.name)}</strong> مستخدماً جديداً`, `<strong>${esc(USER.name)}</strong> invited a new user`);
        closeModal();
        renderUsers();
        showToast(tr('تمت إضافة المستخدم (محاكاة).', 'User added (simulated).'));
      },
    });
  }

  function openVerifyAuditModal() {
    const items = platform().activity.slice(0, 5);
    openModal({
      title: tr('التحقق من سلسلة المراجعة', 'Verify audit chain'),
      sub: tr('يتم التحقق من بصمات الأحداث الأخيرة.', 'Verifying the hashes of recent events.'),
      body: `
        <div class="app-note"><svg class="ic"><use href="#i-shield"/></svg><span>${esc(tr('السلسلة سليمة: كل حدث مرتبط بالحدث السابق.', 'Chain verified: every event is linked to the previous one.'))}</span></div>
        <div class="settings-list">
          ${items
            .map(
              (item) =>
                `<div class="setting-row"><div class="setting-label"><strong style="font-weight:400">${pick(item.text)}</strong><small>${esc(pick(item.time))}</small></div><span class="audit-hash">${esc(item.hash)}</span></div>`
            )
            .join('')}
        </div>`,
      foot: `<button class="btn btn-primary" type="button" data-action="close-modal">${esc(tr('إغلاق', 'Close'))}</button>`,
    });
    showToast(tr('تم التحقق من السلسلة بنجاح.', 'Chain verified successfully.'));
  }

  /* ---------------------------------------------------------------------
     Actions
     --------------------------------------------------------------------- */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeFilename(value) {
    return String(value).replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 90) || 'archifex-document';
  }

  function downloadDoc(doc) {
    if (!doc) return;
    const ocr = pick(current().drawer.ocr).replace(/\[\[|\]\]/g, '');
    const text = [
      pick(doc.title),
      '='.repeat(48),
      `${tr('التصنيف', 'Category')}: ${catLabel(doc.category)}`,
      `${tr('الحالة', 'Status')}: ${D.t(`status.${doc.status}`)}`,
      `${tr('المسؤول', 'Owner')}: ${pick(doc.owner)}`,
      `${tr('التاريخ', 'Date')}: ${fmtDate(doc.date, { day: 'numeric', month: 'long', year: 'numeric' })}`,
      `${tr('الربط', 'Linked to')}: ${pick(doc.linkValue)}`,
      `${tr('الحجم', 'Size')}: ${doc.meta}`,
      '',
      tr('النص المستخرج', 'Extracted text'),
      '-'.repeat(48),
      ocr,
    ].join('\n');
    downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${safeFilename(pick(doc.title))}.txt`);
    logActivity('ok', `نزّل <strong>${esc(USER.name)}</strong> نسخة من مستند`, `<strong>${esc(USER.name)}</strong> downloaded a document copy`);
    showToast(tr('تم تنزيل نسخة نصية من المستند.', 'A text copy of the document was downloaded.'));
  }

  function exportDocs(docs) {
    const header = [
      tr('العنوان', 'Title'),
      tr('التصنيف', 'Category'),
      tr('الحالة', 'Status'),
      tr('المسؤول', 'Owner'),
      tr('التاريخ', 'Date'),
      tr('مرتبط بـ', 'Linked to'),
      tr('الحجم', 'Size'),
    ];
    const rows = docs.map((doc) => [
      pick(doc.title),
      catLabel(doc.category),
      D.t(`status.${doc.status}`),
      pick(doc.owner),
      doc.date,
      pick(doc.linkValue),
      doc.meta,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    downloadBlob(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }), `archifex-documents-${state.sector}-2026-10-20.csv`);
    showToast(tr(`تم تصدير ${fmtNum(docs.length)} مستندًا إلى CSV.`, `Exported ${fmtNum(docs.length)} documents to CSV.`));
  }

  function exportAudit() {
    const header = [tr('الحدث', 'Event'), tr('المستخدم', 'Actor'), tr('الوقت', 'Time'), tr('البصمة', 'Hash')];
    const rows = platform().activity.map((item) => [
      pick(item.text).replace(/<[^>]+>/g, ''),
      pick(item.actor),
      pick(item.time),
      item.hash,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    downloadBlob(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }), `archifex-audit-${state.sector}-2026-10-20.csv`);
    showToast(tr('تم تصدير سجل المراجعة.', 'Audit log exported.'));
  }

  function copyText(text, sourceInput) {
    const done = () => showToast(tr('تم نسخ الرابط.', 'Link copied.'));
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, sourceInput, done));
    } else {
      fallbackCopy(text, sourceInput, done);
    }
  }

  function fallbackCopy(text, sourceInput, done) {
    if (sourceInput) {
      sourceInput.focus();
      sourceInput.select();
      try {
        document.execCommand('copy');
        done();
        return;
      } catch (e) {}
    }
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    try {
      document.execCommand('copy');
      done();
    } catch (e) {
      showToast(tr('تعذّر النسخ تلقائياً. انسخ الرابط يدوياً.', 'Automatic copy failed. Copy the link manually.'));
    }
    helper.remove();
  }

  function signDocument(doc) {
    if (!doc) return;
    doc.status = 'approved';
    const before = current().workflow.length;
    current().workflow = current().workflow.filter((item) => item.docId !== doc.id);
    if (current().workflow.length < before) platform().workflowDone += 1;
    logActivity('ok', `وقّع <strong>${esc(USER.name)}</strong> واعتمد مستنداً`, `<strong>${esc(USER.name)}</strong> signed and approved a document`);
    D.renderAll();
    closeModal();
    if (state.doc) D.openDrawer(doc.id);
    renderActiveView();
    showToast(tr('تم توقيع المستند واعتماده.', 'Document signed and approved.'));
  }

  function signWorkflow(docId, approve) {
    const doc = D.findDoc(docId);
    const before = current().workflow.length;
    current().workflow = current().workflow.filter((item) => item.docId !== docId);
    if (current().workflow.length < before) platform().workflowDone += 1;
    if (doc) doc.status = 'approved';
    logActivity('ok', `${approve ? 'اعتمد' : 'وقّع'} <strong>${esc(USER.name)}</strong> طلب توقيع`, `<strong>${esc(USER.name)}</strong> ${approve ? 'approved' : 'signed'} a signature request`);
    D.renderAll();
    renderActiveView();
    showToast(approve ? tr('تم اعتماد الطلب.', 'Request approved.') : tr('تم توقيع الطلب.', 'Request signed.'));
  }

  function archiveDocument(doc) {
    if (!doc) return;
    doc.status = 'archived';
    if (!platform().cold.some((item) => item.fromDoc === doc.id)) {
      platform().cold.unshift({
        id: `cold-${Date.now().toString(36)}`,
        title: doc.title,
        category: doc.category,
        owner: doc.owner,
        date: '2026-10-20',
        size: doc.meta.replace(/^[^·]+·\s*/, ''),
        retention: L('7 سنوات', '7 years'),
        last: L('الآن', 'Now'),
        fromDoc: doc.id,
      });
    }
    logActivity('archive', `نقل <strong>${esc(USER.name)}</strong> مستنداً إلى الأرشيف البارد`, `<strong>${esc(USER.name)}</strong> moved a document to the cold archive`);
    D.renderAll();
    closeModal();
    if (state.doc) D.closeDrawer();
    renderActiveView();
    showToast(tr('تم نقل المستند إلى الأرشيف البارد.', 'Document moved to the cold archive.'));
  }

  function restoreDocument(doc) {
    if (!doc) return;
    doc.status = 'approved';
    platform().cold = platform().cold.filter((item) => item.fromDoc !== doc.id);
    logActivity('upload', `استعاد <strong>${esc(USER.name)}</strong> مستنداً من الأرشيف البارد`, `<strong>${esc(USER.name)}</strong> restored a document from the cold archive`);
    D.renderAll();
    closeModal();
    if (state.doc) D.openDrawer(doc.id);
    renderActiveView();
    showToast(tr('تمت استعادة المستند.', 'Document restored.'));
  }

  function restoreCold(itemId) {
    const item = platform().cold.find((entry) => entry.id === itemId);
    if (!item) return;
    platform().cold = platform().cold.filter((entry) => entry.id !== itemId);
    let doc = item.fromDoc ? D.findDoc(item.fromDoc) : null;
    if (doc) {
      doc.status = 'approved';
    } else {
      doc = {
        id: `restored-${Date.now()}`,
        title: item.title,
        ext: 'pdf',
        meta: `PDF · ${item.size}`,
        category: item.category,
        linkType: 'category',
        linkValue: L('الأرشيف البارد', 'Cold archive'),
        owner: item.owner,
        initials: initialsOf(pick(item.owner)),
        date: '2026-10-20',
        status: 'approved',
      };
      current().docs.unshift(doc);
    }
    logActivity('upload', `استعاد <strong>${esc(USER.name)}</strong> مستنداً من الأرشيف البارد`, `<strong>${esc(USER.name)}</strong> restored a document from the cold archive`);
    D.renderAll();
    renderColdArchive();
    showToast(tr('تمت استعادة المستند إلى المكتبة.', 'Document restored to the library.'));
  }

  function startScan() {
    const progress = $('#scanProgress');
    const status = $('#scanStatus');
    if (!progress || !status) return;
    const steps = [
      [12, tr('تهيئة الماسح…', 'Initializing scanner…')],
      [34, tr('التقاط الصفحة 1 من 2…', 'Capturing page 1 of 2…')],
      [58, tr('التقاط الصفحة 2 من 2…', 'Capturing page 2 of 2…')],
      [78, tr('تشغيل OCR عربي + إنجليزي…', 'Running Arabic + English OCR…')],
      [94, tr('استخراج الحقول والتحقق…', 'Extracting fields and validating…')],
      [100, tr('اكتمل المسح', 'Scan complete')],
    ];
    steps.forEach(([value, label], index) => {
      setTimeout(() => {
        progress.style.width = `${value}%`;
        status.textContent = label;
        if (value === 100) {
          setTimeout(() => {
            D.addUploadedRow('SCAN-2026-1021.pdf');
            logActivity('scan', `أضاف <strong>${esc(USER.name)}</strong> مستنداً عبر المسح الضوئي`, `<strong>${esc(USER.name)}</strong> added a document via scanner`);
            closeModal();
            renderActiveView();
            showToast(tr('تم إنشاء المستند من المسح الضوئي.', 'Document created from the scan.'));
          }, 350);
        }
      }, 420 + index * 620);
    });
  }

  function setSector(sector) {
    if (sector !== 'edu' && sector !== 'corp') return;
    if (state.sector === sector) {
      closeModal();
      return;
    }
    state.sector = sector;
    localStorage.setItem('archifex-sector', sector);
    ui.page.documents = 1;
    ui.docQuery = '';
    ui.docCat = 'all';
    ui.docStatus = 'all';
    ui.searchQuery = '';
    ui.entityQuery = '';
    ui.coldQuery = '';
    D.renderAll();
    applyUserIdentity();
    syncNotificationUI();
    updateDashboardPager();
    closeModal();
    if (ui.view !== 'dashboard') renderActiveView();
    showToast(sector === 'edu' ? tr('تم التبديل إلى البيئة التعليمية.', 'Switched to the education environment.') : tr('تم التبديل إلى البيئة المؤسسية.', 'Switched to the enterprise environment.'));
  }

  function logout() {
    try {
      sessionStorage.removeItem('archifex-session-v1');
      localStorage.removeItem('archifex-session-v1');
    } catch (e) {}
    location.replace('/login/?loggedout=1');
  }

  function updateDashboardPager() {
    const total = Math.max(1, Math.ceil(current().docs.length / PAGE_SIZE));
    ui.page.documents = Math.min(Math.max(1, ui.page.documents), total);
    const pager = $('#pagerNum');
    if (pager) pager.textContent = `${ui.page.documents} / ${total}`;
    const prev = $('#prevPageBtn');
    const next = $('#nextPageBtn');
    if (prev) prev.disabled = ui.page.documents <= 1;
    if (next) next.disabled = ui.page.documents >= total;
  }

  function saveSettingsForm(form) {
    const data = new FormData(form);
    const sector = String(data.get('sector') || state.sector);
    const theme = String(data.get('theme') || state.theme);
    const lang = String(data.get('lang') || state.lang);
    const next = saveSettings({
      orgName: String(data.get('orgName') || '').trim() || pick(current().workspace),
      orgEmail: String(data.get('orgEmail') || '').trim() || USER.email,
      sector,
      timezone: String(data.get('timezone') || 'Asia/Riyadh'),
      theme,
      lang,
      sessionTimeout: String(data.get('sessionTimeout') || '30'),
      notifEmail: Boolean(form.elements.notifEmail?.checked),
      notifWeekly: Boolean(form.elements.notifWeekly?.checked),
      notifSign: Boolean(form.elements.notifSign?.checked),
      twofa: Boolean(form.elements.twofa?.checked),
      watermark: Boolean(form.elements.watermark?.checked),
    });
    USER.organization = next.orgName;
    patchSessionOrganization(next.orgName);
    if (sector !== state.sector) {
      state.sector = sector;
      localStorage.setItem('archifex-sector', sector);
      ui.page.documents = 1;
      D.renderAll();
    }
    D.applyTheme(theme);
    if (lang !== state.lang) D.setLanguage(lang);
    applyUserIdentity();
    updateDashboardPager();
    syncNotificationUI();
    if (ui.view === 'settings') renderSettings();
    else renderActiveView();
    showToast(tr('تم حفظ الإعدادات.', 'Settings saved.'));
  }

  function changeUserRole(memberId, role) {
    const member = platform().team.find((entry) => entry.id === memberId);
    if (!member) return;
    member.role = role;
    logActivity('user', `غيّر <strong>${esc(USER.name)}</strong> دور مستخدم إلى ${esc(roleLabel(role))}`, `<strong>${esc(USER.name)}</strong> changed a user role to ${esc(roleLabel(role))}`);
    renderUsers();
    showToast(tr('تم تحديث دور المستخدم.', 'User role updated.'));
  }

  function toggleUser(memberId) {
    const member = platform().team.find((entry) => entry.id === memberId);
    if (!member) return;
    if (member.email === USER.email) {
      showToast(tr('لا يمكنك إيقاف حسابك الحالي.', 'You cannot suspend your own account.'));
      return;
    }
    member.status = member.status === 'active' ? 'inactive' : 'active';
    logActivity('user', `غيّر <strong>${esc(USER.name)}</strong> حالة مستخدم`, `<strong>${esc(USER.name)}</strong> changed a user status`);
    renderUsers();
    showToast(tr('تم تحديث حالة المستخدم.', 'User status updated.'));
  }

  function setNotificationRead(id, read) {
    const item = platform().notifications.find((entry) => String(entry.id) === String(id));
    if (!item) return;
    item.read = read;
    syncNotificationUI();
  }

  function toggleNotification(id) {
    const item = platform().notifications.find((entry) => String(entry.id) === String(id));
    if (!item) return;
    item.read = !item.read;
    syncNotificationUI();
    if (ui.view === 'notifications') renderNotifications();
  }

  function runAIAnswer(query) {
    const q = String(query || '').trim();
    if (!q) {
      showToast(tr('اكتب سؤالاً أولاً.', 'Type a question first.'));
      return;
    }
    const results = searchDocs(q).slice(0, 3);
    let answer;
    if (/إشعار|notice|sla/i.test(q)) {
      answer = pick(current().ai.answer);
    } else if (results.length) {
      const excerpt = pick(current().drawer.ocr)
        .replace(/\[\[|\]\]/g, '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 5)
        .join(' · ');
      answer = `${tr('وجدت', 'I found')} <mark>${results.length}</mark> ${tr('مستندات مرتبطة بسؤالك. أفضل تطابق:', 'documents related to your question. Best match:')} <strong>${esc(pick(results[0].doc.title))}</strong>.<br><br>${esc(excerpt)}`;
    } else {
      answer = tr(
        'لم أجد تطابقاً مباشراً في النصوص المفهرسة. جرّب اسماً أو تصنيفاً أو رقماً مرجعياً، أو استخدم البحث الدلالي لعرض كل النتائج.',
        'I could not find a direct match in indexed text. Try a name, category or reference number, or use semantic search to see all results.'
      );
    }
    const answerEl = $('#aiAnswerText');
    if (answerEl) answerEl.innerHTML = answer;
    const sourcesEl = $('#aiSources');
    if (sourcesEl) {
      const sources = results.length ? results.map((result) => result.doc.title) : current().ai.sources;
      sourcesEl.innerHTML = sources
        .map((source) => `<span class="ai-source"><svg class="ic"><use href="#i-file"/></svg>${esc(pick(source))}</span>`)
        .join('');
    }
    const confidence = $('.ai-confidence');
    if (confidence) confidence.textContent = results.length ? `${Math.min(99, 82 + results.length * 4)}%` : '74%';
    logActivity('ai', `طرح <strong>${esc(USER.name)}</strong> سؤالاً على مساعد الأرشيف`, `<strong>${esc(USER.name)}</strong> asked the archive assistant a question`);
    showToast(results.length ? tr(`تم توليد إجابة من ${results.length} مستندات.`, `Answer generated from ${results.length} documents.`) : tr('تم توليد إجابة من الفهرس.', 'Answer generated from the index.'));
  }

  function executeSearch(value) {
    ui.searchQuery = String(value || '').trim();
    if (ui.view === 'search') renderSearch();
    else setView('search');
  }

  function upgradePlan(planId) {
    if (!['starter', 'pro', 'enterprise'].includes(planId)) return;
    saveSettings({ plan: planId });
    closeModal();
    if (ui.view === 'settings') renderSettings();
    showToast(tr('تم تحديث الخطة التجريبية.', 'Demo plan updated.'));
  }

  /* ---------------------------------------------------------------------
     Actions dispatcher
     --------------------------------------------------------------------- */
  function handleAction(element, event) {
    const action = element.dataset.action;
    if (!action) return;
    event.preventDefault();

    switch (action) {
      case 'upload':
        D.openUpload();
        break;
      case 'scan':
        openScanModal();
        break;
      case 'scan-start':
        startScan();
        break;
      case 'close-modal':
        closeModal();
        break;
      case 'export-docs':
        exportDocs(current().docs);
        break;
      case 'page': {
        const dir = Number(element.dataset.dir || 0);
        ui.page.documents = Math.max(1, ui.page.documents + dir);
        renderDocuments();
        break;
      }
      case 'search-chip':
        executeSearch(element.dataset.q || '');
        break;
      case 'search-clear':
        ui.searchQuery = '';
        renderSearch();
        break;
      case 'open-doc':
        if (element.dataset.id) {
          closeModal();
          D.openDrawer(element.dataset.id);
        }
        break;
      case 'doc-menu':
        openDocMenu(D.findDoc(element.dataset.id));
        break;
      case 'doc-download':
        downloadDoc(D.findDoc(element.dataset.id));
        break;
      case 'doc-share':
        shareDoc(D.findDoc(element.dataset.id));
        break;
      case 'doc-sign':
        signDocument(D.findDoc(element.dataset.id));
        break;
      case 'doc-archive':
        archiveDocument(D.findDoc(element.dataset.id));
        break;
      case 'doc-restore':
        restoreDocument(D.findDoc(element.dataset.id));
        break;
      case 'copy-share': {
        const input = $('#shareLinkInput');
        if (input) copyText(input.value, input);
        break;
      }
      case 'wf-sign':
        signWorkflow(element.dataset.id, false);
        break;
      case 'wf-approve':
        signWorkflow(element.dataset.id, true);
        break;
      case 'cat-view':
        ui.docCat = element.dataset.cat || 'all';
        ui.docStatus = 'all';
        ui.docQuery = '';
        ui.page.documents = 1;
        setView('documents');
        break;
      case 'add-category':
        openAddCategoryModal();
        break;
      case 'open-documents':
        ui.docQuery = '';
        ui.docCat = 'all';
        ui.docStatus = 'all';
        ui.page.documents = 1;
        setView('documents');
        break;
      case 'add-entity':
        openAddEntityModal();
        break;
      case 'entity-docs':
        ui.docQuery = element.dataset.value || '';
        ui.docCat = 'all';
        ui.docStatus = 'all';
        ui.page.documents = 1;
        setView('documents');
        break;
      case 'add-project':
        openAddProjectModal();
        break;
      case 'project-docs':
        ui.docQuery = element.dataset.value || '';
        ui.docCat = 'all';
        ui.docStatus = 'all';
        ui.page.documents = 1;
        setView('documents');
        break;
      case 'cold-restore':
        restoreCold(element.dataset.id);
        break;
      case 'open-settings':
        setView('settings');
        break;
      case 'add-user':
        openAddUserModal();
        break;
      case 'user-toggle':
        toggleUser(element.dataset.id);
        break;
      case 'open-audit':
        setView('audit');
        break;
      case 'verify-audit':
        openVerifyAuditModal();
        break;
      case 'export-audit':
        exportAudit();
        break;
      case 'open-upgrade':
        openUpgradeModal();
        break;
      case 'upgrade-plan':
        upgradePlan(element.dataset.plan);
        break;
      case 'workspace-switch':
        setSector(element.dataset.sector);
        break;
      case 'logout':
        logout();
        break;
      case 'mark-all-read':
        markAllNotificationsRead();
        if (ui.view === 'notifications') renderNotifications();
        showToast(tr('تم تحديد كل الإشعارات كمقروءة.', 'All notifications marked as read.'));
        break;
      case 'notif-toggle':
        toggleNotification(element.dataset.id);
        break;
      case 'notif-filter':
        ui.notifUnreadOnly = !ui.notifUnreadOnly;
        renderNotifications();
        break;
      default:
        break;
    }
  }

  function handlePaletteItem(button) {
    if (!button) return false;
    const icon = button.querySelector('use')?.getAttribute('href') || '';
    const label = button.querySelector('strong')?.textContent?.trim() || '';

    if (icon === '#i-scan') {
      closePalette();
      openScanModal();
      return true;
    }
    if (icon === '#i-folder') {
      closePalette();
      openAddCategoryModal();
      return true;
    }
    if (icon === '#i-users') {
      closePalette();
      openAddUserModal();
      return true;
    }
    if (icon === '#i-tag') {
      closePalette();
      const cat = categoryList().find((entry) => catLabel(entry.key, entry) === label);
      if (cat) {
        ui.docCat = cat.key;
        ui.docStatus = 'all';
        ui.docQuery = '';
        ui.page.documents = 1;
      }
      setView('documents');
      return true;
    }
    return false;
  }

  function restoreFieldFocus(id, value) {
    requestAnimationFrame(() => {
      const field = document.getElementById(id);
      if (!field) return;
      field.focus({ preventScroll: true });
      if (typeof field.setSelectionRange === 'function') {
        field.setSelectionRange(value.length, value.length);
      }
    });
  }

  /* ---------------------------------------------------------------------
     Event wiring
     --------------------------------------------------------------------- */
  function bindEvents() {
    $$('.nav-item').forEach((item) => {
      item.addEventListener('click', (event) => {
        const view = item.dataset.view;
        if (!view) return;
        event.preventDefault();
        setView(view);
      });
    });

    // Profile menu
    const profileBtn = $('#profileBtn');
    const profileMenu = $('#profileMenu');
    profileBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = profileMenu.hidden;
      profileMenu.hidden = !willOpen;
      profileBtn.setAttribute('aria-expanded', String(willOpen));
    });
    profileMenu?.addEventListener('click', (event) => event.stopPropagation());
    $('#profileSettings')?.addEventListener('click', () => {
      closeProfileMenu();
      setView('settings');
    });
    $('#profileTheme')?.addEventListener('click', () => {
      closeProfileMenu();
      D.applyTheme(state.theme === 'dark' ? 'light' : 'dark');
      saveSettings({ theme: state.theme });
      const themeField = $('#settingsForm select[name="theme"]');
      if (themeField) themeField.value = state.theme;
      showToast(state.theme === 'dark' ? tr('تم تفعيل المظهر الداكن.', 'Dark theme enabled.') : tr('تم تفعيل المظهر الفاتح.', 'Light theme enabled.'));
    });
    $('#profileLogout')?.addEventListener('click', logout);
    $('#logoutBtn')?.addEventListener('click', logout);

    // Topbar and dashboard actions
    $('#workspaceBtn')?.addEventListener('click', openWorkspaceModal);
    $('#upgradeBtn')?.addEventListener('click', openUpgradeModal);
    $('#scanBtn')?.addEventListener('click', openScanModal);
    $('#tableFilterBtn')?.addEventListener('click', openFilterModal);
    $('#tableExportBtn')?.addEventListener('click', () => exportDocs(current().docs));
    $('#openSigningBtn')?.addEventListener('click', () => setView('workflows'));
    $('#openAuditBtn')?.addEventListener('click', () => setView('audit'));
    $('#auditLink')?.addEventListener('click', () => setView('audit'));
    $('#helpLink')?.addEventListener('click', (event) => {
      event.preventDefault();
      openHelpModal();
    });
    $('#privacyLink')?.addEventListener('click', (event) => {
      event.preventDefault();
      openPrivacyModal();
    });

    // Dashboard pager jumps into the full library
    const goToLibraryPage = (dir) => {
      const total = Math.max(1, Math.ceil(current().docs.length / PAGE_SIZE));
      ui.page.documents = Math.min(total, Math.max(1, ui.page.documents + dir));
      setView('documents');
    };
    $('#prevPageBtn')?.addEventListener('click', () => goToLibraryPage(-1));
    $('#nextPageBtn')?.addEventListener('click', () => goToLibraryPage(1));

    // Notifications
    $('#markRead')?.addEventListener('click', markAllNotificationsRead);
    $('#allNotificationsBtn')?.addEventListener('click', () => {
      $('#notifMenu').hidden = true;
      $('#bellBtn')?.setAttribute('aria-expanded', 'false');
      setView('notifications');
    });
    $('#notifMenu')?.addEventListener('click', (event) => {
      const item = event.target.closest('.notif-item[data-notif]');
      if (!item) return;
      setNotificationRead(item.dataset.notif, true);
      item.classList.remove('is-unread');
      showToast(tr('تم تعليم الإشعار كمقروء.', 'Notification marked as read.'));
    });

    // AI answers
    $('#aiOpenSearch')?.addEventListener('click', (event) => {
      event.preventDefault();
      setView('search');
    });

    // Drawer actions
    $('#drawerDownloadBtn')?.addEventListener('click', () => downloadDoc(state.doc));
    $('#drawerMoreBtn')?.addEventListener('click', () => openDocMenu(state.doc));
    $('#drawerShareBtn')?.addEventListener('click', () => shareDoc(state.doc));
    $('#drawerSignBtn')?.addEventListener('click', () => signDocument(state.doc));

    // Modal close
    $('#appModalClose')?.addEventListener('click', closeModal);
    $('#appModal')?.addEventListener('click', (event) => {
      if (event.target.matches('[data-app-close="modal"]')) closeModal();
    });

    // Language / theme / sector keep the platform views in sync
    $('#langToggle')?.addEventListener('click', () => {
      setTimeout(() => {
        saveSettings({ lang: state.lang });
        applyUserIdentity();
        updateDashboardPager();
        if (ui.view !== 'dashboard') renderActiveView();
      }, 0);
    });
    $('#themeToggle')?.addEventListener('click', () => {
      setTimeout(() => {
        saveSettings({ theme: state.theme });
        const themeField = $('#settingsForm select[name="theme"]');
        if (themeField) themeField.value = state.theme;
      }, 0);
    });
    $$('.seg-btn').forEach((button) => {
      button.addEventListener('click', () => {
        setTimeout(() => {
          applyUserIdentity();
          updateDashboardPager();
          if (ui.view !== 'dashboard') renderActiveView();
        }, 0);
      });
    });

    // Dashboard table: intercept the old "more" toast and open the real menu
    $('#tableBody')?.addEventListener(
      'click',
      (event) => {
        const button = event.target.closest('.row-actions');
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        const row = button.closest('tr[data-doc]');
        const doc = row ? D.findDoc(row.dataset.doc) : null;
        if (doc) openDocMenu(doc);
      },
      true
    );

    // AI suggestion chips: override the demo toast with a real grounded answer
    document.addEventListener(
      'click',
      (event) => {
        const button = event.target.closest('.ai-suggestion');
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        const query = button.textContent.trim();
        const input = $('#aiInput');
        if (input) input.value = query;
        runAIAnswer(query);
      },
      true
    );

    // Command palette actions: scan, folder, invite and categories become real
    document.addEventListener(
      'click',
      (event) => {
        const button = event.target.closest('#paletteList [data-p-item]');
        if (!button) return;
        if (handlePaletteItem(button)) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );

    // AI form and palette Enter (capture before app.js handlers)
    document.addEventListener(
      'submit',
      (event) => {
        if (event.target.id !== 'aiForm') return;
        event.preventDefault();
        event.stopPropagation();
        runAIAnswer($('#aiInput')?.value || '');
      },
      true
    );

    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape' && $('#appModal') && !$('#appModal').hidden) {
          event.preventDefault();
          event.stopPropagation();
          closeModal();
          return;
        }
        if (event.key === 'Enter' && document.activeElement?.id === 'paletteInput' && !$('#palette').hidden) {
          const index = D.state.paletteIndex;
          const button = $(`#paletteList [data-p-item="${index}"]`);
          if (button && handlePaletteItem(button)) {
            event.preventDefault();
            event.stopPropagation();
          }
        }
      },
      true
    );

    // View-level search, filters and forms
    appView()?.addEventListener('input', (event) => {
      if (event.target.id === 'docSearch') {
        ui.docQuery = event.target.value;
        ui.page.documents = 1;
        renderDocuments();
        restoreFieldFocus('docSearch', ui.docQuery);
      } else if (event.target.id === 'entitySearch') {
        ui.entityQuery = event.target.value;
        renderEntities();
        restoreFieldFocus('entitySearch', ui.entityQuery);
      } else if (event.target.id === 'coldSearch') {
        ui.coldQuery = event.target.value;
        renderColdArchive();
        restoreFieldFocus('coldSearch', ui.coldQuery);
      } else if (event.target.id === 'auditSearch') {
        ui.auditQuery = event.target.value;
        renderAuditView();
        restoreFieldFocus('auditSearch', ui.auditQuery);
      }
    });

    appView()?.addEventListener('change', (event) => {
      if (event.target.id === 'docCat') {
        ui.docCat = event.target.value;
        ui.page.documents = 1;
        renderDocuments();
      } else if (event.target.id === 'docStatus') {
        ui.docStatus = event.target.value;
        ui.page.documents = 1;
        renderDocuments();
      } else if (event.target.matches('[data-user-role]')) {
        changeUserRole(event.target.dataset.userRole, event.target.value);
      }
    });

    appView()?.addEventListener('submit', (event) => {
      if (event.target.id === 'smartSearchForm') {
        event.preventDefault();
        executeSearch($('#smartSearchInput')?.value || '');
      } else if (event.target.id === 'settingsForm') {
        event.preventDefault();
        saveSettingsForm(event.target);
      }
    });

    // Global action delegation
    document.addEventListener('click', (event) => {
      if (!event.target.closest('#profileMenu') && !event.target.closest('#profileBtn')) {
        closeProfileMenu();
      }
      const actionEl = event.target.closest('[data-action]');
      if (actionEl) {
        handleAction(actionEl, event);
        return;
      }
      const row = event.target.closest('#appView tr[data-doc]');
      if (row && !event.target.closest('button,a,input,select,label')) {
        event.preventDefault();
        D.openDrawer(row.dataset.doc);
      }
    });

    // Refresh the documents view when app.js re-renders the dashboard table
    const tableBody = $('#tableBody');
    if (tableBody) {
      new MutationObserver(() => {
        updateDashboardPager();
        if (ui.view === 'documents') renderDocuments();
      }).observe(tableBody, { childList: true });
    }

    // Browser history and deep links
    window.addEventListener('popstate', () => {
      setView(getHashView(), { initial: true });
    });
    window.addEventListener('hashchange', () => {
      const next = getHashView();
      if (next !== ui.view) setView(next, { initial: true });
    });
  }

  function getHashView() {
    const hash = location.hash.replace(/^#\/?/, '');
    return VIEWS.has(hash) ? hash : 'dashboard';
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  function init() {
    ensurePlatformData(DATA.edu, 'edu');
    ensurePlatformData(DATA.corp, 'corp');

    // Re-render once so the extended library is visible to palette/search.
    D.renderAll();
    applyUserIdentity();
    updateDashboardPager();
    syncNotificationUI();
    bindEvents();

    const initial = getHashView();
    setView(initial, { initial: true });
    if (initial !== 'dashboard') {
      try {
        history.replaceState(null, '', `#${initial}`);
      } catch (e) {}
    }

    const hash = location.hash.replace(/^#\/?/, '');
    if (hash === 'help') openHelpModal();
    else if (hash === 'privacy') openPrivacyModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
