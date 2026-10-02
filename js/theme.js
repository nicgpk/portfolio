(function () {
  'use strict';

  /* Microsoft Clarity — paste project ID from clarity.microsoft.com → Settings → Overview */
  var CLARITY_PROJECT_ID = 'xnujw7czxv';
  var clarityHost = window.location.hostname;
  var clarityLocal = clarityHost === 'localhost' || clarityHost === '127.0.0.1';
  if (CLARITY_PROJECT_ID && !clarityLocal) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme management — build once; CSS reacts to data-theme */
  var THEME_ICONS = {
    sun:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="4"/>' +
        '<path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5.05 5.05l1.77 1.77M17.18 17.18l1.77 1.77M18.95 5.05l-1.77 1.77M6.82 17.18l-1.77 1.77" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>',
    moon:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
        '<path d="M12.8 3.2a8.8 8.8 0 1 0 8 12.2A6.9 6.9 0 0 1 12.8 3.2Z"/>' +
      '</svg>'
  };

  function syncThemeToggle(theme) {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    var isDark = theme === 'dark';
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function mountThemeToggle() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn || btn.dataset.mounted === '1') return;
    btn.dataset.mounted = '1';
    btn.type = 'button';
    btn.innerHTML =
      '<span class="theme-toggle-track" aria-hidden="true">' +
        '<span class="theme-toggle-glider"></span>' +
        '<span class="theme-toggle-opt" data-opt="light">' + THEME_ICONS.sun + '</span>' +
        '<span class="theme-toggle-opt" data-opt="dark">' + THEME_ICONS.moon + '</span>' +
      '</span>';
  }

  var savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  mountThemeToggle();
  syncThemeToggle(document.documentElement.getAttribute('data-theme'));

  window.toggleTheme = function () {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    syncThemeToggle(next);
  };

})();
