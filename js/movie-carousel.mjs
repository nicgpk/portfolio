const track = document.querySelector('.film-track');
const reelSpeed = 30; // Pixels per second.

if (track) {
  const cards = [...track.querySelectorAll('.film-card')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const maxScroll = () => track.scrollWidth - track.clientWidth;
  const motionAllowed = () => !reducedMotion.matches && root.dataset.motion !== 'off';
  const copies = [];
  const stops = () => [...cards, ...copies].map(card => Math.min(card.offsetLeft - cards[0].offsetLeft, maxScroll()));
  let loopWidth = 0;
  let visible = false;
  let hovered = matchMedia('(hover: hover)').matches && track.matches(':hover');
  let touching = false;
  let interactionTimer;
  let frame;
  let previousTime;
  let playhead;
  let lastScrollLeft = track.scrollLeft;

  function advance(time) {
    if (previousTime !== undefined) {
      if (track.scrollLeft !== lastScrollLeft) playhead = Math.max(0, track.scrollLeft);
      const elapsed = Math.min(time - previousTime, 50);
      playhead = (playhead + elapsed * reelSpeed / 1000) % loopWidth;
      track.scrollLeft = playhead;
      // Keep the fractional playhead when the browser rounds scrollLeft to whole pixels.
      lastScrollLeft = track.scrollLeft;
    }
    previousTime = time;
    frame = requestAnimationFrame(advance);
  }

  function syncPlayback() {
    const canPlay = loopWidth > 0 && visible && !document.hidden && !hovered && !touching
      && !interactionTimer && !track.matches(':focus-visible');
    if (canPlay) {
      if (frame !== undefined) return;
      playhead = Math.max(0, track.scrollLeft);
      lastScrollLeft = track.scrollLeft;
      frame = requestAnimationFrame(advance);
    } else if (frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
      previousTime = undefined;
    }
  }

  function updateLoop() {
    if (motionAllowed() && copies.length === 0 && track.clientWidth > 0 && maxScroll() > 2) {
      for (const card of cards) {
        const copy = card.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.inert = true;
        copies.push(copy);
      }
      track.style.scrollSnapType = 'none';
      track.style.scrollbarWidth = 'none';
      track.append(...copies);
    } else if (!motionAllowed() && copies.length) {
      const position = loopWidth ? Math.max(0, track.scrollLeft) % loopWidth : 0;
      for (const copy of copies.splice(0)) copy.remove();
      track.scrollLeft = Math.min(position, maxScroll());
      track.style.scrollSnapType = '';
      track.style.scrollbarWidth = '';
    }

    // The first copy starts exactly one sequence away, including the gap at the seam.
    loopWidth = copies.length
      ? copies[0].getBoundingClientRect().left - cards[0].getBoundingClientRect().left
      : 0;
    syncPlayback();
  }

  function postponePlayback() {
    clearTimeout(interactionTimer);
    interactionTimer = setTimeout(() => {
      interactionTimer = undefined;
      syncPlayback();
    }, 900);
    syncPlayback();
  }

  track.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    let target;
    if (event.key === 'Home') {
      target = 0;
    } else if (event.key === 'End') {
      target = maxScroll();
    } else {
      target = event.key === 'ArrowRight'
        ? stops().find(left => left > track.scrollLeft + 2)
        : stops().findLast(left => left < track.scrollLeft - 2);
    }

    if (target === undefined) return;
    if (loopWidth) postponePlayback();
    track.scrollTo({left: target, behavior: motionAllowed() ? 'smooth' : 'instant'});
  });

  track.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    hovered = true;
    syncPlayback();
  });
  track.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch') return;
    hovered = false;
    syncPlayback();
  });
  track.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    touching = true;
    syncPlayback();
  });
  for (const type of ['pointerup', 'pointercancel']) track.addEventListener(type, event => {
    if (event.pointerType !== 'touch') return;
    touching = false;
    if (loopWidth) postponePlayback();
  });
  track.addEventListener('scroll', () => {
    if (loopWidth && track.scrollLeft !== lastScrollLeft) postponePlayback();
  });
  track.addEventListener('focus', syncPlayback);
  track.addEventListener('blur', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', updateLoop);
  new MutationObserver(updateLoop).observe(root, {attributeFilter: ['data-motion']});
  new ResizeObserver(updateLoop).observe(track);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  }).observe(track);

  updateLoop();
}
