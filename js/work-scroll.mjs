// A native scroll runway pins the work stage; no wheel or touch interception.
const root = document.querySelector('#work');

if (root) {
  const stage = root.querySelector('.work-scroll-stage');
  const list = root.querySelector('.work-feature-list');
  const atmosphereTrack = root.closest('.hero-work-surface')?.querySelector('.work-atmosphere-track');
  const cards = [...root.querySelectorAll('.work-feature')];
  const controls = root.querySelector('.work-scroll-controls');
  const previous = controls.querySelector('[data-work-previous]');
  const next = controls.querySelector('[data-work-next]');
  const status = controls.querySelector('.work-scroll-position');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1024px) and (min-height: 900px)');
  const top = 104;
  let pinned = false, start = 0, step = 0, active = -1, frame = 0;
  let displayed = 0, lastTime = 0;
  let travel = 0, cardHeights = [];
  const painted = [];

  function render(time, immediate = false) {
    frame = 0;
    if (!pinned) return;
    const target = Math.max(0, Math.min(cards.length - 1, (scrollY - start) / step));
    // Wheel deltas arrive in discrete steps. Ease the visual position by elapsed
    // time so both mouse wheels and high-refresh trackpads blend continuously.
    const elapsed = Math.max(0, time - lastTime);
    displayed += (target - displayed) * (1 - Math.exp(-elapsed / 140));
    if (immediate || document.hidden || Math.abs(target - displayed) * step < .5) displayed = target;
    lastTime = time;
    const progress = displayed;
    const index = Math.min(cards.length - 1, Math.floor(progress));
    // Hold for reading, then slide the next project over a receding card.
    const fraction = Math.max(0, Math.min(1, (progress - index - .55) / .45));
    const mix = fraction * fraction * (3 - 2 * fraction);
    const selected = Math.min(cards.length - 1, index + (mix >= .5 ? 1 : 0));
    cards.forEach((card, i) => {
      const outgoing = i === index;
      const incoming = i === index + 1;
      const offset = incoming ? travel * (1 - mix) : 0;
      const scale = outgoing ? 1 - .04 * mix : 1;
      const opacity = outgoing ? 1 - .3 * mix : 1;
      const visibility = (outgoing && mix < 1) || (incoming && mix > 0) ? 'visible' : 'hidden';
      // Glass stays transparent: trim the outgoing card at the incoming edge
      // instead of allowing two sets of text to show through each other.
      const cut = outgoing ? Math.max(0, 100 - travel * (1 - mix) / (cardHeights[i] * scale) * 100) : 0;
      const transform = `translate3d(0,${offset}px,0) scale(${scale})`;
      const clip = cut > 0 ? `inset(0 0 ${cut}% 0)` : 'none';
      const last = painted[i];
      if (last?.opacity !== opacity) card.style.opacity = String(opacity);
      if (last?.transform !== transform) card.style.transform = transform;
      if (last?.clip !== clip) card.style.clipPath = clip;
      if (last?.visibility !== visibility) card.style.visibility = visibility;
      painted[i] = {opacity, transform, clip, visibility};
    });
    if (selected !== active) {
      const focusedCard = cards.find(card => card.contains(document.activeElement));
      cards.forEach((card, i) => {
        card.inert = i !== selected;
        card.setAttribute('aria-hidden', String(i !== selected));
      });
      active = selected;
      status.textContent = `${active + 1} of ${cards.length}`;
      previous.disabled = active === 0;
      next.disabled = active === cards.length - 1;
      if (focusedCard && focusedCard !== cards[active]) {
        cards[active].querySelector('.work-title-link').focus({preventScroll: true});
      }
    }
    // Stop completely once settled; unchanged reading holds do not rewrite DOM.
    if (displayed !== target) frame = requestAnimationFrame(render);
  }

  function schedule() {
    if (pinned && !document.hidden && !frame) {
      lastTime = performance.now();
      frame = requestAnimationFrame(render);
    }
  }

  function measure() {
    cancelAnimationFrame(frame);
    frame = 0;
    const wasPinned = pinned;
    const retained = Math.max(0, active);
    const retainedProgress = step ? (scrollY - start) / step : 0;
    const wasInStage = wasPinned && scrollY >= start && scrollY <= start + step * (cards.length - 1);
    const enabled = desktop.matches && !reduced.matches && document.documentElement.dataset.motion !== 'off';
    root.classList.toggle('is-work-pinned', enabled);
    controls.hidden = !enabled;
    // Grid overlap measures the tallest complete card, never cropping a demo.
    const height = stage.offsetHeight;
    pinned = enabled && height <= innerHeight - top - 24;
    root.classList.toggle('is-work-pinned', pinned);
    controls.hidden = !pinned;
    step = Math.round(innerHeight * .85);
    start = root.getBoundingClientRect().top + scrollY - top;
    if (pinned) {
      travel = list.offsetHeight;
      cardHeights = cards.map(card => card.offsetHeight);
      root.style.height = `${height + step * (cards.length - 1)}px`;
      cards.forEach(card => {card.style.willChange = 'transform, opacity';});
      // The browser pins the entire background in the same scroll transaction
      // as the stage. JavaScript only supplies geometry when layout changes.
      atmosphereTrack?.style.setProperty('--work-pin-distance', `${step * (cards.length - 1)}px`);
      atmosphereTrack?.style.setProperty('--work-atmosphere-top', `${-start}px`);
      atmosphereTrack?.classList.toggle('is-work-pinned', true);
      if (wasInStage) window.scrollTo({top: start + retainedProgress * step, behavior: 'instant'});
      render(performance.now(), true);
    } else {
      root.style.removeProperty('height');
      atmosphereTrack?.classList.toggle('is-work-pinned', false);
      atmosphereTrack?.style.removeProperty('--work-pin-distance');
      atmosphereTrack?.style.removeProperty('--work-atmosphere-top');
      painted.length = 0;
      cards.forEach(card => {
        for (const property of ['opacity', 'transform', 'clip-path', 'visibility', 'will-change']) card.style.removeProperty(property);
        card.inert = false;
        card.removeAttribute('aria-hidden');
      });
      active = -1;
      if (wasInStage) cards[retained].scrollIntoView({block: 'start', behavior: 'instant'});
    }
  }

  function go(index) {
    if (pinned) window.scrollTo({top: start + Math.max(0, Math.min(cards.length - 1, index)) * step, behavior: 'smooth'});
  }
  previous.addEventListener('click', () => go(active - 1));
  next.addEventListener('click', () => go(active + 1));
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', measure, {passive: true});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {cancelAnimationFrame(frame); frame = 0;}
    else schedule();
  });
  reduced.addEventListener('change', measure);
  document.addEventListener('portfolio:motionchange', measure);
  new MutationObserver(measure).observe(document.documentElement, {attributes: true, attributeFilter: ['data-motion']});
  // Wait for final text metrics to avoid shifting the document during font load.
  document.fonts.ready.then(() => {
    measure();
    new ResizeObserver(measure).observe(stage);
  });
}
