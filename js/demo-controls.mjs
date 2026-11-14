import { animateFeedback, revealFeedback, sequenceFeedback } from './interaction-motion.mjs?v=ccec8d8cb84c';
import { motionPaused } from './kinetics.mjs?v=2178cec3bf8c';

function buttonFrom(node) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = node.className;
  button.append(...node.childNodes);
  node.replaceWith(button);
  return button;
}

function resultFor(root) {
  let status = root.querySelector('.demo-result');
  if (!status) {
    status = document.createElement('p');
    status.className = 'demo-result';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-atomic', 'true');
    (root.querySelector('.pb-ex-body,.dev-main,.dev-wiz-body') || root).append(status);
  }
  return status;
}

function feedback(root, text) {
  const status = resultFor(root);
  status.textContent = text;
  animateFeedback(status, [{ opacity: .45, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], 280);
}

function goTo(id) {
  const destination = document.getElementById(id);
  if (!destination) return;
  const heading = destination.querySelector('h2,h3');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  destination.scrollIntoView({ block: 'start', behavior: motionPaused() ? 'instant' : 'smooth' });
}

export function enhanceDemoControls(root) {
  // Mount live regions before interaction so screen readers observe updates.
  if (root.matches('.pb-ex-shell,.growth-overview,.dev-history-ui')) resultFor(root);
  if (root.matches('.pb-ex-shell,.growth-overview')) enhanceGrowth(root);
  if (root.matches('.dev-history-ui')) enhanceDeveloper(root);
}

function enhanceGrowth(root) {
  const chapter = root.closest('.growth-pattern-chapter')?.id;
  for (const group of root.querySelectorAll('.pb-ex-seg,.pb-ex-days')) {
    const exclusive = group.matches('.pb-ex-seg');
    group.removeAttribute('aria-hidden');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', exclusive ? 'Audience' : 'Days of week');
    const buttons = [...group.children].map(buttonFrom);
    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('is-on')));
      button.addEventListener('click', () => {
        const selected = button.getAttribute('aria-pressed') !== 'true';
        if (exclusive) buttons.forEach(peer => {
          peer.classList.toggle('is-on', peer === button);
          peer.setAttribute('aria-pressed', String(peer === button));
        });
        else {
          button.classList.toggle('is-on', selected);
          button.setAttribute('aria-pressed', String(selected));
        }
        root.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  }
  for (const slider of root.querySelectorAll('.pb-ex-slider')) {
    const initial = parseFloat(slider.querySelector('i')?.style.width) || 50;
    slider.removeAttribute('aria-hidden');
    const input = document.createElement('input');
    input.type = 'range'; input.min = '5'; input.max = '25'; input.step = '1';
    input.value = String(5 + initial / 5);
    input.setAttribute('aria-label', 'Discount depth');
    input.className = 'demo-range';
    const output = document.createElement('output');
    output.className = 'demo-range-value';
    const sync = () => {
      output.textContent = `${input.value}%`;
      input.setAttribute('aria-valuetext', `${input.value}% discount`);
      if (chapter === 'pattern-analytics') {
        const action = root.querySelector('.pb-ex-actions button');
        if (action) action.textContent = `Apply ${input.value}% on weekdays`;
      }
    };
    input.addEventListener('input', sync);
    slider.replaceChildren(input, output);
    sync();
  }
  for (const calendar of root.querySelectorAll('.pb-ex-cal')) {
    calendar.removeAttribute('aria-hidden');
    for (const day of calendar.querySelectorAll('.pb-ex-day:not(.is-empty)')) {
      const month = day.closest('.pb-ex-month').querySelector('.pb-ex-month-title').textContent;
      const button = buttonFrom(day);
      button.setAttribute('aria-label', `Blackout ${button.textContent} ${month}`);
      button.setAttribute('aria-pressed', String(button.classList.contains('is-selected')));
      button.addEventListener('click', () => {
        const selected = button.classList.toggle('is-selected');
        button.setAttribute('aria-pressed', String(selected));
      });
    }
    for (const month of calendar.querySelectorAll('.pb-ex-month')) {
      const days = [...month.querySelectorAll('button')];
      days.forEach((day, i) => { day.tabIndex = i === 0 ? 0 : -1; });
      month.addEventListener('keydown', event => {
        const index = days.indexOf(event.target);
        if (index < 0) return;
        const destinations = { ArrowLeft: index - 1, ArrowRight: index + 1, ArrowUp: index - 7, ArrowDown: index + 7, Home: 0, End: days.length - 1 };
        if (!Object.hasOwn(destinations, event.key)) return;
        event.preventDefault();
        const next = Math.max(0, Math.min(days.length - 1, destinations[event.key]));
        days.forEach((day, i) => { day.tabIndex = i === next ? 0 : -1; });
        days[next].focus({ preventScroll: true });
      });
    }
  }
  const reasons = root.querySelector('.pb-ex-reasons');
  if (reasons) {
    reasons.removeAttribute('aria-hidden');
    reasons.setAttribute('role', 'group');
    reasons.setAttribute('aria-label', 'Reason for leaving');
    reasons.querySelectorAll('input').forEach(input => {
      input.disabled = false;
      input.addEventListener('change', () => reasons.querySelectorAll('label').forEach(label => {
        label.classList.toggle('is-on', label.querySelector('input').checked);
      }));
    });
  }
  const faq = root.querySelector('.pb-ex-faq');
  if (faq) {
    const details = document.createElement('details');
    details.className = faq.className; details.open = true;
    const summary = document.createElement('summary');
    summary.textContent = faq.querySelector('strong').textContent;
    const answer = faq.querySelector('span');
    details.append(summary, answer); faq.replaceWith(details);
    details.addEventListener('toggle', () => { if (details.open) revealFeedback(answer); });
  }

  let reviewed = false, paused = false;
  for (const node of root.querySelectorAll('span.pb-ex-btn,span.hero-product-btn,span.pb-ex-link')) {
    const label = node.textContent.trim();
    const button = buttonFrom(node);
    button.addEventListener('click', () => {
      if (label === 'Back') return goTo('pattern-confidence');
      if (label === 'Continue to activate' || label === 'Activate') return goTo('pattern-activate');
      if (label === 'Manage') return goTo('pattern-settings');
      if (label === 'Compare') {
        const cards = [...root.querySelectorAll('.hero-product-card')];
        if (cards.length > 1) {
          sequenceFeedback(cards.map(card => card.querySelector('.hero-product-card-stats')));
          feedback(root, cards.map(card => `${card.querySelector('h5').textContent}: ${card.querySelector('.meta').textContent}`).join(' · '));
        } else goTo('pattern-discover');
        return;
      }
      if (label === 'Details') {
        const card = button.closest('.hero-product-card');
        feedback(root, `${card.querySelector('h5').textContent}: ${card.querySelector('.desc').textContent}`);
        return;
      }
      const depth = root.querySelector('input[type=range]')?.value || '15';
      const audience = root.querySelector('.pb-ex-seg .is-on')?.textContent || 'App users';
      if (label === 'Review & go live') {
        if (!reviewed) {
          feedback(root, `Review: ${depth}% discount for ${audience.toLowerCase()}, 15 Aug–30 Sep 2026. This is a local demo.`);
          button.textContent = 'Confirm activation'; reviewed = true;
        } else {
          feedback(root, `Activation preview complete: ${depth}% for ${audience.toLowerCase()}. No live program was changed.`);
          button.textContent = label; reviewed = false;
        }
      } else if (label === 'Pause program') {
        paused = !paused; button.textContent = paused ? 'Resume program' : label;
        button.setAttribute('aria-pressed', String(paused));
        feedback(root, paused ? 'Program paused in this demo. Resume whenever you are ready.' : 'Program resumed in this demo. Your settings are preserved.');
      } else if (label === 'Save changes') {
        const days = [...root.querySelectorAll('.pb-ex-days .is-on')].map(day => day.textContent).join(', ') || 'No weekdays selected';
        const blackouts = root.querySelectorAll('.pb-ex-day.is-selected').length;
        feedback(root, `Demo settings saved: ${depth}% · ${audience} · ${days} · ${blackouts} blackout dates. No live program was changed.`);
      } else if (label.startsWith('Apply')) {
        feedback(root, `${depth}% weekday discount applied in this demo. Historical performance above stays unchanged.`);
      } else if (label === 'Confirm deactivate' || label.startsWith('No thanks')) {
        const reason = root.querySelector('.pb-ex-reasons input:checked')?.closest('label').textContent.trim();
        feedback(root, `Deactivation preview complete${reason ? `: ${reason.toLowerCase()}` : ''}. No live program was changed.`);
      } else if (label === 'Keep program') {
        feedback(root, 'Promotions stays active in this demo. Your settings are unchanged.');
      } else if (label === 'Switch to Boost Rank') {
        feedback(root, 'Switch preview complete: Boost Rank, Singapore, 30 days. No live program was changed.');
      }
    });
    if (label === 'Review & go live') root.addEventListener('input', () => {
      reviewed = false; button.textContent = label;
      const result = root.querySelector('.demo-result');
      if (result) result.textContent = 'Settings changed. Review the updated configuration before confirming.';
    });
  }
}

function enhanceDeveloper(root) {
  // An image role hides interactive descendants from assistive technology.
  root.setAttribute('role', 'group');
  for (const node of root.querySelectorAll('.dev-feat-what')) {
    const button = buttonFrom(node);
    const card = button.closest('.dev-feat');
    const content = [...card.querySelectorAll(':scope > p,:scope > ul')];
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', `About ${card.querySelector('.dev-feat-title').textContent.trim()}`);
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      content.forEach(part => { part.hidden = !open; });
      if (open) sequenceFeedback(content);
    });
  }
  const search = root.querySelector('.dev-search-inline');
  if (search) {
    const input = document.createElement('input');
    input.type = 'search'; input.className = 'dev-search-inline demo-search';
    input.placeholder = search.textContent; input.setAttribute('aria-label', search.textContent);
    search.replaceWith(input);
    const rows = [...root.querySelectorAll('tbody tr')];
    const count = root.querySelector('.dev-table-foot');
    const update = () => {
      const term = input.value.trim().toLowerCase();
      const visible = rows.filter(row => {
        const matches = row.querySelector('td').textContent.toLowerCase().includes(term);
        row.hidden = !matches; return matches;
      });
      count.textContent = `${visible.length} of ${rows.length} sample components${visible.length ? '' : ' · Try another name'}`;
      sequenceFeedback(visible);
    };
    count.setAttribute('role', 'status'); update();
    input.addEventListener('input', update);
  }
  const strategy = root.querySelector('.dev-seg');
  if (strategy) {
    const buttons = [...strategy.children].map(buttonFrom);
    const canary = root.querySelector('.dev-canary');
    buttons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => {
        buttons.forEach(peer => {
          peer.classList.toggle('is-on', peer === button);
          peer.setAttribute('aria-pressed', String(peer === button));
        });
        canary.hidden = index !== 0;
        if (!index) sequenceFeedback(canary.children);
        feedback(root, index ? 'Rolling update replaces the existing deployment gradually.' : 'Canary rollout: 10%, then 20%, then 30%.');
      });
    });
  }
  for (const node of root.querySelectorAll('.dev-wiz-foot .dev-btn')) {
    const button = buttonFrom(node);
    button.addEventListener('click', () => {
      // The complete editable flow remains the single source of configuration.
      goTo('concept');
    });
    button.setAttribute('aria-label', 'Try this step in the deployment walkthrough');
  }
}
