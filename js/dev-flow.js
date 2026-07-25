/* Before/after service-creation path — Dev Portal case study */
(function () {
  var board = document.querySelector('[data-flow-board]');
  if (!board) return;

  var steps = [
    {
      before: {
        title: 'Hunt the portal',
        tag: 'Lost',
        bad: true,
        detail: 'Home was a flat dump of links. Engineers could not find Create service without Slack tribal knowledge.',
        meta: 'Friction · discoverability'
      },
      after: {
        title: 'Task domains',
        tag: 'Home',
        good: true,
        detail: 'Manage / Plan / Build / Secure / Monitor replaced the link dump — a map you can learn and that SUS can track.',
        meta: 'Fix · information architecture'
      }
    },
    {
      before: {
        title: 'Long catalog form',
        tag: 'Blocked',
        bad: true,
        detail: 'One dense wizard with repo, ownership, and tags upfront — no leave/resume, no guidance at bottlenecks.',
        meta: 'Friction · form load'
      },
      after: {
        title: 'Guided create',
        tag: 'Unblock',
        good: true,
        detail: 'Phase 1 guidance: docs at bottlenecks, skip unused repo steps, leave and resume when AD requests take time.',
        meta: 'Fix · create flow'
      }
    },
    {
      before: {
        title: 'Ownership wall',
        tag: 'AD wait',
        bad: true,
        detail: 'Missing admin groups stopped the flow with no in-product path — request AD offline, then come back days later.',
        meta: 'Friction · handoff'
      },
      after: {
        title: 'Leave & resume',
        tag: 'Recover',
        good: true,
        detail: 'Long AD handoffs no longer wiped progress — engineers could leave the maze and pick up where they stopped.',
        meta: 'Fix · continuity'
      }
    },
    {
      before: {
        title: 'Guess the tags',
        tag: 'Unclear',
        bad: true,
        detail: 'Platform and system tags were required but undocumented. Wrong tags meant downstream ownership failures.',
        meta: 'Friction · taxonomy'
      },
      after: {
        title: 'In-context help',
        tag: 'Clarify',
        good: true,
        detail: 'Ownership and security-group confusion got inline explanation instead of a dead-end modal with no next step.',
        meta: 'Fix · guidance'
      }
    },
    {
      before: {
        title: 'Dead-end blockers',
        tag: 'No docs',
        bad: true,
        detail: 'Bottlenecks had no in-product guidance. Engineers left the wizard, asked Slack, and lost their place.',
        meta: 'Friction · guidance'
      },
      after: {
        title: 'Searchable catalog',
        tag: 'Find',
        good: true,
        detail: 'Components with ownership, source, and impact in one table — so engineers start from truth, not folklore.',
        meta: 'Fix · catalog'
      }
    },
    {
      before: {
        title: '1–2 days later',
        tag: 'Unscored',
        bad: true,
        detail: 'Service creation took working days. No SUS baseline — leadership could not see whether DX improved.',
        meta: 'Cost · time & score'
      },
      after: {
        title: 'Minutes, scored',
        tag: 'SUS',
        good: true,
        detail: 'Average create time fell to 6m 8s. SUS rose 61.9 → 68.8 across quarters — DX you can defend.',
        meta: 'Proof · metrics'
      }
    }
  ];

  var listEl = board.querySelector('[data-flow-list]');
  var toggles = board.querySelectorAll('[data-flow-mode]');
  var mode = 'before';
  var animating = false;

  function pad(i) {
    return String(i + 1).padStart(2, '0');
  }

  function stepHtml(step, index, state) {
    var tagClass = state.bad ? ' is-bad' : (state.good ? ' is-good' : '');
    return (
      '<li class="flow-step" data-flow-step="' + index + '">' +
        '<div class="flow-step-rail" aria-hidden="true">' +
          '<span class="flow-step-dot"></span>' +
          (index < steps.length - 1 ? '<span class="flow-step-line"></span>' : '') +
        '</div>' +
        '<div class="flow-step-body">' +
          '<div class="flow-step-top">' +
            '<span class="flow-step-idx">' + pad(index) + '</span>' +
            '<h4 class="flow-step-title">' + state.title + '</h4>' +
            '<span class="flow-step-tag' + tagClass + '">' + state.tag + '</span>' +
          '</div>' +
          '<p class="flow-step-detail">' + state.detail + '</p>' +
          '<span class="flow-step-meta">' + state.meta + '</span>' +
        '</div>' +
      '</li>'
    );
  }

  function render(animate) {
    var html = steps.map(function (step, i) {
      return stepHtml(step, i, step[mode]);
    }).join('');

    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      listEl.innerHTML = html;
      return;
    }

    animating = true;
    listEl.classList.add('is-exiting');
    window.setTimeout(function () {
      listEl.innerHTML = html;
      listEl.classList.remove('is-exiting');
      listEl.classList.add('is-entering');
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          listEl.classList.remove('is-entering');
          animating = false;
        });
      });
    }, 160);
  }

  function setMode(next) {
    if (next === mode || animating) return;
    mode = next;
    board.setAttribute('data-mode', mode);
    toggles.forEach(function (btn) {
      var on = btn.getAttribute('data-flow-mode') === mode;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    render(true);
  }

  board.addEventListener('click', function (e) {
    var modeBtn = e.target.closest('[data-flow-mode]');
    if (modeBtn) setMode(modeBtn.getAttribute('data-flow-mode'));
  });

  render(false);
})();
