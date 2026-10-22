/* ==========================================================================
   ARCHIFEX — Authentication gate
   Front-end demo accounts only. Passwords are salted + SHA-256 hashed and
   stored in this browser's localStorage; nothing is sent to a server.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const html = document.documentElement;

  const USERS_KEY = 'archifex-users-v1';
  const SESSION_KEY = 'archifex-session-v1';
  const DEMO = {
    name: 'سارة العتيبي',
    nameEn: 'Sarah Alotaibi',
    email: 'demo@archifex.sa',
    password: 'Demo@2026',
    organization: 'جامعة النور',
    organizationEn: 'Al-Noor University',
    sector: 'edu',
    role: 'admin',
  };

  const params = new URLSearchParams(location.search);

  const state = {
    lang: ['ar', 'en'].includes(params.get('lang')) ? params.get('lang') : localStorage.getItem('archifex-lang') || 'ar',
    theme: ['dark', 'light'].includes(params.get('theme')) ? params.get('theme') : localStorage.getItem('archifex-theme') || 'dark',
    mode: params.get('mode') === 'register' ? 'register' : 'login',
    busy: false,
  };

  const AUTH_T = {
    ar: {
      'doc.title': 'تسجيل الدخول | Archifex — من شركة مَدار فَلَك',
      'brand.ar': 'أرشيفكس',
      'top.back': 'العودة للموقع',
      'show.kicker': 'منصة أرشفة ذكية · النسخة التجريبية',
      'show.title': 'أرشيفك المؤسسي، يفكّر معك.',
      'show.sub': 'ادخل إلى مساحة عمل تفاعلية كاملة: مستندات، OCR عربي وإنجليزي، بحث دلالي، سير عمل وتوقيع، صلاحيات وسجل مراجعة — ببيانات تجريبية آمنة.',
      'show.b1': 'جميع الأدوات مفعّلة: رفع، بحث، تصنيف، توقيع، تدقيق وإعدادات.',
      'show.b2': 'بيئتان جاهزتان: تعليمية ومؤسسية، مع بيانات تجريبية لكل قطاع.',
      'show.b3': 'حسابك وجلسة الدخول محفوظان محلياً في متصفحك فقط.',
      'show.p1': 'مستند مفهرس',
      'show.p2': 'دقة استخراج',
      'show.p3': 'جدولاً وحوكمة',
      'show.t1': 'عزل بيانات وصلاحيات',
      'show.t2': 'تشفير كلمات المرور محلياً',
      'show.t3': 'مساعد أرشيف ذكي',
      'session.logout': 'خروج',
      'session.continue': 'متابعة',
      'login.title': 'تسجيل الدخول',
      'login.sub': 'أدخل بيانات حسابك للوصول إلى مساحة العمل.',
      'login.remember': 'تذكرني على هذا الجهاز',
      'login.forgot': 'نسيت كلمة المرور؟',
      'login.submit': 'دخول إلى المنصة',
      'login.or': 'أو',
      'login.demo': 'دخول سريع بالحساب التجريبي',
      'tab.login': 'دخول',
      'tab.register': 'إنشاء حساب',
      'register.title': 'أنشئ حسابك التجريبي',
      'register.sub': 'ابدأ مساحة عمل جديدة في ثوانٍ — بدون بريد تأكيد أو بطاقة.',
      'register.terms': 'أوافق على شروط الاستخدام وسياسة الخصوصية (نموذج تجريبي).',
      'register.submit': 'إنشاء الحساب والدخول',
      'field.email': 'البريد الإلكتروني',
      'field.password': 'كلمة المرور',
      'field.confirm': 'تأكيد كلمة المرور',
      'field.name': 'الاسم الكامل',
      'field.org': 'اسم المؤسسة',
      'field.sector': 'نوع المؤسسة',
      'sector.edu': 'تعليمي — جامعة / كلية / مدرسة',
      'sector.corp': 'مؤسسي — شركة / جهة حكومية',
      'note.demo': 'الحساب التجريبي:',
      'note.local': 'نموذج واجهة فقط — الحسابات والجلسات تُحفظ في متصفحك ولا تُرسل إلى خادم.',
      'foot.tagline': 'الأرشيف الذي يفكّر',
      'foot.docs': 'الوثائق',
      'foot.demo': 'النموذج',
      'foot.home': 'الرئيسية',
      'err.required': 'يرجى تعبئة جميع الحقول المطلوبة.',
      'err.email': 'صيغة البريد الإلكتروني غير صحيحة.',
      'err.name': 'أدخل اسماً لا يقل عن حرفين.',
      'err.org': 'أدخل اسم المؤسسة.',
      'err.password.short': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي حرفاً ورقماً.',
      'err.password.match': 'كلمتا المرور غير متطابقتين.',
      'err.terms': 'يجب الموافقة على الشروط للمتابعة.',
      'err.exists': 'يوجد حساب بهذا البريد بالفعل. جرّب تسجيل الدخول.',
      'err.credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      'err.generic': 'حدث خطأ غير متوقع. حاول مرة أخرى.',
      'notice.loggedout': 'تم تسجيل الخروج بنجاح. يمكنك الدخول مرة أخرى.',
      'notice.forgot': 'هذا نموذج تجريبي: استخدم الحساب التجريبي demo@archifex.sa أو أنشئ حساباً جديداً.',
      'notice.created': 'تم إنشاء الحساب. جارٍ فتح مساحة العمل…',
      'notice.switch': 'أنت مسجل الدخول بالفعل. يمكنك المتابعة أو تسجيل الخروج لاستخدام حساب آخر.',
      'submit.loading': 'جارٍ التحقق…',
      'a11y.showpass': 'إظهار كلمة المرور',
      'a11y.hidepass': 'إخفاء كلمة المرور',
      'a11y.theme': 'تبديل المظهر',
      'a11y.lang': 'Switch language to English',
    },
    en: {
      'doc.title': 'Sign in | Archifex — MadarFalak',
      'brand.ar': 'Archifex',
      'top.back': 'Back to site',
      'show.kicker': 'Smart archiving platform · Live demo',
      'show.title': 'Your institutional archive, now thinking with you.',
      'show.sub': 'Enter a complete interactive workspace: documents, Arabic and English OCR, semantic search, workflows and signatures, permissions and audit — with safe demo data.',
      'show.b1': 'Every tool is live: upload, search, classification, signing, audit and settings.',
      'show.b2': 'Two ready environments: education and enterprise, each with demo data.',
      'show.b3': 'Your account and session stay in this browser only.',
      'show.p1': 'indexed documents',
      'show.p2': 'extraction accuracy',
      'show.p3': 'tables & governance',
      'show.t1': 'Data isolation & permissions',
      'show.t2': 'Local password hashing',
      'show.t3': 'AI archive assistant',
      'session.logout': 'Sign out',
      'session.continue': 'Continue',
      'login.title': 'Sign in',
      'login.sub': 'Enter your account details to access the workspace.',
      'login.remember': 'Remember me on this device',
      'login.forgot': 'Forgot your password?',
      'login.submit': 'Sign in to the platform',
      'login.or': 'or',
      'login.demo': 'Quick demo account access',
      'tab.login': 'Sign in',
      'tab.register': 'Create account',
      'register.title': 'Create your demo account',
      'register.sub': 'Start a new workspace in seconds — no verification email or card.',
      'register.terms': 'I agree to the terms and privacy policy (demo prototype).',
      'register.submit': 'Create account & enter',
      'field.email': 'Email address',
      'field.password': 'Password',
      'field.confirm': 'Confirm password',
      'field.name': 'Full name',
      'field.org': 'Organization name',
      'field.sector': 'Organization type',
      'sector.edu': 'Education — university / college / school',
      'sector.corp': 'Enterprise — company / government',
      'note.demo': 'Demo account:',
      'note.local': 'Interface prototype only — accounts and sessions are stored in your browser and never sent to a server.',
      'foot.tagline': 'The archive that thinks',
      'foot.docs': 'Docs',
      'foot.demo': 'Demo',
      'foot.home': 'Home',
      'err.required': 'Please fill in all required fields.',
      'err.email': 'That email address is not valid.',
      'err.name': 'Enter a name with at least two characters.',
      'err.org': 'Enter your organization name.',
      'err.password.short': 'Password must be at least 8 characters and include a letter and a number.',
      'err.password.match': 'The passwords do not match.',
      'err.terms': 'Please accept the terms to continue.',
      'err.exists': 'An account with this email already exists. Try signing in.',
      'err.credentials': 'Incorrect email or password.',
      'err.generic': 'Something went wrong. Please try again.',
      'notice.loggedout': 'You have signed out. You can sign in again below.',
      'notice.forgot': 'This is a demo: use demo@archifex.sa or create a new account.',
      'notice.created': 'Account created. Opening your workspace…',
      'notice.switch': 'You are already signed in. Continue, or sign out to use another account.',
      'submit.loading': 'Checking…',
      'a11y.showpass': 'Show password',
      'a11y.hidepass': 'Hide password',
      'a11y.theme': 'Toggle theme',
      'a11y.lang': 'التبديل إلى العربية',
    },
  };

  const at = (key) => AUTH_T[state.lang][key] ?? AUTH_T.ar[key] ?? key;

  /* ---------------------------------------------------------------------
     Storage helpers
     --------------------------------------------------------------------- */
  function readJSON(store, key) {
    try {
      const raw = store.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeJSON(store, key, value) {
    try {
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getUsers() {
    const users = readJSON(localStorage, USERS_KEY);
    return Array.isArray(users) ? users : [];
  }

  function saveUsers(users) {
    writeJSON(localStorage, USERS_KEY, users);
  }

  function getSession() {
    const raw = readJSON(sessionStorage, SESSION_KEY) || readJSON(localStorage, SESSION_KEY);
    if (!raw || !raw.email) return null;
    if (raw.expiresAt && Date.now() > raw.expiresAt) {
      clearSession();
      return null;
    }
    return raw;
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  function writeSession(user, remember) {
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      organization: user.organization,
      sector: user.sector,
      role: user.role || 'admin',
      initials: initialsOf(user.name),
      createdAt: Date.now(),
      expiresAt: Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000,
    };
    clearSession();
    if (remember) writeJSON(localStorage, SESSION_KEY, session);
    else writeJSON(sessionStorage, SESSION_KEY, session);

    // Restore this account's workspace and display preferences for the prototype.
    try {
      const prefs = readJSON(localStorage, `archifex-settings-v1:${user.email}`) || {};
      localStorage.setItem('archifex-sector', user.sector || prefs.sector || 'edu');
      if (prefs.theme === 'dark' || prefs.theme === 'light') {
        localStorage.setItem('archifex-theme', prefs.theme);
      }
      if (prefs.lang === 'ar' || prefs.lang === 'en') {
        localStorage.setItem('archifex-lang', prefs.lang);
      }
    } catch (e) {}

    return session;
  }

  function initialsOf(name) {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return 'AF';
    return parts.slice(0, 2).map((p) => Array.from(p)[0]).join('').toUpperCase();
  }

  /* ---------------------------------------------------------------------
     Hashing
     --------------------------------------------------------------------- */
  function randomSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function hashPassword(password, salt) {
    if (!crypto.subtle) {
      // Very old/insecure contexts only. Demo fallback, not production security.
      let h = 2166136261;
      for (const ch of `${salt}:${password}`) {
        h ^= ch.charCodeAt(0);
        h = Math.imul(h, 16777619);
      }
      return `fallback-${(h >>> 0).toString(16)}`;
    }
    const data = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function ensureDemoUser() {
    const users = getUsers();
    if (users.some((u) => u.email === DEMO.email)) return users;
    const salt = randomSalt();
    const hash = await hashPassword(DEMO.password, salt);
    users.push({
      id: `usr_demo`,
      name: state.lang === 'en' ? DEMO.nameEn : DEMO.name,
      email: DEMO.email,
      organization: state.lang === 'en' ? DEMO.organizationEn : DEMO.organization,
      sector: DEMO.sector,
      role: DEMO.role,
      salt,
      hash,
      createdAt: Date.now(),
      demo: true,
    });
    saveUsers(users);
    return users;
  }

  /* ---------------------------------------------------------------------
     Navigation helpers
     --------------------------------------------------------------------- */
  function safeNext() {
    const next = params.get('next') || '';
    if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/login')) {
      return '/prototype/';
    }
    return next;
  }

  function goNext() {
    location.replace(safeNext());
  }

  /* ---------------------------------------------------------------------
     UI
     --------------------------------------------------------------------- */
  function applyTheme(theme) {
    state.theme = theme;
    html.dataset.theme = theme;
    localStorage.setItem('archifex-theme', theme);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#E2E8F0' : '#0F172A');
    $('#themeBtn')?.setAttribute('aria-label', at('a11y.theme'));
  }

  function applyI18n() {
    html.lang = state.lang;
    html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    document.title = at('doc.title');
    $('#langLabel').textContent = state.lang === 'ar' ? 'EN' : 'ع';
    $('#langBtn').setAttribute('aria-label', at('a11y.lang'));

    $$('[data-auth-i18n]').forEach((el) => {
      const key = el.dataset.authI18n;
      const value = at(key);
      if (value !== key) el.textContent = value;
    });

    $$('[data-eye]').forEach((btn) => {
      const input = document.getElementById(btn.dataset.eye);
      const visible = input?.type === 'text';
      btn.setAttribute('aria-label', at(visible ? 'a11y.hidepass' : 'a11y.showpass'));
    });

    const session = getSession();
    if (session) {
      $('#sessionAvatar').textContent = session.initials || initialsOf(session.name);
      $('#sessionName').textContent = session.name;
      $('#sessionEmail').textContent = session.email;
      $('#sessionContinue').textContent = at('session.continue');
    }

    syncModeCopy();
  }

  function syncModeCopy() {
    const isLogin = state.mode === 'login';
    if (isLogin) {
      $('#authTitle').textContent = at('login.title');
      $('#authSubtitle').textContent = at('login.sub');
    } else {
      $('#authTitle').textContent = at('register.title');
      $('#authSubtitle').textContent = at('register.sub');
    }
  }

  function setMode(mode) {
    state.mode = mode;
    const isLogin = mode === 'login';
    $('#loginForm').hidden = !isLogin;
    $('#registerForm').hidden = isLogin;
    $('#tabLogin').classList.toggle('is-active', isLogin);
    $('#tabRegister').classList.toggle('is-active', !isLogin);
    $('#tabLogin').setAttribute('aria-selected', String(isLogin));
    $('#tabRegister').setAttribute('aria-selected', String(!isLogin));
    syncModeCopy();
    hideError('login');
    hideError('register');
    const url = new URL(location.href);
    if (isLogin) url.searchParams.delete('mode');
    else url.searchParams.set('mode', 'register');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }

  function showError(which, message) {
    const box = which === 'login' ? $('#loginError') : $('#registerError');
    const text = which === 'login' ? $('#loginErrorText') : $('#registerErrorText');
    text.textContent = message;
    box.hidden = false;
  }

  function hideError(which) {
    const box = which === 'login' ? $('#loginError') : $('#registerError');
    box.hidden = true;
  }

  function showNotice(message) {
    $('#authNoticeText').textContent = message;
    $('#authNotice').hidden = false;
  }

  function hideNotice() {
    $('#authNotice').hidden = true;
  }

  function setBusy(which, busy) {
    const btn = which === 'login' ? $('#loginSubmit') : $('#registerSubmit');
    const label = $('span', btn);
    if (!btn.dataset.label) btn.dataset.label = label.textContent;
    btn.classList.toggle('is-loading', busy);
    btn.disabled = busy;
    label.textContent = busy ? at('submit.loading') : at(which === 'login' ? 'login.submit' : 'register.submit');
  }

  function togglePassword(btn) {
    const input = document.getElementById(btn.dataset.eye);
    if (!input) return;
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    btn.querySelector('use')?.setAttribute('href', visible ? '#i-eye-off' : '#i-eye');
    btn.setAttribute('aria-label', at(visible ? 'a11y.hidepass' : 'a11y.showpass'));
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function strongEnough(password) {
    return password.length >= 8 && /[A-Za-z\u0600-\u06FF]/.test(password) && /\d/.test(password);
  }

  /* ---------------------------------------------------------------------
     Auth actions
     --------------------------------------------------------------------- */
  async function handleLogin(event) {
    event.preventDefault();
    if (state.busy) return;
    hideError('login');
    hideNotice();

    const email = $('#loginEmail').value.trim().toLowerCase();
    const password = $('#loginPassword').value;
    const remember = $('#rememberMe').checked;

    if (!email || !password) {
      showError('login', at('err.required'));
      return;
    }
    if (!validEmail(email)) {
      showError('login', at('err.email'));
      return;
    }

    state.busy = true;
    setBusy('login', true);
    try {
      const users = await ensureDemoUser();
      const user = users.find((u) => u.email === email);
      if (!user) {
        showError('login', at('err.credentials'));
        return;
      }
      const hash = await hashPassword(password, user.salt);
      if (hash !== user.hash) {
        showError('login', at('err.credentials'));
        return;
      }
      writeSession(user, remember);
      goNext();
    } catch (error) {
      console.error(error);
      showError('login', at('err.generic'));
    } finally {
      state.busy = false;
      setBusy('login', false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    if (state.busy) return;
    hideError('register');
    hideNotice();

    const name = $('#regName').value.trim();
    const organization = $('#regOrg').value.trim();
    const email = $('#regEmail').value.trim().toLowerCase();
    const sector = $('#regSector').value === 'corp' ? 'corp' : 'edu';
    const password = $('#regPassword').value;
    const confirm = $('#regConfirm').value;
    const terms = $('#regTerms').checked;

    if (!name || !organization || !email || !password || !confirm) {
      showError('register', at('err.required'));
      return;
    }
    if (name.length < 2) {
      showError('register', at('err.name'));
      return;
    }
    if (organization.length < 2) {
      showError('register', at('err.org'));
      return;
    }
    if (!validEmail(email)) {
      showError('register', at('err.email'));
      return;
    }
    if (!strongEnough(password)) {
      showError('register', at('err.password.short'));
      return;
    }
    if (password !== confirm) {
      showError('register', at('err.password.match'));
      return;
    }
    if (!terms) {
      showError('register', at('err.terms'));
      return;
    }

    state.busy = true;
    setBusy('register', true);
    try {
      const users = await ensureDemoUser();
      if (users.some((u) => u.email === email)) {
        showError('register', at('err.exists'));
        return;
      }
      const salt = randomSalt();
      const hash = await hashPassword(password, salt);
      const user = {
        id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        name,
        email,
        organization,
        sector,
        role: 'admin',
        salt,
        hash,
        createdAt: Date.now(),
      };
      users.push(user);
      saveUsers(users);
      writeSession(user, true);
      localStorage.setItem('archifex-sector', sector);
      showNotice(at('notice.created'));
      setTimeout(goNext, 650);
    } catch (error) {
      console.error(error);
      showError('register', at('err.generic'));
    } finally {
      state.busy = false;
      setBusy('register', false);
    }
  }

  async function quickDemo() {
    if (state.busy) return;
    hideError('login');
    hideNotice();
    $('#loginEmail').value = DEMO.email;
    $('#loginPassword').value = DEMO.password;
    $('#rememberMe').checked = true;
    await ensureDemoUser();
    $('#loginForm').requestSubmit();
  }

  /* ---------------------------------------------------------------------
     Init
     --------------------------------------------------------------------- */
  function init() {
    applyTheme(state.theme);
    applyI18n();
    setMode(state.mode);

    // Deep-link state
    if (params.get('logout') === '1' || params.get('loggedout') === '1') {
      clearSession();
      showNotice(at('notice.loggedout'));
      const url = new URL(location.href);
      url.searchParams.delete('logout');
      url.searchParams.delete('loggedout');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }

    const existing = getSession();
    const switching = params.get('switch') === '1' || params.get('mode') === 'register';
    if (existing) {
      if (!switching) {
        goNext();
        return;
      }
      $('#sessionBanner').hidden = false;
      $('#sessionContinue').href = safeNext();
      showNotice(at('notice.switch'));
    }

    // Theme / language
    $('#themeBtn').addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));
    $('#langBtn').addEventListener('click', () => {
      state.lang = state.lang === 'ar' ? 'en' : 'ar';
      localStorage.setItem('archifex-lang', state.lang);
      applyI18n();
    });

    // Tabs
    $('#tabLogin').addEventListener('click', () => setMode('login'));
    $('#tabRegister').addEventListener('click', () => setMode('register'));

    // Password eyes
    $$('[data-eye]').forEach((btn) => btn.addEventListener('click', () => togglePassword(btn)));

    // Forms
    $('#loginForm').addEventListener('submit', handleLogin);
    $('#registerForm').addEventListener('submit', handleRegister);
    $('#demoBtn').addEventListener('click', quickDemo);

    // Clear errors on edit
    $$('#loginForm input').forEach((el) => el.addEventListener('input', () => hideError('login')));
    $$('#registerForm input, #registerForm select').forEach((el) =>
      el.addEventListener('input', () => hideError('register'))
    );

    // Forgot password
    $('#forgotBtn').addEventListener('click', () => {
      $('#loginEmail').value = DEMO.email;
      showNotice(at('notice.forgot'));
      $('#loginPassword').focus();
    });

    // Session banner
    $('#sessionLogout').addEventListener('click', () => {
      clearSession();
      $('#sessionBanner').hidden = true;
      hideNotice();
      showNotice(at('notice.loggedout'));
    });

    // Seed the demo account in the background so quick access is instant.
    ensureDemoUser().catch((error) => console.error(error));

    // Autofocus the most useful field
    setTimeout(() => {
      const target = state.mode === 'login' ? $('#loginEmail') : $('#regName');
      target?.focus({ preventScroll: true });
    }, 120);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
