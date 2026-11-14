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
  const projectNav = root.querySelector('.work-project-nav');
  const projectButtons = [...root.querySelectorAll('[data-work-index]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  let top = 104, holdRatio = .55;
  let measuredWidth = 0, measuredHeight = 0;
  let pinned = false, start = 0, step = 0, active = -1, frame = 0;
  let displayed = 0, lastTime = 0;
  let travel = 0, cardHeights = [];
  let reading = [], starts = [], scrollTravel = 0;
  const painted = [];
  const progressPainted = [];
  let edgePainted = '';
  let masked = null;

  function segment(position) {
    let index = 0;
    while (index < cards.length - 1 && position >= starts[index + 1]) index++;
    return {index, local: Math.max(0, position - (starts[index] || 0))};
  }

  function render(time, immediate = false) {
    frame = 0;
    if (!pinned) return;
    const target = Math.max(0, Math.min(scrollTravel / step, (scrollY - start) / step));
    // Wheel deltas arrive in discrete steps. Ease the visual position by elapsed
    // time so both mouse wheels and high-refresh trackpads blend continuously.
    const elapsed = Math.max(0, time - lastTime);
    displayed += (target - displayed) * (1 - Math.exp(-elapsed / 140));
    // Native touch scrolling already supplies smooth positions, including its
    // momentum. Adding wheel smoothing makes the cards lag behind the finger.
    if (immediate || coarse.matches || document.hidden || Math.abs(target - displayed) * step < .5) displayed = target;
    lastTime = time;
    const {index, local} = segment(displayed * step);
    // Read the entire card at its original type size before the next arrives.
    // Shorter viewports add native document scroll distance, not a nested pane.
    const hold = index < cards.length - 1 ? step * holdRatio : 0;
    const readOffset = Math.max(0, Math.min(reading[index], local - hold));
    const fraction = index < cards.length - 1
      ? Math.max(0, Math.min(1, (local - hold - reading[index]) / (step * (1 - holdRatio)))) : 0;
    const mix = fraction * fraction * (3 - 2 * fraction);
    const selected = Math.min(cards.length - 1, index + (mix >= .5 ? 1 : 0));
    // The rail shares the card clock: it shows reading progress, not autoplay.
    projectButtons.forEach((button, i) => {
      const length = reading[i] + (i < cards.length - 1 ? step : 0);
      const progress = length > 0
        ? Math.max(0, Math.min(1, (displayed * step - starts[i]) / length))
        : i <= index ? 1 : 0;
      const value = progress.toFixed(4);
      if (progressPainted[i] !== value) {
        button.style.setProperty('--project-progress', value);
        progressPainted[i] = value;
      }
    });
    // Let whole cards travel past one another, with a little breathing room.
    // Their bounds never overlap, so transparent glass needs no moving cut line.
    const incomingOffset = mix === 1 ? 0 : travel * (1 - mix) + 48 * Math.sin(Math.PI * mix);
    const fadeTop = Math.min(32, readOffset + travel * mix, incomingOffset);
    const bottom = mix > 0 ? incomingOffset + cardHeights[index + 1] * (.9 + .1 * mix)
      : cardHeights[index] - readOffset;
    const fadeBottom = Math.min(24, Math.max(0, bottom - travel));
    const edges = `${fadeTop.toFixed(2)}px ${fadeBottom.toFixed(2)}px`;
    if (edges !== edgePainted) {
      list.style.setProperty('--work-fade-top', `${fadeTop.toFixed(2)}px`);
      list.style.setProperty('--work-fade-bottom', `${fadeBottom.toFixed(2)}px`);
      edgePainted = edges;
    }
    // A mask creates a backdrop root. Remove it at rest so the glass can still
    // blur the wave behind the list, including at fractional scroll positions.
    const crossingEdge = fadeTop > .5;
    if (masked !== crossingEdge) {
      list.style.maskImage = crossingEdge ? '' : 'none';
      masked = crossingEdge;
    }
    let geometryChanged = false;
    cards.forEach((card, i) => {
      const outgoing = i === index;
      const incoming = i === index + 1;
      const offset = incoming ? incomingOffset : outgoing ? -readOffset - travel * mix : 0;
      const scale = outgoing ? 1 - .14 * mix : incoming ? .9 + .1 * mix : 1;
      const tilt = outgoing ? -6 * mix : incoming ? 8 * (1 - mix) : 0;
      const opacity = outgoing ? 1 - .65 * mix : 1;
      const visibility = (outgoing && mix < 1) || (incoming && mix > 0) ? 'visible' : 'hidden';
      const transform = `translate3d(0,${offset}px,0) perspective(1600px) rotateX(${tilt}deg) scale(${scale})`;
      const last = painted[i];
      if (last?.opacity !== opacity) card.style.opacity = String(opacity);
      if (last?.transform !== transform) { card.style.transform = transform; geometryChanged = true; }
      if (last?.visibility !== visibility) { card.style.visibility = visibility; geometryChanged = true; }
      painted[i] = {opacity, transform, visibility};
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
      projectButtons.forEach((button, i) => {
        if (i === active) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      if (focusedCard && focusedCard !== cards[active]) {
        cards[active].querySelector('.work-title-link').focus({preventScroll: true});
      }
    }
    // The reveal gate may have measured before this frame moved the cards. A
    // transform within its approach margin need not produce another IO entry.
    if (geometryChanged) root.dispatchEvent(new Event('portfolio:workframe', {bubbles:true}));
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
    // Opening a touch keyboard must not dismantle the pinned stage beneath an
    // active field. Width/orientation and motion-preference changes still apply.
    const editing = document.activeElement?.matches?.('input,textarea,select,[contenteditable="true"]')
      && root.contains(document.activeElement);
    if (pinned && coarse.matches && editing && innerWidth === measuredWidth
      && innerHeight < measuredHeight * .75 && !reduced.matches
      && document.documentElement.dataset.motion !== 'off') return;
    cancelAnimationFrame(frame);
    frame = 0;
    const wasPinned = pinned;
    const retained = Math.max(0, active);
    const position = step ? Math.max(0, Math.min(scrollTravel, scrollY - start)) : 0;
    const retainedSegment = segment(position);
    const oldLength = reading[retainedSegment.index] + (retainedSegment.index < cards.length - 1 ? step : 0);
    const retainedFraction = oldLength > 0 ? retainedSegment.local / oldLength : 0;
    const wasInStage = wasPinned && scrollY >= start && scrollY <= start + scrollTravel;
    // Share the sequence across sizes. Short landscape windows and reduced
    // motion retain the complete natural flow instead of a cramped pin.
    const compact = innerWidth < 1024;
    top = innerWidth < 768 ? 88 : 104;
    holdRatio = compact ? .2 : .55;
    const enabled = innerWidth >= 320 && innerHeight >= 400 && !reduced.matches && document.documentElement.dataset.motion !== 'off';
    root.style.setProperty('--work-sticky-top', `${top}px`);
    root.style.setProperty('--work-viewport-height', `${Math.max(1, innerHeight - top - 24)}px`);
    root.classList.toggle('is-work-pinned', enabled);
    controls.hidden = !enabled;
    if (projectNav) projectNav.hidden = !enabled;
    // Flex bounds the stage; overflowing card content gets its own scroll time.
    const height = stage.offsetHeight;
    pinned = enabled && height > 0;
    root.classList.toggle('is-work-pinned', pinned);
    controls.hidden = !pinned;
    if (projectNav) projectNav.hidden = !pinned;
    // Compact CSS caps the stage with 100svh. Derive the runway from that stable
    // size so a mobile browser toolbar hiding doesn't change the scroll clock.
    const viewportHeight = compact && pinned ? Math.min(innerHeight, height + top + 24) : innerHeight;
    step = Math.round(viewportHeight * .85);
    measuredWidth = innerWidth;
    measuredHeight = viewportHeight;
    start = root.getBoundingClientRect().top + scrollY - top;
    if (pinned) {
      travel = list.offsetHeight;
      cardHeights = cards.map(card => card.offsetHeight);
      reading = cardHeights.map(height => Math.max(0, height - travel));
      scrollTravel = 0;
      starts = cards.map((_, i) => {
        const offset = scrollTravel;
        scrollTravel += reading[i] + (i < cards.length - 1 ? step : 0);
        return offset;
      });
      root.style.height = `${height + scrollTravel}px`;
      cards.forEach(card => {card.style.willChange = 'transform, opacity';});
      // The browser pins the entire background in the same scroll transaction
      // as the stage. JavaScript only supplies geometry when layout changes.
      atmosphereTrack?.style.setProperty('--work-pin-distance', `${scrollTravel}px`);
      atmosphereTrack?.style.setProperty('--work-atmosphere-top', `${-start}px`);
      atmosphereTrack?.classList.toggle('is-work-pinned', true);
      if (wasInStage) {
        const index = retainedSegment.index;
        const length = reading[index] + (index < cards.length - 1 ? step : 0);
        const restoreTop = start + starts[index] + retainedFraction * length;
        // A no-op scrollTo can stop native touch momentum during toolbar resize.
        if (Math.abs(restoreTop - scrollY) > .5) window.scrollTo({top: restoreTop, behavior: 'instant'});
      }
      render(performance.now(), true);
    } else {
      root.style.removeProperty('height');
      root.style.removeProperty('--work-viewport-height');
      root.style.removeProperty('--work-sticky-top');
      atmosphereTrack?.classList.toggle('is-work-pinned', false);
      atmosphereTrack?.style.removeProperty('--work-pin-distance');
      atmosphereTrack?.style.removeProperty('--work-atmosphere-top');
      painted.length = 0;
      progressPainted.length = 0;
      edgePainted = '';
      masked = null;
      list.style.removeProperty('mask-image');
      list.style.removeProperty('--work-fade-top');
      list.style.removeProperty('--work-fade-bottom');
      projectButtons.forEach(button => {
        button.style.removeProperty('--project-progress');
        button.removeAttribute('aria-current');
      });
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
    if (pinned) window.scrollTo({top: start + starts[Math.max(0, Math.min(cards.length - 1, index))], behavior: 'smooth'});
  }
  previous.addEventListener('click', () => go(active - 1));
  next.addEventListener('click', () => go(active + 1));
  projectButtons.forEach((button, index) => button.addEventListener('click', () => go(index)));
  projectNav?.addEventListener('keydown', event => {
    const index = projectButtons.indexOf(event.target);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const destination = event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1
      : Math.max(0, Math.min(cards.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
    projectButtons[destination].focus({preventScroll: true});
    go(destination);
  });
  root.addEventListener('focusin', event => {
    if (!pinned) return;
    const index = cards.findIndex(card => card.contains(event.target));
    if (index < 0) return;
    const viewport = list.getBoundingClientRect(), target = event.target.getBoundingClientRect();
    const {index: current, local} = segment(displayed * step);
    const hold = index < cards.length - 1 ? step * holdRatio : 0;
    const pan = current === index ? Math.max(0, Math.min(reading[index], local - hold)) : 0;
    const delta = target.top < viewport.top ? target.top - viewport.top
      : target.bottom > viewport.bottom ? target.bottom - viewport.bottom : 0;
    if (delta) {
      const offset = Math.max(0, Math.min(reading[index], pan + delta));
      window.scrollTo({top:start + starts[index] + hold + offset, behavior:'instant'});
      render(performance.now(), true);
    }
  });
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
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    cards.forEach(card => observer.observe(card));
  });
}
