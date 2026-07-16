/* Interactive before/after service-creation flow on Dev Portal case study */
(function () {
  var board = document.querySelector('[data-flow-board]');
  if (!board) return;

  var nodesBefore = [
    {
      id: 'b1',
      title: 'Hunt the portal',
      tag: 'Lost',
      bad: true,
      detail: 'Home was a flat dump of links. Engineers could not find Create service without Slack tribal knowledge.',
      meta: 'Friction · discoverability'
    },
    {
      id: 'b2',
      title: 'Long catalog form',
      tag: 'Blocked',
      bad: true,
      detail: 'One dense wizard with repo, ownership, and tags upfront — no leave/resume, no guidance at bottlenecks.',
      meta: 'Friction · form load'
    },
    {
      id: 'b3',
      title: 'Ownership wall',
      tag: 'AD wait',
      bad: true,
      detail: 'Missing admin groups stopped the flow with no in-product path — request AD offline, then come back days later.',
      meta: 'Friction · handoff'
    },
    {
      id: 'b4',
      title: 'Guess the tags',
      tag: 'Unclear',
      bad: true,
      detail: 'Platform and system tags were required but undocumented. Wrong tags meant downstream ownership failures.',
      meta: 'Friction · taxonomy'
    },
    {
      id: 'b5',
      title: 'Dead-end blockers',
      tag: 'No docs',
      bad: true,
      detail: 'Bottlenecks had no in-product guidance. Engineers left the wizard, asked Slack, and lost their place.',
      meta: 'Friction · guidance'
    },
    {
      id: 'b6',
      title: '1–2 days later',
      tag: 'Unscored',
      bad: true,
      detail: 'Service creation took working days. No SUS baseline — leadership could not see whether DX improved.',
      meta: 'Cost · time & score'
    }
  ];

  var nodesAfter = [
    {
      id: 'a1',
      title: 'Task domains',
      tag: 'Home',
      good: true,
      detail: 'Manage / Plan / Build / Secure / Monitor replaced the link dump — a map you can learn and that SUS can track.',
      meta: 'Fix · IA'
    },
    {
      id: 'a2',
      title: 'Searchable catalog',
      tag: 'Find',
      good: true,
      detail: 'Components with ownership, source, and impact in one table — so engineers start from truth, not folklore.',
      meta: 'Fix · catalog'
    },
    {
      id: 'a3',
      title: 'Guided create',
      tag: 'Unblock',
      good: true,
      detail: 'Phase 1 guidance: docs at bottlenecks, skip unused repo steps, leave and resume when AD requests take time.',
      meta: 'Fix · create flow'
    },
    {
      id: 'a4',
      title: 'In-context help',
      tag: 'Clarify',
      good: true,
      detail: 'Ownership and security-group confusion got inline explanation instead of a dead-end modal with no next step.',
      meta: 'Fix · guidance'
    },
    {
      id: 'a5',
      title: 'Leave & resume',
      tag: 'Recover',
      good: true,
      detail: 'Long AD handoffs no longer wiped progress — engineers could leave the maze and pick up where they stopped.',
      meta: 'Fix · continuity'
    },
    {
      id: 'a6',
      title: 'Minutes, scored',
      tag: 'SUS',
      good: true,
      detail: 'Average create time fell to 6m 8s. SUS rose 61.9 → 68.8 across quarters — DX you can defend.',
      meta: 'Proof · metrics'
    }
  ];

  var nodesEl = board.querySelector('[data-flow-nodes]');
  var detailTitle = board.querySelector('[data-flow-detail-title]');
  var detailBody = board.querySelector('[data-flow-detail-body]');
  var detailMeta = board.querySelector('[data-flow-detail-meta]');
  var edgesSvg = board.querySelector('[data-flow-edges]');
  var toggles = board.querySelectorAll('[data-flow-mode]');

  var mode = 'before';
  var activeId = nodesBefore[0].id;

  function currentNodes() {
    return mode === 'before' ? nodesBefore : nodesAfter;
  }

  function findNode(id) {
    return currentNodes().find(function (n) { return n.id === id; }) || currentNodes()[0];
  }

  function renderNodes() {
    var nodes = currentNodes();
    nodesEl.innerHTML = nodes.map(function (n, i) {
      var tagClass = n.bad ? ' is-bad' : (n.good ? ' is-good' : '');
      var active = n.id === activeId ? ' is-active' : '';
      return (
        '<button type="button" class="flow-node' + active + '" data-flow-node="' + n.id + '" aria-pressed="' + (n.id === activeId) + '">' +
          '<span class="flow-node-idx">0' + (i + 1) + '</span>' +
          '<span class="flow-node-title">' + n.title + '</span>' +
          '<span class="flow-node-tag' + tagClass + '">' + n.tag + '</span>' +
        '</button>'
      );
    }).join('');
  }

  function renderDetail() {
    var n = findNode(activeId);
    detailTitle.textContent = n.title;
    detailBody.textContent = n.detail;
    detailMeta.textContent = n.meta;
  }

  function drawEdges() {
    if (!edgesSvg || window.matchMedia('(max-width: 900px)').matches) {
      if (edgesSvg) edgesSvg.innerHTML = '';
      return;
    }
    var buttons = nodesEl.querySelectorAll('[data-flow-node]');
    if (buttons.length < 2) return;
    var canvas = board.querySelector('.flow-canvas');
    var cRect = canvas.getBoundingClientRect();
    var paths = [];
    for (var i = 0; i < buttons.length - 1; i++) {
      var a = buttons[i].getBoundingClientRect();
      var b = buttons[i + 1].getBoundingClientRect();
      var x1 = a.right - cRect.left;
      var y1 = a.top + a.height / 2 - cRect.top;
      var x2 = b.left - cRect.left;
      var y2 = b.top + b.height / 2 - cRect.top;
      var mid = (x1 + x2) / 2;
      paths.push(
        '<path d="M' + x1 + ' ' + y1 + ' C' + mid + ' ' + y1 + ', ' + mid + ' ' + y2 + ', ' + x2 + ' ' + y2 + '" />'
      );
    }
    edgesSvg.setAttribute('viewBox', '0 0 ' + cRect.width + ' ' + cRect.height);
    edgesSvg.innerHTML = paths.join('');
  }

  function setMode(next) {
    mode = next;
    board.setAttribute('data-mode', mode);
    activeId = currentNodes()[0].id;
    toggles.forEach(function (btn) {
      var on = btn.getAttribute('data-flow-mode') === mode;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    renderNodes();
    renderDetail();
    requestAnimationFrame(drawEdges);
  }

  board.addEventListener('click', function (e) {
    var modeBtn = e.target.closest('[data-flow-mode]');
    if (modeBtn) {
      setMode(modeBtn.getAttribute('data-flow-mode'));
      return;
    }
    var nodeBtn = e.target.closest('[data-flow-node]');
    if (nodeBtn) {
      activeId = nodeBtn.getAttribute('data-flow-node');
      renderNodes();
      renderDetail();
      requestAnimationFrame(drawEdges);
    }
  });

  window.addEventListener('resize', function () {
    requestAnimationFrame(drawEdges);
  });

  setMode('before');
})();
