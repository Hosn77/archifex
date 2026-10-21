/* ==========================================================================
   ARCHIFEX — Documentation reader
   Fetches the Markdown source, renders it, builds a TOC, and enhances diagrams
   ========================================================================== */

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const html = document.documentElement;

  const DOCS = [
    {
      id: '01-architecture',
      slug: 'architecture',
      file: '01-architecture.md',
      href: '/docs/architecture',
      kicker: 'DOC / 01 · ARCHITECTURE',
      title: 'المعمارية والنظام',
      short: 'المعمارية',
      desc: 'كيف يُبنى أرشيفكس: المكوّنات، الخط الأنبوبي، البيانات، الأمان، والتشغيل.',
    },
    {
      id: '02-database-schema',
      slug: 'database',
      file: '02-database-schema.md',
      href: '/docs/database',
      kicker: 'DOC / 02 · DATABASE',
      title: 'قاعدة البيانات',
      short: 'قاعدة البيانات',
      desc: 'تصميم قاعدة البيانات: الجداول، العلاقات، RLS، الفهارس العربية، والاحتفاظ.',
    },
    {
      id: '03-ui-brand-wireframe',
      slug: 'brand',
      file: '03-ui-brand-wireframe.md',
      href: '/docs/brand',
      kicker: 'DOC / 03 · BRAND & UI',
      title: 'الهوية والواجهة',
      short: 'الهوية والواجهة',
      desc: 'نظام العلامة والتصميم: التسمية، الشعار، الألوان، المخططات، والمكوّنات.',
    },
    {
      id: '04-mvp-roadmap',
      slug: 'roadmap',
      file: '04-mvp-roadmap.md',
      href: '/docs/roadmap',
      kicker: 'DOC / 04 · ROADMAP',
      title: 'خارطة MVP',
      short: 'خارطة MVP',
      desc: 'خطة التنفيذ: المراحل، الفريق، الميزانية، التسعير، ومؤشرات النجاح.',
    },
  ];

  const state = {
    doc: DOCS[0],
    headings: [],
    tocLinks: [],
    ticking: false,
    mermaidBusy: false,
    mermaidAgain: false,
  };

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

  function resolveDoc() {
    const params = new URLSearchParams(location.search);
    const query = params.get('doc');
    if (query) {
      const byQuery = DOCS.find((d) => d.id === query || d.slug === query);
      if (byQuery) return byQuery;
    }
    let path = '';
    try { path = decodeURIComponent(location.pathname); } catch (e) { path = location.pathname; }
    const slug = path.replace(/\/+$/, '').split('/').pop();
    return DOCS.find((d) => d.slug === slug || d.id === slug) || DOCS[0];
  }

  function setMeta(doc) {
    const title = `${doc.title} — وثائق أرشيفكس`;
    document.title = title;
    const setAttr = (selector, attr, value) => {
      const el = $(selector);
      if (el) el.setAttribute(attr, value);
    };
    setAttr('meta[name="description"]', 'content', doc.desc);
    setAttr('link[rel="canonical"]', 'href', `https://archifex.netlify.app${doc.href}`);
    setAttr('meta[property="og:title"]', 'content', title);
    setAttr('meta[property="og:description"]', 'content', doc.desc);
    setAttr('meta[property="og:url"]', 'content', `https://archifex.netlify.app${doc.href}`);
    setAttr('meta[name="twitter:title"]', 'content', title);
    setAttr('meta[name="twitter:description"]', 'content', doc.desc);

    $('#docKicker').textContent = doc.kicker;
    $('#docTitle').textContent = doc.title;
    $('#docDesc').textContent = doc.desc;
    $('#crumbTitle').textContent = doc.title;
    const raw = $('#rawLink');
    if (raw) raw.href = `/docs/${doc.file}`;

    $$('[data-doc]').forEach((a) => {
      const active = a.dataset.doc === doc.id;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function renderPager(doc) {
    const pager = $('#docPager');
    if (!pager) return;
    const index = DOCS.findIndex((d) => d.id === doc.id);
    const prev = DOCS[index - 1];
    const next = DOCS[index + 1];
    const link = (target, dir) => {
      const label = dir === 'prev' ? 'السابق' : 'التالي';
      if (!target) {
        return `<span class="pager-link pager-link--${dir}" aria-disabled="true"><small>${label}</small><strong>—</strong></span>`;
      }
      return `<a class="pager-link pager-link--${dir}" href="${target.href}"><small>${label}</small><strong>${escapeHtml(target.short)}</strong></a>`;
    };
    pager.innerHTML = `${link(prev, 'prev')}${link(next, 'next')}`;
  }

  function wrapTables(article) {
    $$('table', article).forEach((table) => {
      if (table.parentElement && table.parentElement.classList.contains('table-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  function transformMermaid(article) {
    $$('pre code.language-mermaid', article).forEach((code) => {
      const pre = code.closest('pre');
      const diagram = document.createElement('div');
      diagram.className = 'mermaid';
      diagram.dataset.src = code.textContent;
      diagram.textContent = code.textContent;
      pre.replaceWith(diagram);
    });
  }

  function enhanceCode(article) {
    $$('pre', article).forEach((pre) => {
      if (pre.closest('.mermaid')) return;
      const code = pre.querySelector('code');
      if (!code) return;
      const langClass = Array.from(code.classList).find((c) => c.startsWith('language-'));
      const lang = langClass ? langClass.replace('language-', '') : '';
      if (lang) {
        const label = document.createElement('span');
        label.className = 'code-lang';
        label.textContent = lang;
        pre.appendChild(label);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-code';
      btn.textContent = 'نسخ';
      btn.setAttribute('aria-label', 'نسخ الكود');
      btn.addEventListener('click', async () => {
        try {
          await copyText(code.textContent);
          toast('تم نسخ الكود');
          btn.textContent = 'تم';
          setTimeout(() => { btn.textContent = 'نسخ'; }, 1400);
        } catch (e) {
          toast('تعذّر النسخ');
        }
      });
      pre.appendChild(btn);
    });
  }

  function buildToc(article) {
    const headings = $$('h2, h3', article);
    const toc = $('#toc');
    const tocBlock = $('#tocBlock');
    const mobileList = $('#mobileTocList');
    if (!toc || !tocBlock) return;

    headings.forEach((heading, index) => {
      heading.id = `sec-${index + 1}`;
      const label = heading.textContent.trim();
      const anchor = document.createElement('a');
      anchor.className = 'anchor';
      anchor.href = `#${heading.id}`;
      anchor.textContent = '#';
      anchor.setAttribute('aria-label', 'رابط القسم');
      anchor.setAttribute('aria-hidden', 'true');
      anchor.tabIndex = -1;
      heading.appendChild(anchor);
    });

    const htmlLinks = headings
      .map((h) => `<a class="toc-${h.tagName.slice(1).toLowerCase()}" href="#${h.id}">${escapeHtml(h.textContent.replace(/#$/, '').trim())}</a>`)
      .join('');

    toc.innerHTML = htmlLinks;
    if (mobileList) mobileList.innerHTML = htmlLinks;
    tocBlock.hidden = headings.length === 0;

    state.headings = headings;
    state.tocLinks = $$('a[href^="#"]', toc);

    const count = $$('h2', article).length;
    const sectionLabel = $('#sectionCount');
    if (sectionLabel) {
      sectionLabel.textContent = count === 1 ? 'قسم واحد' : count === 2 ? 'قسمان' : `${count} أقسام`;
    }

    if (mobileList) {
      $$('a', mobileList).forEach((a) => {
        a.addEventListener('click', () => {
          const details = $('#mobileToc');
          if (details) details.open = false;
        });
      });
    }
  }

  function updateToc() {
    if (!state.headings.length || !state.tocLinks.length) return;
    let current = state.headings[0];
    for (const heading of state.headings) {
      if (heading.getBoundingClientRect().top <= 130) current = heading;
      else break;
    }
    state.tocLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${current.id}`);
    });
  }

  function initProgress() {
    const bar = $('#readProgress');
    if (!bar) return;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      bar.style.width = `${pct}%`;
      updateToc();
    };
    update();
    window.addEventListener('scroll', () => {
      if (state.ticking) return;
      state.ticking = true;
      requestAnimationFrame(() => {
        update();
        state.ticking = false;
      });
    }, { passive: true });
    window.addEventListener('resize', update);
  }

  function mermaidVariables(theme) {
    const dark = theme !== 'light';
    return dark
      ? {
          background: '#1e1e24',
          primaryColor: '#2a2a32',
          primaryTextColor: '#f4f5f7',
          primaryBorderColor: '#5a5d67',
          lineColor: '#a0a2ac',
          secondaryColor: '#24242b',
          tertiaryColor: '#17171c',
          edgeLabelBackground: '#1e1e24',
          clusterBkg: '#1b1b21',
          clusterBorder: '#3a3a44',
          noteBkgColor: '#24242b',
          noteTextColor: '#f4f5f7',
          noteBorderColor: '#5a5d67',
        }
      : {
          background: '#ffffff',
          primaryColor: '#f3f4f6',
          primaryTextColor: '#16161b',
          primaryBorderColor: '#9a9da6',
          lineColor: '#5e626d',
          secondaryColor: '#eef0f3',
          tertiaryColor: '#ffffff',
          edgeLabelBackground: '#ffffff',
          clusterBkg: '#f7f8fa',
          clusterBorder: '#c9ccd3',
          noteBkgColor: '#f3f4f6',
          noteTextColor: '#16161b',
          noteBorderColor: '#9a9da6',
        };
  }

  function initMermaid() {
    if (!window.mermaid) return;
    const theme = html.dataset.theme === 'light' ? 'light' : 'dark';
    try {
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base',
        themeVariables: {
          ...mermaidVariables(theme),
          fontFamily: '"IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif',
          fontSize: '13px',
        },
        flowchart: { htmlLabels: true, curve: 'basis', useMaxWidth: false },
        sequence: { useMaxWidth: false, mirrorActors: false },
        er: { useMaxWidth: false },
        state: { useMaxWidth: false },
      });
    } catch (e) {
      console.warn('Mermaid init failed', e);
    }
    renderMermaid();
  }

  async function renderMermaid() {
    if (!window.mermaid) return;
    if (state.mermaidBusy) {
      state.mermaidAgain = true;
      return;
    }
    const nodes = $$('.mermaid', $('#markdown'));
    if (!nodes.length) return;
    state.mermaidBusy = true;
    nodes.forEach((node) => {
      node.removeAttribute('data-processed');
      node.innerHTML = node.dataset.src || node.textContent;
    });
    try {
      await window.mermaid.run({ nodes, suppressErrors: true });
    } catch (e) {
      console.warn('Mermaid render failed', e);
    }
    state.mermaidBusy = false;
    if (state.mermaidAgain) {
      state.mermaidAgain = false;
      renderMermaid();
    }
  }

  function rewriteLinks(article) {
    $$('a[href]', article).forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
      const [path] = href.split('#');
      const file = path.split('/').pop();
      if (!file || !file.endsWith('.md')) return;
      const target = DOCS.find((d) => d.file === file);
      if (target) {
        a.href = target.href;
        a.removeAttribute('target');
      }
    });
  }

  function render(markdownSource, doc) {
    const article = $('#markdown');
    const loading = $('#readerLoading');
    const content = $('#readerContent');
    const error = $('#readerError');
    if (!article) return;

    let parsed;
    if (window.marked && typeof window.marked.parse === 'function') {
      parsed = window.marked.parse(markdownSource, { gfm: true, breaks: false });
    } else {
      parsed = `<div class="reader-error">تعذّر تشغيل عارض Markdown. المحتوى الخام أدناه، ويمكنك أيضاً فتح الملف مباشرة من زر Markdown.</div><pre class="raw-fallback">${escapeHtml(markdownSource)}</pre>`;
    }

    article.innerHTML = parsed;
    article.setAttribute('dir', 'rtl');
    article.setAttribute('lang', 'ar');

    const firstTitle = article.querySelector('h1');
    if (firstTitle) firstTitle.remove();

    wrapTables(article);
    transformMermaid(article);
    enhanceCode(article);
    rewriteLinks(article);
    buildToc(article);

    const words = markdownSource.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    const reading = $('#readingTime');
    if (reading) reading.textContent = `قراءة ${minutes} دقيقة`;

    renderPager(doc);
    if (loading) loading.hidden = true;
    if (error) error.hidden = true;
    if (content) content.hidden = false;

    setMeta(doc);
    initProgress();
    initMermaid();

    if (location.hash) {
      const id = location.hash.slice(1);
      const target = document.getElementById(id);
      if (target) {
        requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
      }
    }
  }

  function showError(doc, err) {
    const loading = $('#readerLoading');
    const content = $('#readerContent');
    const error = $('#readerError');
    if (loading) loading.hidden = true;
    if (content) content.hidden = true;
    if (!error) return;
    error.hidden = false;
    const message = err && err.message ? err.message : 'خطأ غير معروف';
    error.innerHTML = `
      <strong>تعذّر تحميل الوثيقة.</strong>
      <p style="margin-top:8px">حاول تحديث الصفحة، أو افتح الملف الخام مباشرة. إذا كنت تفتح المشروع من القرص، استخدم خادماً محلياً بدلاً من <code>file://</code>.</p>
      <p style="margin-top:10px"><a href="/docs/${doc.file}">فتح ${doc.file}</a> · <a href="/docs/">كل الوثائق</a></p>
      <p style="margin-top:10px;opacity:.7;font-size:11px">${escapeHtml(message)}</p>
    `;
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (!ok) throw new Error('copy failed');
  }

  function toast(message) {
    if (window.ArchifexDocs && window.ArchifexDocs.toast) window.ArchifexDocs.toast(message);
  }

  function initActions() {
    const print = $('#printBtn');
    if (print) print.addEventListener('click', () => window.print());

    const copyLink = $('#copyLinkBtn');
    if (copyLink) {
      copyLink.addEventListener('click', async () => {
        try {
          await copyText(location.href);
          toast('تم نسخ رابط الوثيقة');
        } catch (e) {
          toast('تعذّر النسخ');
        }
      });
    }

    document.addEventListener('archifex:theme', () => {
      initMermaid();
    });
  }

  async function load() {
    const doc = resolveDoc();
    state.doc = doc;
    setMeta(doc);
    const base = location.protocol === 'file:' ? './' : '/docs/';
    try {
      const response = await fetch(`${base}${doc.file}`, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const source = await response.text();
      render(source, doc);
    } catch (err) {
      showError(doc, err);
    }
  }

  function init() {
    initActions();
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
