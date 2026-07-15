(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme management */
  var ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.061l1.59-1.591a.75.75 0 0 1 1.06 0ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 1-1.06 0l-1.59-1.591a.75.75 0 1 1 1.06-1.06l1.591 1.59a.75.75 0 0 1 0 1.061ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 1-1.061 0l-1.591-1.59a.75.75 0 0 1 1.06-1.061l1.591 1.59a.75.75 0 0 1 0 1.06ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 1 0-1.06l1.59-1.591a.75.75 0 0 1 1.061 1.06l-1.59 1.591a.75.75 0 0 1-1.06 0Z"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998z"/></svg>'
  };

  function renderThemeToggle(theme) {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    var isDark = theme === 'dark';
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.innerHTML =
      '<span class="theme-toggle-track" aria-hidden="true">' +
        '<span class="theme-toggle-thumb"></span>' +
        '<span class="theme-toggle-opt sun">' + ICONS.sun + '</span>' +
        '<span class="theme-toggle-opt moon">' + ICONS.moon + '</span>' +
      '</span>';
  }

  var savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  renderThemeToggle(document.documentElement.getAttribute('data-theme'));

  window.toggleTheme = function () {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    renderThemeToggle(next);
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

  /* Hero product language cycle — always runs (preview iframes often report document.hidden) */
  (function initHeroLangCycle() {
    var root = document.querySelector('.hero-product[data-lang-cycle]');
    if (!root) return;

    var animate = !reduceMotion;
    var langs = ['en', 'th', 'zh'];
    var holdMs = 3200;
    var firstHoldMs = 3000;
    var outMs = animate ? 380 : 0;
    var langIndex = 0;
    var timer = null;

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
      }
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

    function tick() {
      swapTo((langIndex + 1) % langs.length);
      timer = window.setTimeout(tick, holdMs);
    }

    function begin() {
      langIndex = 0;
      applyLang(langs[0]);
      if (animate) root.classList.add('is-lang-in');
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(tick, firstHoldMs);
    }

    window.addEventListener('resize', function () {
      syncLangPill(root.getAttribute('data-lang') || 'en');
    });

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

  /* Motion pass */
  if (reduceMotion) {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible', 'is-inview');
    });
    document.querySelectorAll('.hero-product, .disc-product, .disc-explore-card, .results-board').forEach(function (el) {
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

  function staggerGroup(nodes, startIndex) {
    var i = startIndex || 0;
    nodes.forEach(function (el, idx) {
      if (idx > 11) return; /* cap stagger */
      el.style.setProperty('--motion-i', String(i + idx));
      el.classList.add('motion-item');
      observer.observe(el);
    });
  }

  /* Page content groups */
  document.querySelectorAll('.featured, .card, a.card').forEach(function (el, idx) {
    el.style.setProperty('--motion-i', String(Math.min(idx, 8)));
    el.classList.add('motion-item', 'motion-item--scale');
    observer.observe(el);
  });

  staggerGroup(document.querySelectorAll('.exp-row'));
  staggerGroup(document.querySelectorAll('.process-row, .process-item'));
  staggerGroup(document.querySelectorAll('.stat-pill'));
  staggerGroup(document.querySelectorAll('.meta-item'));
  staggerGroup(document.querySelectorAll('.resume-item, .resume-edu-item, .resume-skills-group'));

  document.querySelectorAll('section > .container > h2, .disc-explore-card > h3, .resume-section > h2').forEach(function (el, idx) {
    el.style.setProperty('--motion-i', String(Math.min(idx % 4, 3)));
    el.classList.add('motion-item');
    observer.observe(el);
  });

  document.querySelectorAll('.pull-quote, .stats-row, .bar-h, .bar-chart, .logo-row, .resume-header, .results-board').forEach(function (el) {
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

  document.querySelectorAll('.hero .reveal').forEach(function (el) {
    observer.observe(el);
  });

  document.querySelectorAll('.hero-product, .disc-product').forEach(function (el) {
    observer.observe(el);
  });

  document.querySelectorAll('.disc-explore-card').forEach(function (el, idx) {
    el.style.setProperty('--motion-i', String(Math.min(idx, 4)));
    observer.observe(el);
  });

  document.querySelectorAll('.btn').forEach(function (el) {
    if (el.closest('.hero')) return;
    el.classList.add('motion-item');
    observer.observe(el);
  });

})();
