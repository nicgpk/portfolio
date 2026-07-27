/* Partner Growth playbook — open pattern → UI example */
(function () {
  var root = document.querySelector('[data-pb-playbook]');
  if (!root) return;

  var modal = root.querySelector('[data-pb-modal]');
  var back = root.querySelector('[data-pb-back]');
  var nextBtn = root.querySelector('[data-pb-next]');
  var prevBtn = root.querySelector('[data-pb-prev]');
  var tenetEl = root.querySelector('[data-pb-tenet]');
  var titleEl = root.querySelector('[data-pb-title]');
  var summaryEl = root.querySelector('[data-pb-summary]');
  var exEl = root.querySelector('[data-pb-ex]');
  var stepsEl = root.querySelector('[data-pb-steps]');

  var openButtons = root.querySelectorAll('[data-pb-open]');
  var patternOrder = Array.prototype.map.call(openButtons, function (btn) {
    return btn.getAttribute('data-pb-open');
  }).filter(Boolean);
  var lastTrigger = null;
  var currentId = null;
  var unbindVisualViewport = null;
  var lockedScrollY = 0;

  function isPhoneViewport() {
    try {
      return window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;
    } catch (err) {
      return window.innerWidth <= 768;
    }
  }

  function clearModalViewportStyles() {
    if (!modal) return;
    [
      'position', 'inset', 'top', 'left', 'right', 'bottom',
      'width', 'max-width', 'max-height', 'height', 'margin', 'transform'
    ].forEach(function (prop) {
      modal.style.removeProperty(prop);
    });
  }

  /* Pin dialog to the visible phone screen — CSS svh/safe-area miss browser chrome */
  function syncModalToVisualViewport() {
    if (!modal || !modal.open) return;
    if (!isPhoneViewport()) {
      clearModalViewportStyles();
      return;
    }
    var vv = window.visualViewport;
    var gap = 8;
    var top = ((vv && vv.offsetTop) || 0) + gap;
    var left = ((vv && vv.offsetLeft) || 0) + gap;
    var width = ((vv && vv.width) || window.innerWidth) - gap * 2;
    var height = ((vv && vv.height) || window.innerHeight) - gap * 2;
    modal.style.setProperty('position', 'fixed');
    modal.style.setProperty('inset', 'auto');
    modal.style.setProperty('top', top + 'px');
    modal.style.setProperty('left', left + 'px');
    modal.style.setProperty('right', 'auto');
    modal.style.setProperty('bottom', 'auto');
    modal.style.setProperty('width', Math.max(0, width) + 'px');
    modal.style.setProperty('max-width', 'none');
    modal.style.setProperty('max-height', Math.max(0, height) + 'px');
    modal.style.setProperty('height', 'auto');
    modal.style.setProperty('margin', '0');
    modal.style.setProperty('transform', 'none');
  }

  function lockPageScroll() {
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + lockedScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }

  function unlockPageScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo(0, lockedScrollY);
  }

  function bindVisualViewport() {
    if (unbindVisualViewport) unbindVisualViewport();
    syncModalToVisualViewport();
    var onChange = function () { syncModalToVisualViewport(); };
    var vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', onChange);
      vv.addEventListener('scroll', onChange);
    }
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    unbindVisualViewport = function () {
      if (vv) {
        vv.removeEventListener('resize', onChange);
        vv.removeEventListener('scroll', onChange);
      }
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
      clearModalViewportStyles();
      unbindVisualViewport = null;
    };
  }

  /* Shared UI bits reused across pattern mocks */
  function discountSlider(value) {
    value = value == null ? 15 : value;
    var min = 5;
    var max = 25;
    var mid = 15;
    var pct = Math.max(0, Math.min(100, Math.round(((value - min) / (max - min)) * 100)));
    return (
      '<div class="pb-ex-field">' +
        '<div class="pb-ex-slider-head"><label>Discount depth</label></div>' +
        '<div class="pb-ex-slider-row">' +
          '<div class="pb-ex-slider" aria-hidden="true">' +
            '<span class="pb-ex-slider-track"><i style="width:' + pct + '%"></i></span>' +
            '<span class="pb-ex-slider-thumb" style="left:' + pct + '%"></span>' +
          '</div>' +
          '<div class="pb-ex-slider-scale"><span>' + min + '%</span><span>' + mid + '%</span><span>' + max + '%</span></div>' +
        '</div>' +
      '</div>'
    );
  }

  function monthCalendar(year, monthIndex, title, selectedDays) {
    var firstDow = new Date(year, monthIndex, 1).getDay();
    var daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    var selected = {};
    (selectedDays || []).forEach(function (d) { selected[d] = true; });
    var cells = [];
    var i;
    for (i = 0; i < firstDow; i++) {
      cells.push('<span class="pb-ex-day is-empty"></span>');
    }
    for (i = 1; i <= daysInMonth; i++) {
      cells.push(
        '<span class="pb-ex-day' + (selected[i] ? ' is-selected' : '') + '">' + i + '</span>'
      );
    }
    return (
      '<div class="pb-ex-month">' +
        '<div class="pb-ex-month-title">' + title + '</div>' +
        '<div class="pb-ex-month-dows" aria-hidden="true">' +
          '<span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>' +
        '</div>' +
        '<div class="pb-ex-month-grid">' + cells.join('') + '</div>' +
      '</div>'
    );
  }

  function blackoutCalendar() {
    return (
      '<div class="pb-ex-field">' +
        '<label>Blackout dates</label>' +
        '<div class="pb-ex-cal" aria-hidden="true">' +
          monthCalendar(2026, 7, 'August 2026', [5, 12, 19, 28]) +
          monthCalendar(2026, 8, 'September 2026', [3, 9, 17, 25]) +
        '</div>' +
      '</div>'
    );
  }

  /* 30-day bookings: weekday base, Fri–Sat peaks, gradual uplift */
  function performanceChart() {
    var bars = [];
    var i;
    for (i = 0; i < 30; i++) {
      var dow = i % 7;
      var weekend = dow === 4 ? 22 : dow === 5 ? 26 : dow === 6 ? 12 : 0;
      var soft = dow === 0 || dow === 1 ? -8 : 0;
      var trend = Math.round(i * 0.85);
      var wobble = ((i * 5) % 7) - 3;
      var h = Math.max(18, Math.min(96, 36 + weekend + soft + trend + wobble));
      var weekendClass = dow === 4 || dow === 5 ? ' is-peak' : '';
      bars.push('<i class="pb-ex-col' + weekendClass + '" style="height:' + h + '%"></i>');
    }
    return (
      '<div class="pb-ex-chart" aria-hidden="true">' +
        '<div class="pb-ex-chart-head">' +
          '<span>Daily bookings</span>' +
          '<span class="pb-ex-chart-legend"><em></em> Program live · 30 days</span>' +
        '</div>' +
        '<div class="pb-ex-chart-plot">' +
          '<div class="pb-ex-chart-grid"><span></span><span></span><span></span></div>' +
          '<div class="pb-ex-chart-bars">' + bars.join('') + '</div>' +
        '</div>' +
        '<div class="pb-ex-chart-axis">' +
          '<span>Day 1</span><span>10</span><span>20</span><span>Day 30</span>' +
        '</div>' +
      '</div>'
    );
  }

  var patterns = {
    discover: {
      tenet: '01 · Self-activate program with confidence',
      title: 'Easily discoverable',
      summary: 'Partners find the right program from a ranked catalog and recommendations, not buried tabs.',
      steps: [
        { title: 'Entry', detail: 'Growth home + search' },
        { title: 'Relevance', detail: 'Ranked by property fit' },
        { title: 'Next step', detail: 'Clear Activate / Compare' }
      ],

      ui:
        '<div class="pb-ex-shell">' +
          '<div class="pb-ex-bar"><span class="pb-ex-dot"></span><strong>Maison Solara</strong><span class="pb-ex-muted">Growth · Programs</span></div>' +
          '<div class="pb-ex-body">' +
            '<div class="pb-ex-section">Recommended for you</div>' +
            '<div class="hero-product-cards pb-ex-hero-cards">' +
              '<div class="hero-product-card is-featured">' +
                '<div class="hero-product-card-top">' +
                  '<div class="hero-product-card-id">' +
                    '<img class="hero-product-icon-img" src="images/icon-promo-3d.webp" alt="" width="44" height="44">' +
                    '<div><h5>Promotions</h5><p class="meta">Conversion · flexible discount</p></div>' +
                  '</div>' +
                  '<span class="hero-product-badge rec">Recommended</span>' +
                '</div>' +
                '<p class="desc">Launch a discount and get deal badges, ranking lift, and email/push distribution across Agoda channels.</p>' +
                '<div class="hero-product-card-stats">' +
                  '<div><div class="num">+15%</div><div class="lbl">Room nights</div></div>' +
                  '<div><div class="num">+24%</div><div class="lbl">Est revenue</div></div>' +
                '</div>' +
                '<div class="hero-product-card-actions">' +
                  '<span class="hero-product-btn primary">Activate</span>' +
                  '<span class="hero-product-btn">Compare</span>' +
                '</div>' +
              '</div>' +
              '<div class="hero-product-card is-secondary">' +
                '<div class="hero-product-card-top">' +
                  '<div class="hero-product-card-id">' +
                    '<img class="hero-product-icon-img" src="images/icon-growth-3d.webp" alt="" width="44" height="44">' +
                    '<div><h5>Marketing Program</h5><p class="meta">Marketing · 10–15% INM</p></div>' +
                  '</div>' +
                  '<span class="hero-product-badge on">Active</span>' +
                '</div>' +
                '<p class="desc">Full marketing suite with ranking boost, ad spend, and Preferred Partner badge.</p>' +
                '<div class="hero-product-card-stats">' +
                  '<div><div class="num">+10%</div><div class="lbl">Booking uplift</div></div>' +
                  '<div><div class="num">14%</div><div class="lbl">Penetration</div></div>' +
                '</div>' +
                '<div class="hero-product-card-actions">' +
                  '<span class="hero-product-btn">Manage</span>' +
                  '<span class="hero-product-btn">Details</span>' +
                '</div>' +
              '</div>' +
              '<div class="hero-product-card is-secondary">' +
                '<div class="hero-product-card-top">' +
                  '<div class="hero-product-card-id">' +
                    '<img class="hero-product-icon-img" src="images/icon-boost-3d.webp" alt="" width="44" height="44">' +
                    '<div><h5>Boost Rank</h5><p class="meta">Visibility · Pay per booking</p></div>' +
                  '</div>' +
                  '<span class="hero-product-badge">Off</span>' +
                '</div>' +
                '<p class="desc">Target specific audiences and stay dates — only pay when a booking lands. No lock-in.</p>' +
                '<div class="hero-product-card-stats">' +
                  '<div><div class="num">12%</div><div class="lbl">Est. revenue</div></div>' +
                  '<div><div class="num">+18%</div><div class="lbl">Search lift</div></div>' +
                '</div>' +
                '<div class="hero-product-card-actions">' +
                  '<span class="hero-product-btn primary">Activate</span>' +
                  '<span class="hero-product-btn">Details</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="pb-ex-section">All programs</div>' +
            '<div class="pb-ex-list">' +
              '<div><span>Maximum Gain</span><span class="pb-ex-muted">Eligible</span></div>' +
              '<div><span>Dynamic Rates</span><span class="pb-ex-muted">Eligible</span></div>' +
              '<div><span>Preferred Partner</span><span class="pb-ex-muted">Invite only</span></div>' +
            '</div>' +
          '</div>' +
        '</div>'
    },
    confidence: {
      tenet: '01 · Self-activate program with confidence',
      title: 'Pre-activation confidence',
      summary: 'Show outcome and fit before terms, so partners decide on numbers, not promises.',
      steps: [
        { title: 'Benefits', detail: 'What you get' },
        { title: 'ROI & fit', detail: 'Uplift + eligibility' },
        { title: 'FAQ', detail: 'Objections inline' }
      ],

      ui:
        '<div class="pb-ex-shell">' +
          '<div class="pb-ex-bar"><span class="pb-ex-dot"></span><strong>Maison Solara</strong><span class="pb-ex-muted">Pre-activation confidence</span></div>' +
          '<div class="pb-ex-body">' +
            '<div class="hero-product-card is-featured pb-ex-hero-card">' +
              '<div class="hero-product-card-top">' +
                '<div class="hero-product-card-id">' +
                  '<img class="hero-product-icon-img" src="images/icon-promo-3d.webp" alt="" width="44" height="44">' +
                  '<div>' +
                    '<h5>Promotions</h5>' +
                    '<p class="meta">Conversion · flexible discount</p>' +
                  '</div>' +
                '</div>' +
                '<span class="hero-product-badge rec">Recommended</span>' +
              '</div>' +
              '<ul class="pb-ex-hero-benefits">' +
                '<li>Deal badges on search &amp; property pages</li>' +
                '<li>Ranking lift while the program is live</li>' +
                '<li>Email / push distribution across Agoda channels</li>' +
              '</ul>' +
              '<div class="hero-product-card-stats">' +
                '<div><div class="num">+15%</div><div class="lbl">Room nights</div></div>' +
                '<div><div class="num">+24%</div><div class="lbl">Net revenue</div></div>' +
              '</div>' +
              '<div class="pb-ex-faq"><strong>Will this lower my rate forever?</strong><span>No — you set dates and depth. Pause anytime.</span></div>' +
              '<div class="hero-product-card-actions">' +
                '<span class="hero-product-btn primary">Continue to activate</span>' +
                '<span class="hero-product-btn">Compare</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
    },
    activate: {
      tenet: '01 · Self-activate program with confidence',
      title: 'Self-serve activation',
      summary: 'A short checklist: terms, configure, confirm. Then clear next steps for Manage and Track.',
      steps: [
        { title: 'Terms', detail: 'Commercial impact first' },
        { title: 'Configure', detail: 'Only outcome settings' },
        { title: 'Confirm', detail: 'Review &amp; go live' }
      ],

      ui:
        '<div class="pb-ex-shell">' +
          '<div class="pb-ex-bar"><span class="pb-ex-dot"></span><strong>Activate Promotions</strong><span class="pb-ex-muted">Step 2 of 3</span></div>' +
          '<div class="pb-ex-body">' +
            discountSlider(15) +
            '<div class="pb-ex-field"><label>Audience</label><div class="pb-ex-seg"><span class="is-on">App users</span><span>All guests</span><span>Members</span></div></div>' +
            '<div class="pb-ex-field"><label>Stay dates</label><div class="pb-ex-input">15 Aug – 30 Sep 2026</div></div>' +
            '<div class="pb-ex-field"><label>Blackout dates</label><div class="pb-ex-input pb-ex-input--muted">Select dates</div></div>' +
            '<div class="pb-ex-actions"><span class="pb-ex-btn">Back</span><span class="pb-ex-btn is-primary">Review &amp; go live</span></div>' +
          '</div>' +
        '</div>'
    },
    settings: {
      tenet: '02 · Manage program with flexibility',
      title: 'Fine-tune a live program',
      summary: 'Pause, fencing, and blackout dates, with an impact preview before saving.',
      steps: [
        { title: 'Open', detail: 'From active card' },
        { title: 'Adjust', detail: 'Preview impact' },
        { title: 'Save', detail: 'Versioned history' }
      ],

      ui:
        '<div class="pb-ex-shell">' +
          '<div class="pb-ex-bar"><span class="pb-ex-dot"></span><strong>Editing a live promotion</strong><span class="pb-ex-muted">Promotions · Settings</span></div>' +
          '<div class="pb-ex-body">' +
            discountSlider(15) +
            '<div class="pb-ex-field"><label>Audience</label><div class="pb-ex-seg"><span class="is-on">App users</span><span>All guests</span><span>Members</span></div></div>' +
            '<div class="pb-ex-field"><label>Stay dates</label><div class="pb-ex-input">15 Aug – 30 Sep 2026</div></div>' +
            blackoutCalendar() +
            '<div class="pb-ex-field">' +
              '<label>Days of week</label>' +
              '<div class="pb-ex-days" aria-hidden="true">' +
                '<span class="is-on">Mon</span>' +
                '<span class="is-on">Tue</span>' +
                '<span class="is-on">Wed</span>' +
                '<span class="is-on">Thu</span>' +
                '<span class="is-on">Fri</span>' +
                '<span>Sat</span>' +
                '<span>Sun</span>' +
              '</div>' +
            '</div>' +
            '<div class="pb-ex-actions"><span class="pb-ex-btn">Pause program</span><span class="pb-ex-btn is-primary">Save changes</span></div>' +
          '</div>' +
        '</div>'
    },
    analytics: {
      tenet: '03 · Track performance clearly',
      title: 'Program performance analytics',
      summary: 'Impact first, then comparison, then one suggested next action.',
      steps: [
        { title: 'KPIs', detail: 'Uplift &amp; revenue' },
        { title: 'Compare', detail: 'Vs property avg' },
        { title: 'Act', detail: 'One recommendation' }
      ],

      ui:
        '<div class="pb-ex-shell">' +
          '<div class="pb-ex-bar"><span class="pb-ex-dot"></span><strong>Promotions · Performance</strong><span class="pb-ex-muted">Last 30 days</span></div>' +
          '<div class="pb-ex-body">' +
            '<div class="pb-ex-kpis">' +
              '<div class="pb-ex-kpi"><span>Booking uplift</span><strong>+18%</strong><em>vs property avg</em></div>' +
              '<div class="pb-ex-kpi"><span>Attributed revenue</span><strong>$42k</strong><em>+12% vs prior</em></div>' +
              '<div class="pb-ex-kpi"><span>Penetration</span><strong>72%</strong><em>eligible nights</em></div>' +
            '</div>' +
            performanceChart() +
            '<div class="pb-ex-section">Suggested adjustment</div>' +
            discountSlider(20) +
            '<div class="pb-ex-actions"><span class="pb-ex-btn is-primary">Apply 20% on weekdays</span></div>' +
          '</div>' +
        '</div>'
    },
    deactivate: {
      tenet: '04 · Deactivate program when needed',
      title: 'Self-serve deactivation',
      summary: 'Show performance so far and what they lose, capture the reason, then confirm. No dark patterns.',
      steps: [
        { title: 'Performance', detail: 'Results so far' },
        { title: 'Impact', detail: 'What you lose' },
        { title: 'Reason', detail: 'Structured why' }
      ],

      ui:
        '<div class="pb-ex-shell">' +
          '<div class="pb-ex-bar"><span class="pb-ex-dot"></span><strong>Deactivate Promotions</strong><span class="pb-ex-muted">Exit flow</span></div>' +
          '<div class="pb-ex-body">' +
            '<div class="pb-ex-section">Your Promotions performance</div>' +
            '<div class="pb-ex-kpis">' +
              '<div class="pb-ex-kpi"><span>Live for</span><strong>47 days</strong><em>since 8 Jun</em></div>' +
              '<div class="pb-ex-kpi"><span>Booking uplift</span><strong>+18%</strong><em>vs property avg</em></div>' +
              '<div class="pb-ex-kpi"><span>Attributed revenue</span><strong>$42k</strong><em>this period</em></div>' +
            '</div>' +
            '<div class="pb-ex-section">If you deactivate today</div>' +
            '<div class="pb-ex-lose" aria-hidden="true">' +
              '<ul class="pb-ex-lose-list">' +
                '<li>Deal badge removes from search in ~2 hrs</li>' +
                '<li>Ranking boost ends · est. −12% impressions</li>' +
                '<li>Email / push distribution stops</li>' +
              '</ul>' +
            '</div>' +
            '<div class="pb-ex-section">Why are you leaving?</div>' +
            '<div class="pb-ex-reasons" aria-hidden="true">' +
              '<label class="is-on"><input type="radio" name="pb-leave" checked tabindex="-1"> Too expensive</label>' +
              '<label><input type="radio" name="pb-leave" tabindex="-1"> Too complex</label>' +
              '<label><input type="radio" name="pb-leave" tabindex="-1"> Low ROI</label>' +
              '<label><input type="radio" name="pb-leave" tabindex="-1"> Seasonal pause</label>' +
            '</div>' +
            '<div class="pb-ex-actions"><span class="pb-ex-btn is-danger">Confirm deactivate</span><span class="pb-ex-btn is-primary">Keep program</span></div>' +
          '</div>' +
        '</div>'
    },
    retention: {
      tenet: '04 · Deactivate program when needed',
      title: 'Counter-offer for retention',
      summary: 'Match the exit reason to a lighter alternative, not a generic discount on the same funnel.',
      steps: [
        { title: 'Match', detail: 'Reason → alternative' },
        { title: 'Compare', detail: 'Side-by-side tradeoff' },
        { title: 'Choose', detail: 'Accept or leave' }
      ],

      ui:
        '<div class="pb-ex-shell">' +
          '<div class="pb-ex-bar"><span class="pb-ex-dot"></span><strong>Before you go</strong><span class="pb-ex-muted">Reason: Too expensive</span></div>' +
          '<div class="pb-ex-body">' +
            '<div class="pb-ex-compare">' +
              '<div class="pb-ex-card is-dim">' +
                '<div class="pb-ex-card-top"><img src="images/icon-promo-3d.webp" alt="" width="28" height="28"><div><strong>Leaving Promotions</strong><span>You lose</span></div></div>' +
                '<ul class="pb-ex-lose-list">' +
                  '<li>Deal badge &amp; ranking boost</li>' +
                  '<li>Email / push distribution</li>' +
                  '<li>Est. −12% impressions</li>' +
                '</ul>' +
              '</div>' +
              '<div class="pb-ex-card is-rec">' +
                '<div class="pb-ex-card-top"><img src="images/icon-boost-3d.webp" alt="" width="28" height="28"><div><strong>Try Boost Rank</strong><span>Pay only when booked</span></div><span class="hero-product-badge rec">Better fit</span></div>' +
                '<ul class="pb-ex-bullets"><li>No discount depth to manage</li><li>Target Singapore · 30 days</li><li>Lower cost risk</li></ul>' +
                '<div class="pb-ex-actions"><span class="pb-ex-btn is-primary">Switch to Boost Rank</span></div>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="pb-ex-link" tabindex="-1">No thanks — finish deactivation</button>' +
          '</div>' +
        '</div>'
    }
  };

  function stripRecs() {
    root.querySelectorAll('.pb-rec').forEach(function (el) {
      el.remove();
    });
    root.querySelectorAll('[data-pb-rec], .pb-rec-label').forEach(function (el) {
      var wrap = el.closest('.pb-rec');
      if (wrap) wrap.remove();
      else el.remove();
    });
  }

  function render(pattern) {
    tenetEl.textContent = pattern.tenet;
    titleEl.textContent = pattern.title;
    summaryEl.textContent = pattern.summary;

    if (exEl) exEl.innerHTML = pattern.ui || '';
    stepsEl.innerHTML = pattern.steps.map(function (step) {
      return (
        '<li class="pb-step">' +
        '<strong>' + step.title + '</strong>' +
        '<span>' + step.detail + '</span>' +
        '</li>'
      );
    }).join('');
    stripRecs();
  }

  function updateNextButton() {
    if (!nextBtn) return;
    var idx = patternOrder.indexOf(currentId);
    var hasNext = idx >= 0 && idx < patternOrder.length - 1;
    nextBtn.disabled = !hasNext;
    nextBtn.setAttribute('aria-disabled', hasNext ? 'false' : 'true');
    if (hasNext) {
      var nextId = patternOrder[idx + 1];
      var nextPattern = patterns[nextId];
      nextBtn.title = nextPattern ? nextPattern.title : 'Next';
    } else {
      nextBtn.title = 'Last pattern';
    }
    if (prevBtn) {
      var hasPrev = idx > 0;
      prevBtn.disabled = !hasPrev;
      prevBtn.setAttribute('aria-disabled', hasPrev ? 'false' : 'true');
      if (hasPrev) {
        var prevId = patternOrder[idx - 1];
        var prevPattern = patterns[prevId];
        prevBtn.title = prevPattern ? prevPattern.title : 'Previous';
      } else {
        prevBtn.title = 'First pattern';
      }
    }
  }

  function openPattern(id, trigger) {
    var pattern = patterns[id];
    if (!pattern) return;
    currentId = id;
    if (trigger) lastTrigger = trigger;
    openButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-pb-open') === id);
    });
    render(pattern);
    root.classList.add('is-detail');
    stripRecs();
    updateNextButton();
    if (modal && !modal.open && typeof modal.showModal === 'function') {
      document.documentElement.classList.add('pb-modal-open');
      if (isPhoneViewport()) lockPageScroll();
      modal.showModal();
      bindVisualViewport();
      requestAnimationFrame(function () {
        syncModalToVisualViewport();
        requestAnimationFrame(syncModalToVisualViewport);
      });
    }
    if (back && typeof back.focus === 'function') {
      try { back.focus(); } catch (err) { /* ignore */ }
    }
  }

  function openNextPattern() {
    var idx = patternOrder.indexOf(currentId);
    if (idx < 0 || idx >= patternOrder.length - 1) return;
    var nextId = patternOrder[idx + 1];
    openPattern(nextId);
    if (nextBtn && typeof nextBtn.focus === 'function') {
      try { nextBtn.focus(); } catch (err) { /* ignore */ }
    }
  }

  function openPrevPattern() {
    var idx = patternOrder.indexOf(currentId);
    if (idx <= 0) return;
    var prevId = patternOrder[idx - 1];
    openPattern(prevId);
    if (prevBtn && typeof prevBtn.focus === 'function') {
      try { prevBtn.focus(); } catch (err) { /* ignore */ }
    }
  }

  function closePattern() {
    if (modal && modal.open && typeof modal.close === 'function') {
      modal.close();
      return;
    }
    root.classList.remove('is-detail');
    openButtons.forEach(function (btn) {
      btn.classList.remove('is-active');
    });
    currentId = null;
    stripRecs();
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      try { lastTrigger.focus(); } catch (err) { /* ignore */ }
    }
  }

  stripRecs();
  if (window.MutationObserver) {
    new MutationObserver(function () { stripRecs(); }).observe(root, {
      childList: true,
      subtree: true
    });
  }

  root.addEventListener('click', function (e) {
    var openBtn = e.target.closest('[data-pb-open]');
    if (openBtn && root.contains(openBtn)) {
      openPattern(openBtn.getAttribute('data-pb-open'), openBtn);
      return;
    }
    if (e.target.closest('[data-pb-back]')) {
      closePattern();
      return;
    }
    if (e.target.closest('[data-pb-next]')) {
      openNextPattern();
      return;
    }
    if (e.target.closest('[data-pb-prev]')) {
      openPrevPattern();
    }
  });

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.close();
      }
    });
    modal.addEventListener('close', function () {
      if (unbindVisualViewport) unbindVisualViewport();
      if (document.body.style.position === 'fixed') unlockPageScroll();
      document.documentElement.classList.remove('pb-modal-open');
      root.classList.remove('is-detail');
      openButtons.forEach(function (btn) {
        btn.classList.remove('is-active');
      });
      currentId = null;
      stripRecs();
      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        try { lastTrigger.focus(); } catch (err) { /* ignore */ }
      }
    });
  }
})();
