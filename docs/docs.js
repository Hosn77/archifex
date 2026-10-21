/* ==========================================================================
   ARCHIFEX — Documentation shared behaviour
   Theme persistence, sticky header, reveal, toasts
   ========================================================================== */

(() => {
  'use strict';

  const html = document.documentElement;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const paramTheme = new URLSearchParams(location.search).get('theme');
  const storedTheme = (() => {
    try { return localStorage.getItem('archifex-theme'); } catch (e) { return null; }
  })();
  let theme = (paramTheme === 'light' || paramTheme === 'dark')
    ? paramTheme
    : (storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark');

  function applyTheme(next, silent) {
    theme = next === 'light' ? 'light' : 'dark';
    html.dataset.theme = theme;
    try { localStorage.setItem('archifex-theme', theme); } catch (e) {}
    const icon = $('#themeIcon use');
    if (icon) icon.setAttribute('href', theme === 'dark' ? '#i-sun' : '#i-moon');
    const btn = $('#themeBtn');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'التبديل إلى المظهر الفاتح' : 'التبديل إلى المظهر الداكن');
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#17171C' : '#F2F3F5');
    if (!silent) {
      document.dispatchEvent(new CustomEvent('archifex:theme', { detail: { theme } }));
    }
  }

  function initTheme() {
    applyTheme(theme, true);
    const btn = $('#themeBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        applyTheme(theme === 'dark' ? 'light' : 'dark');
      });
    }
    window.addEventListener('storage', (e) => {
      if (e.key === 'archifex-theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        applyTheme(e.newValue);
      }
    });
  }

  function initHeader() {
    const header = $('.docs-header, .reader-header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    );
    items.forEach((el) => io.observe(el));
  }

  let toastTimer = null;
  function toast(message) {
    let host = $('#docsToast');
    if (!host) {
      host = document.createElement('div');
      host.id = 'docsToast';
      host.className = 'docs-toast';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      host.innerHTML = '<span></span>';
      document.body.appendChild(host);
    }
    const span = $('span', host);
    span.textContent = message;
    host.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => host.classList.remove('is-visible'), 2200);
  }

  function initYear() {
    $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  }

  function init() {
    document.documentElement.classList.add('js');
    initTheme();
    initHeader();
    initReveal();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ArchifexDocs = { toast, applyTheme: (t) => applyTheme(t), getTheme: () => theme };
})();
