const carousel = document.querySelector('.film-carousel');

if (carousel) {
  const track = carousel.querySelector('.film-track');
  const cards = [...track.querySelectorAll('.film-card')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // One repeated set keeps the join identical, without repeating accessible slides.
  const copies = cards.map(card => {
    const copy = card.cloneNode(true);
    copy.dataset.filmCopy = '';
    copy.setAttribute('aria-hidden', 'true');
    copy.removeAttribute('aria-label');
    copy.removeAttribute('role');
    copy.removeAttribute('aria-roledescription');
    copy.inert = true;
    copy.querySelector('img').alt = '';
    track.append(copy);
    return copy;
  });

  let visible = false;
  let hovered = false;
  let paused = false;
  let looping = false;
  let running = false;
  let cycleWidth = 0;
  let offset = 0;
  let lastTime = 0;
  let frame = 0;

  const offsets = () => cards.map(card => card.offsetLeft - cards[0].offsetLeft);
  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const motionAllowed = () => !reducedMotion.matches && document.documentElement.dataset.motion !== 'off';
  const tick = time => {
    if (lastTime) offset = (offset + Math.min(time - lastTime, 64) * .02) % cycleWidth;
    lastTime = time;
    track.scrollLeft = offset;
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    const shouldRun = looping && cycleWidth > 0 && visible && !document.hidden && !paused && !hovered && document.activeElement !== track;
    if (shouldRun !== running) {
      running = shouldRun;
      cancelAnimationFrame(frame);
      if (running) {
        offset = track.scrollLeft % cycleWidth;
        lastTime = 0;
        frame = requestAnimationFrame(tick);
      }
    }
  };
  const measure = () => {
    cycleWidth = looping ? copies[0].offsetLeft - cards[0].offsetLeft : 0;
    offset = cycleWidth ? track.scrollLeft % cycleWidth : track.scrollLeft;
    sync();
  };
  const setMotion = () => {
    const allowed = motionAllowed();
    // Preserve the current film when switching to the finite, manual shelf.
    const left = cycleWidth ? track.scrollLeft % cycleWidth : track.scrollLeft;
    looping = allowed;
    copies.forEach(copy => {copy.hidden = !allowed;});
    carousel.classList.toggle('is-looping', looping);
    track.scrollLeft = left;
    measure();
  };
  const pause = () => {paused = true; sync();};
  const scrollTo = left => track.scrollTo({left, behavior: motionAllowed() ? 'smooth' : 'instant'});
  const move = direction => {
    pause();
    if (looping) {
      let left = track.scrollLeft % cycleWidth;
      // Use the identical second set to move backwards through the join.
      if (direction < 0 && left <= 2) left += cycleWidth;
      track.scrollLeft = left;
      const stops = [...offsets(), ...offsets().map(stop => stop + cycleWidth)];
      const target = direction > 0
        ? stops.find(stop => stop > left + 2)
        : stops.findLast(stop => stop < left - 2);
      if (target !== undefined) scrollTo(target);
    } else {
      const stops = [...new Set(offsets().map(left => Math.min(left, maxScroll())))];
      const target = direction > 0
        ? stops.find(left => left > track.scrollLeft + 2)
        : stops.findLast(left => left < track.scrollLeft - 2);
      if (target !== undefined) scrollTo(target);
    }
  };
  track.addEventListener('pointerenter', event => {if (event.pointerType === 'mouse') {hovered = true; sync();}});
  track.addEventListener('pointerleave', () => {hovered = false; sync();});
  track.addEventListener('focus', sync);
  track.addEventListener('blur', sync);
  track.addEventListener('pointerdown', pause, {passive: true});
  track.addEventListener('wheel', event => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) pause();
  }, {passive: true});
  track.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    pause();
    if (event.key === 'Home') scrollTo(0);
    else if (event.key === 'End') scrollTo(looping ? offsets().at(-1) : maxScroll());
    else move(event.key === 'ArrowRight' ? 1 : -1);
  });
  new ResizeObserver(measure).observe(track);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    // Decode the whole reel before later films enter, without loading it at the hero.
    if (visible) track.querySelectorAll('img').forEach(img => {img.loading = 'eager';});
    sync();
  }).observe(track);
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('portfolio:motionchange', setMotion);
  reducedMotion.addEventListener('change', setMotion);
  // Also support motion preference changes before the shared module is available.
  new MutationObserver(setMotion).observe(document.documentElement, {attributes: true, attributeFilter: ['data-motion']});
  carousel.classList.add('is-enhanced');
  setMotion();
}
