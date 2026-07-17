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

  /* Header shadow on scroll */
  var header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
      if (window.scrollY > 120) header.classList.add('compact');
      else header.classList.remove('compact');
    }, { passive: true });
  }

  /* Hero title — smooth teletype + staggered cascade */
  (function initHeroTeletype() {
    var el = document.querySelector('h1[data-teletype]');
    if (!el) return;

    var full = (el.getAttribute('data-text') || el.textContent || '').trim();
    if (!full) return;

    el.setAttribute('aria-label', full);
    el.textContent = '';

    var out = document.createElement('span');
    out.className = 'teletype-out';
    out.setAttribute('aria-hidden', 'true');
    el.appendChild(out);

    var caret = document.createElement('span');
    caret.className = 'teletype-caret';
    caret.setAttribute('aria-hidden', 'true');
    el.appendChild(caret);

    var sub = document.querySelector('.hero-sub.reveal');
    var desc = document.querySelector('.hero-desc.reveal');
    var actions = document.querySelector('.hero-actions.reveal');
    var followersShown = false;
    /* Character teletype causes wrap jumps on narrow screens — fade full title instead */
    var useFade = reduceMotion || window.matchMedia('(max-width: 640px)').matches;

    function showFollowers() {
      if (followersShown) return;
      followersShown = true;
      if (desc) {
        desc.classList.remove('is-waiting');
        desc.classList.add('is-ready', 'visible', 'is-inview');
      }
      if (actions) {
        window.setTimeout(function () {
          actions.classList.remove('is-waiting');
          actions.classList.add('is-ready', 'visible', 'is-inview');
        }, 120);
      }
    }

    function finishType() {
      out.textContent = full;
      el.classList.add('is-done');
      showFollowers();
    }

    if (desc) desc.classList.add('is-waiting');
    if (actions) actions.classList.add('is-waiting');

    if (useFade) {
      out.textContent = full;
      window.requestAnimationFrame(function () {
        if (sub) sub.classList.add('is-ready', 'visible', 'is-inview');
        window.setTimeout(function () {
          el.classList.add('is-live', 'is-done');
          window.setTimeout(showFollowers, 280);
        }, sub ? 200 : 80);
      });
      return;
    }

    /* Gentler ease — less early character clumping */
    function easeOut(t) {
      return 1 - Math.pow(1 - t, 1.55);
    }

    var duration = Math.max(1500, Math.min(2400, full.length * 88));
    var start = null;
    var shown = 0;

    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var target = Math.floor(easeOut(t) * full.length);
      /* Advance at most 2 chars/frame to avoid visible jumps */
      if (target > shown) {
        shown = Math.min(target, shown + 2);
        out.textContent = full.slice(0, shown);
      }
      if (!followersShown && t >= 0.68) showFollowers();
      if (t < 1 || shown < full.length) {
        requestAnimationFrame(frame);
      } else {
        finishType();
      }
    }

    function startTyping() {
      el.classList.add('is-live');
      requestAnimationFrame(frame);
    }

    /* Sub → title → type → body/cta overlap */
    window.requestAnimationFrame(function () {
      if (sub) sub.classList.add('is-ready', 'visible', 'is-inview');
      window.setTimeout(startTyping, sub ? 280 : 120);
    });
  })();

  /* Hero product language cycle — pauses when offscreen */
  (function initHeroLangCycle() {
    var root = document.querySelector('.hero-product[data-lang-cycle]');
    if (!root) return;

    var animate = !reduceMotion;
    var langs = ['en', 'th', 'zh'];
    var isCoarse = window.matchMedia('(pointer: coarse), (max-width: 860px)').matches;
    var holdMs = isCoarse ? 7000 : 3200;
    var firstHoldMs = isCoarse ? 4500 : 3000;
    var outMs = animate ? (isCoarse ? 220 : 380) : 0;
    var langIndex = 0;
    var timer = null;
    var onScreen = true;
    var started = false;

    var copy = {
      brandMeta: {
        en: 'Boutique · Phuket',
        th: 'บูทีค · ภูเก็ต',
        zh: '精品 · 普吉'
      },
      search: {
        en: 'Search programs',
        th: 'ค้นหาโปรแกรม',
        zh: '搜索计划'
      },
      walletLabel: {
        en: 'Marketing wallet',
        th: 'กระเป๋าการตลาด',
        zh: '营销钱包'
      },
      walletAmount: {
        en: '$248.00',
        th: '฿8,900',
        zh: '¥1,790'
      },
      kpiActive: {
        en: 'Active programs',
        th: 'โปรแกรมที่เปิดใช้',
        zh: '进行中的计划'
      },
      kpiActiveDelta: {
        en: '+1 this quarter',
        th: '+1 ไตรมาสนี้',
        zh: '+1 本季度'
      },
      kpiUplift: {
        en: 'Est. booking uplift',
        th: 'คาดการณ์จองเพิ่ม',
        zh: '预计预订提升'
      },
      kpiUpliftDelta: {
        en: 'vs. property avg',
        th: 'เทียบค่าเฉลี่ยที่พัก',
        zh: '对比物业均值'
      },
      kpiRevenue: {
        en: 'Potential revenue',
        th: 'รายได้ที่เป็นไปได้',
        zh: '潜在收入'
      },
      kpiRevenueValue: {
        en: '$42k',
        th: '฿1.5M',
        zh: '¥30万'
      },
      kpiRevenueDelta: {
        en: 'next 90 days',
        th: '90 วันถัดไป',
        zh: '未来90天'
      },
      recTitle: {
        en: 'Recommended for Maison Solara',
        th: 'แนะนำสำหรับ Maison Solara',
        zh: '为 Maison Solara 推荐'
      },
      recSub: {
        en: 'Based on occupancy & market demand',
        th: 'อิงอัตราเข้าพักและความต้องการตลาด',
        zh: '基于入住率与市场需求'
      },
      promoName: { en: 'Promotions', th: 'โปรโมชัน', zh: '促销' },
      promoMeta: {
        en: 'Conversion · flexible discount',
        th: 'คอนเวอร์ชัน · ส่วนลดยืดหยุ่น',
        zh: '转化 · 灵活折扣'
      },
      badgeRec: { en: 'Recommended', th: 'แนะนำ', zh: '推荐' },
      promoDesc: {
        en: 'Launch a discount and get deal badges, ranking lift, and email/push distribution across Agoda channels.',
        th: 'เปิดส่วนลด พร้อมป้ายดีล ดันอันดับ และกระจายผ่านอีเมล/พุชของ Agoda',
        zh: '开通折扣即可获得特惠标识、排名提升，以及 Agoda 邮件/推送分发。'
      },
      statPen: { en: 'Max penetration', th: 'การครอบคลุมสูงสุด', zh: '最高渗透' },
      statRev: { en: 'By revenue', th: 'ตามรายได้', zh: '按收入' },
      statLift: { en: 'Est. uplift', th: 'คาดการณ์เพิ่มขึ้น', zh: '预计提升' },
      btnActivate: { en: 'Activate', th: 'เปิดใช้', zh: '启用' },
      btnCompare: { en: 'Compare', th: 'เปรียบเทียบ', zh: '对比' },
      mktName: {
        en: 'Marketing Program',
        th: 'โปรแกรมการตลาด',
        zh: '营销计划'
      },
      mktMeta: {
        en: 'Marketing · 10–15% INM',
        th: 'การตลาด · 10–15% INM',
        zh: '营销 · 10–15% 佣金'
      },
      badgeOn: { en: 'Active', th: 'ใช้งาน', zh: '进行中' },
      mktDesc: {
        en: 'Full marketing suite with ranking boost, ad spend, and Preferred Partner badge.',
        th: 'ชุดการตลาดเต็มรูปแบบ พร้อมดันอันดับ งบโฆษณา และป้าย Preferred Partner',
        zh: '完整营销套件，含排名提升、广告投放与优选合作伙伴标识。'
      },
      statBook: { en: 'Booking uplift', th: 'จองเพิ่มขึ้น', zh: '预订提升' },
      statPenShort: { en: 'Penetration', th: 'การครอบคลุม', zh: '渗透率' },
      btnManage: { en: 'Manage', th: 'จัดการ', zh: '管理' },
      btnDetails: { en: 'Details', th: 'รายละเอียด', zh: '详情' },
      boostName: { en: 'Boost Rank', th: 'บูสต์อันดับ', zh: '排名加速' },
      boostMeta: {
        en: 'Visibility · Pay per booking',
        th: 'การมองเห็น · จ่ายต่อการจอง',
        zh: '曝光 · 按预订付费'
      },
      badgeOff: { en: 'Off', th: 'ปิด', zh: '关闭' },
      boostDesc: {
        en: 'Target specific audiences and stay dates — only pay when a booking lands. No lock-in.',
        th: 'เจาะกลุ่มเป้าหมายและวันที่เข้าพัก — จ่ายเมื่อมีการจอง ไม่ล็อกอิน',
        zh: '定向特定客群与入住日期——仅在成交时付费，无锁定。'
      },
      statEstRev: { en: 'Est. revenue', th: 'รายได้โดยประมาณ', zh: '预计收入' },
      boostRevNum: {
        en: '$67M',
        th: '฿2.3B',
        zh: '¥4.8亿'
      },
      statSearch: { en: 'Search lift', th: 'ค้นหาเพิ่มขึ้น', zh: '搜索提升' },
      allTitle: { en: 'All programs', th: 'โปรแกรมทั้งหมด', zh: '全部计划' },
      allCount: { en: '8 total', th: 'รวม 8', zh: '共 8 个' },
      colProgram: { en: 'Program', th: 'โปรแกรม', zh: '计划' },
      colCategory: { en: 'Category', th: 'หมวด', zh: '类别' },
      colRevenue: { en: 'Revenue', th: 'รายได้', zh: '收入' },
      colStatus: { en: 'Status', th: 'สถานะ', zh: '状态' },
      catMarketing: { en: 'Marketing', th: 'การตลาด', zh: '营销' },
      catVisibility: { en: 'Visibility', th: 'การมองเห็น', zh: '曝光' },
      maxName: { en: 'Maximum Gain', th: 'แม็กซิมัมเกน', zh: '最大收益' },
      catDistribution: { en: 'Distribution', th: 'การกระจาย', zh: '分销' },
      tableRevMkt: {
        en: '$131M',
        th: '฿4.6B',
        zh: '¥9.4亿'
      },
      tableRevBoost: {
        en: '$67M',
        th: '฿2.3B',
        zh: '¥4.8亿'
      },
      tableRevMax: {
        en: '$54M',
        th: '฿1.9B',
        zh: '¥3.9亿'
      },
      navHome: { en: 'Home', th: 'หน้าแรก', zh: '首页' },
      navReservations: { en: 'Reservations', th: 'การจอง', zh: '预订' },
      navCalendar: { en: 'Calendar', th: 'ปฏิทิน', zh: '日历' },
      navPayout: { en: 'Payout', th: 'รายได้', zh: '结算' },
      navGrowth: { en: 'Growth', th: 'การเติบโต', zh: '增长' }
    };

    function syncLangPill(lang) {
      var track = root.querySelector('.hero-product-lang');
      if (!track) return;
      var active = track.querySelector('[data-lang="' + lang + '"]');
      if (!active) return;
      track.style.setProperty('--lang-pill-x', Math.max(0, active.offsetLeft - 2) + 'px');
      track.style.setProperty('--lang-pill-w', active.offsetWidth + 'px');
      track.querySelectorAll('[data-lang]').forEach(function (chip) {
        chip.classList.toggle('is-on', chip.getAttribute('data-lang') === lang);
      });
    }

    function applyLang(lang) {
      root.setAttribute('data-lang', lang);
      root.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        var pack = copy[key];
        if (!pack || pack[lang] == null) return;
        el.textContent = pack[lang];
      });
      syncLangPill(lang);
    }

    function swapTo(nextIndex) {
      langIndex = nextIndex;
      var lang = langs[langIndex];
      if (!animate) {
        applyLang(lang);
        return;
      }
      root.classList.add('is-lang-out');
      root.classList.remove('is-lang-in');
      window.setTimeout(function () {
        applyLang(lang);
        root.classList.remove('is-lang-out');
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            root.classList.add('is-lang-in');
          });
        });
      }, outMs);
    }

    function clearCycleTimer() {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function scheduleCycle(ms) {
      clearCycleTimer();
      if (!animate || !onScreen) return;
      timer = window.setTimeout(tick, ms);
    }

    function tick() {
      swapTo((langIndex + 1) % langs.length);
      scheduleCycle(holdMs);
    }

    function begin() {
      if (started) return;
      started = true;
      langIndex = 0;
      applyLang(langs[0]);
      if (animate) root.classList.add('is-lang-in');
      scheduleCycle(firstHoldMs);
    }

    function pauseCycle() {
      clearCycleTimer();
      root.classList.remove('is-lang-out');
    }

    function resumeCycle() {
      if (!animate || !onScreen) return;
      if (!started) {
        begin();
        return;
      }
      scheduleCycle(holdMs);
    }

    window.addEventListener('resize', function () {
      syncLangPill(root.getAttribute('data-lang') || 'en');
    });

    if (animate) {
      var cycleIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          onScreen = entry.isIntersecting && entry.intersectionRatio > 0.08;
          if (onScreen) resumeCycle();
          else pauseCycle();
        });
      }, { threshold: [0, 0.08, 0.2] });
      cycleIo.observe(root);
    }

    begin();
    window.requestAnimationFrame(function () {
      syncLangPill(root.getAttribute('data-lang') || 'en');
    });

    /* Alive: wallet count-up once on EN, then hand off to language cycle */
    (function tickWalletOnce() {
      if (!animate) return;
      var el = root.querySelector('[data-i18n="walletAmount"]');
      if (!el) return;
      var start = 218;
      var end = 248;
      var duration = 1100;
      var t0 = null;
      el.classList.add('is-ticking');
      el.textContent = '$' + start.toFixed(2);

      function frame(now) {
        if (t0 == null) t0 = now;
        var p = Math.min(1, (now - t0) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        var n = start + (end - start) * eased;
        el.textContent = '$' + n.toFixed(2);
        if (p < 1) {
          window.requestAnimationFrame(frame);
          return;
        }
        el.textContent = copy.walletAmount.en;
        el.classList.remove('is-ticking');
      }
      window.requestAnimationFrame(frame);
    })();

    /* Alive: cursor parallax tilt */
    (function initTilt() {
      if (!animate) return;
      if (window.matchMedia('(hover: none), (pointer: coarse), (max-width: 860px)').matches) return;

      var maxX = 5.5;
      var maxY = 4.5;
      var maxP = 6;
      var raf = 0;
      var target = { x: 0, y: 0, px: 0, py: 0 };
      var current = { x: 0, y: 0, px: 0, py: 0 };

      function apply() {
        root.style.setProperty('--tilt-x', (-current.y).toFixed(3) + 'deg');
        root.style.setProperty('--tilt-y', current.x.toFixed(3) + 'deg');
        root.style.setProperty('--tilt-px', current.px.toFixed(2) + 'px');
        root.style.setProperty('--tilt-py', current.py.toFixed(2) + 'px');
      }

      function animateTilt() {
        current.x += (target.x - current.x) * 0.12;
        current.y += (target.y - current.y) * 0.12;
        current.px += (target.px - current.px) * 0.12;
        current.py += (target.py - current.py) * 0.12;
        apply();
        if (
          Math.abs(target.x - current.x) > 0.01 ||
          Math.abs(target.y - current.y) > 0.01 ||
          Math.abs(target.px - current.px) > 0.05
        ) {
          raf = window.requestAnimationFrame(animateTilt);
        } else {
          raf = 0;
          current.x = target.x;
          current.y = target.y;
          current.px = target.px;
          current.py = target.py;
          apply();
        }
      }

      function kick() {
        if (!raf) raf = window.requestAnimationFrame(animateTilt);
      }

      root.addEventListener('pointermove', function (e) {
        var rect = root.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        var ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        target.x = Math.max(-1, Math.min(1, nx)) * maxX;
        target.y = Math.max(-1, Math.min(1, ny)) * maxY;
        target.px = Math.max(-1, Math.min(1, nx)) * maxP;
        target.py = Math.max(-1, Math.min(1, ny)) * (maxP * 0.55);
        root.classList.add('is-tilting');
        kick();
      });

      root.addEventListener('pointerleave', function () {
        target.x = 0;
        target.y = 0;
        target.px = 0;
        target.py = 0;
        root.classList.remove('is-tilting');
        kick();
      });
    })();
  })();

  /* Don't download icons inside CSS-hidden secondary cards on small screens */
  if (window.matchMedia('(max-width: 860px)').matches) {
    document.querySelectorAll('.hero-product-card.is-secondary img').forEach(function (img) {
      img.removeAttribute('src');
      img.removeAttribute('srcset');
      img.setAttribute('data-deferred', '1');
    });
  }

  /* Motion pass — scroll earners only: featured, products, charts/results */
  if (reduceMotion) {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible', 'is-inview');
    });
    document.querySelectorAll('.hero-product, .disc-product, .results-board, .bar-h, .bar-chart').forEach(function (el) {
      el.classList.add('is-inview');
    });
    return;
  }

  document.documentElement.classList.add('js-motion');

  function markInView(el) {
    el.classList.add('is-inview', 'visible');
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      markInView(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -6% 0px'
  });

  document.querySelectorAll('.featured').forEach(function (el, idx) {
    el.style.setProperty('--motion-i', String(Math.min(idx, 8)));
    el.classList.add('motion-item');
    observer.observe(el);
  });

  document.querySelectorAll('.results-board, .bar-h, .bar-chart').forEach(function (el) {
    el.classList.add('motion-item');
    observer.observe(el);
  });

  document.querySelectorAll('.results-metric').forEach(function (el, idx) {
    el.style.setProperty('--motion-i', String(Math.min(idx, 4)));
  });
  document.querySelectorAll('.results-delta-row').forEach(function (el, idx) {
    el.style.setProperty('--motion-i', String(Math.min(idx + 2, 5)));
  });
  document.querySelectorAll('.results-trend-row').forEach(function (el, idx) {
    el.style.setProperty('--motion-i', String(Math.min(idx + 1, 4)));
  });

  document.querySelectorAll('.hero-product, .disc-product').forEach(function (el) {
    var rect = el.getBoundingClientRect();
    /* Above-fold mockups: show immediately so first paint is never an empty chrome shell */
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      markInView(el);
    } else {
      observer.observe(el);
    }
  });

  /* Featured project cards: clear any legacy scale sizing; crop is CSS-only */
  document.querySelectorAll('.featured-shot').forEach(function (shot) {
    shot.style.height = '';
    var scaleEl = shot.querySelector('.featured-shot__scale');
    if (!scaleEl) return;
    scaleEl.style.width = '';
    scaleEl.style.transform = '';
    scaleEl.style.transformOrigin = '';
  });

})();
