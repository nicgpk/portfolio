const track = document.querySelector('.film-track');

if (track) {
  const cards = [...track.querySelectorAll('.film-card')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const maxScroll = () => track.scrollWidth - track.clientWidth;
  const motionAllowed = () => !reducedMotion.matches && root.dataset.motion !== 'off';
  const stops = () => cards.map(card => Math.min(card.offsetLeft - cards[0].offsetLeft, maxScroll()));
  const nextStop = () => stops().find(left => left > track.scrollLeft + 2);

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
        ? nextStop()
        : stops().findLast(left => left < track.scrollLeft - 2);
    }

    if (target === undefined) return;
    track.scrollTo({left: target, behavior: motionAllowed() ? 'smooth' : 'instant'});
  });

  const playback = document.querySelector('.film-playback');
  if (playback) {
    let visible = false;
    let paused = false;
    let hovered = matchMedia('(hover: hover)').matches && track.matches(':hover');
    let timer;

    function schedule() {
      clearTimeout(timer);
      if (!visible || paused || hovered || document.activeElement === track || document.hidden || playback.hidden) return;

      timer = setTimeout(() => {
        const next = nextStop();
        track.scrollTo({left: next ?? 0, behavior: next === undefined ? 'instant' : 'smooth'});
        schedule();
      }, 4000);
    }

    function updatePlayback() {
      const unavailable = !motionAllowed() || maxScroll() <= 2;
      if (unavailable && document.activeElement === playback) track.focus({preventScroll: true});
      playback.hidden = unavailable;
      schedule();
    }

    playback.addEventListener('click', () => {
      paused = !paused;
      playback.textContent = paused ? 'Resume reel' : 'Pause reel';
      schedule();
    });
    track.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      hovered = true;
      schedule();
    });
    track.addEventListener('pointerleave', event => {
      if (event.pointerType === 'touch') return;
      hovered = false;
      schedule();
    });
    // Keep a full interval free for swiping, trackpad scrolling, and reading a poster.
    for (const event of ['focus', 'blur', 'pointerdown', 'scroll']) track.addEventListener(event, schedule);
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', updatePlayback);
    new MutationObserver(updatePlayback).observe(root, {attributeFilter: ['data-motion']});
    new ResizeObserver(updatePlayback).observe(track);
    new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= .5;
      schedule();
    }, {threshold: .5}).observe(track);

    updatePlayback();
  }
}
