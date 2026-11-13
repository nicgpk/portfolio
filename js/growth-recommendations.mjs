// Keep the illustrative discovery cards readable without hiding any programs.
const track = document.querySelector('#growth-recommendations');
if (track) {
  const cards = [...track.children];
  const nav = track.nextElementSibling;
  const previous = nav.querySelector('[data-previous]');
  const next = nav.querySelector('[data-next]');
  const position = nav.querySelector('[data-position]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let frame;

  cards.forEach((card, index) => {
    card.setAttribute('role', 'group');
    card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', `${index + 1} of ${cards.length}`);
  });

  function update() {
    const origin = cards[0].getBoundingClientRect().left;
    const offsets = cards.map(card => card.getBoundingClientRect().left - origin);
    current = offsets.reduce((best, offset, index) =>
      Math.abs(offset - track.scrollLeft) < Math.abs(offsets[best] - track.scrollLeft) ? index : best, 0);
    const label = `${current + 1} of ${cards.length}`;
    if (position.textContent !== label) position.textContent = label;
    previous.disabled = current === 0;
    next.disabled = current === cards.length - 1;
  }

  function goTo(index, behavior = reducedMotion.matches ? 'instant' : 'smooth') {
    index = Math.max(0, Math.min(cards.length - 1, index));
    const left = cards[index].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
    track.scrollTo({left, behavior});
  }

  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  track.addEventListener('keydown', event => {
    const destinations = {ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: cards.length - 1};
    if (Object.hasOwn(destinations, event.key)) {
      event.preventDefault();
      goTo(destinations[event.key]);
    }
  });
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }, {passive: true});
  new ResizeObserver(() => goTo(current, 'instant')).observe(track);
  nav.hidden = false;
  update();
}
