import { motionPaused } from './kinetics.mjs';

// One reading sequence for discovery: recommendation, evidence, next action.
// Observe each card separately so horizontal browsing gets the same reveal.
const demo = document.querySelector('#pattern-discover .pb-ex-shell');
if (demo && 'IntersectionObserver' in window) {
  const ease = 'cubic-bezier(.16,1,.3,1)';
  const records = [];
  const animate = (element, frames, delay = 0, duration = 480) =>
    element?.animate(frames, { delay, duration, easing: ease, fill: 'backwards' });
  const arrive = (element, delay = 0) => animate(element, [
    { opacity: .65, transform: 'translateX(10px)' },
    { opacity: 1, transform: 'translateX(0)' },
  ], delay);
  const add = (target, sequence) => {
    if (target) records.push({ target, sequence, visible: false, played: false, animations: [] });
  };

  add(demo.querySelector('.pb-ex-bar'), target => [arrive(target)]);
  for (const card of demo.querySelectorAll('.hero-product-card')) {
    add(card, target => {
      const action = target.querySelector('.hero-product-btn.primary');
      const accent = getComputedStyle(demo).getPropertyValue('--product-accent').trim();
      return [
        arrive(target.querySelector('.hero-product-card-id')),
        arrive(target.querySelector('.desc'), 100),
        animate(target.querySelector('.hero-product-badge.rec'), [
          { clipPath: 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0 0 0)' },
        ], 220),
        arrive(target.querySelector('.hero-product-card-stats'), 300),
        arrive(target.querySelector('.hero-product-card-actions'), 420),
        action && animate(action, [
          { borderColor: getComputedStyle(action).borderColor },
          { borderColor: accent, offset: .45 },
          { borderColor: getComputedStyle(action).borderColor },
        ], 650, 600),
      ].filter(Boolean);
    });
  }
  add(demo.querySelector('.pb-ex-list'), target =>
    [...target.children].map((row, index) => arrive(row, index * 80)));

  const sync = record => {
    if (motionPaused()) {
      // Cancel back to the fully readable HTML, including delayed effects.
      record.animations.forEach(animation => animation.cancel());
      record.animations = [];
      if (record.visible) record.played = true;
      record.target.dataset.discoveryReveal = 'reduced';
      return;
    }
    const allowed = record.visible && !document.hidden;
    if (!record.played && allowed) {
      record.played = true;
      record.animations = record.sequence(record.target);
      Promise.allSettled(record.animations.map(animation => animation.finished)).then(() => {
        record.animations = [];
        record.target.dataset.discoveryReveal = motionPaused() ? 'reduced' : 'settled';
        observer.unobserve(record.target);
      });
    }
    for (const animation of record.animations) {
      if (animation.playState === 'finished' || animation.playState === 'idle') continue;
      if (allowed) animation.play();
      else animation.pause();
    }
    record.target.dataset.discoveryReveal = record.animations.length
      ? allowed ? 'playing' : 'paused'
      : record.played ? 'settled' : 'waiting';
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const record = records.find(record => record.target === entry.target);
      record.visible = entry.isIntersecting && entry.intersectionRatio >= .18;
      sync(record);
    }
  }, { threshold: [0, .18] });
  records.forEach(record => {
    record.target.dataset.discoveryReveal = 'waiting';
    observer.observe(record.target);
  });
  document.addEventListener('visibilitychange', () => records.forEach(sync));
  document.addEventListener('portfolio:motionchange', () => records.forEach(sync));
}
