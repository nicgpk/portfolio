import { motionPaused } from './kinetics.mjs?v=2178cec3bf8c';
import { animateFeedback, cancelFeedback } from './interaction-motion.mjs?v=ccec8d8cb84c';
import { enhanceDemoControls } from './demo-controls.mjs?v=b38479500abc';
import { observeDemoReveals } from './demo-reveal.mjs?v=74b6932daa6c';

// Finite reading sequences prepare only just outside the viewport. The HTML
// remains readable without enhancement; interface shells never move.
const ease = 'cubic-bezier(.22,.61,.36,1)';
const arrive = [
  { opacity: .72, transform: 'translateY(10px)' },
  { opacity: 1, transform: 'translateY(0)' },
];
const emphasize = [{ opacity: .72 }, { opacity: 1 }];
const grow = [{ transform: 'scaleY(.12)', opacity: .72 }, { transform: 'scaleY(1)', opacity: 1 }];
const wipe = [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }];

export function sceneRecipe(root) {
  const parts = [];
  const add = (selector, frames = arrive, start = 0, stagger = 60, duration = 480, groupSelector) => {
    const counts = new Map();
    [...root.querySelectorAll(selector)].slice(0, 30).forEach(node => {
      const target = groupSelector ? node.closest(groupSelector) || node : node;
      const index = counts.get(target) || 0;
      counts.set(target, index + 1);
      parts.push({ target, node, frames, options: { duration, delay: start + Math.min(index * stagger, 180), easing: ease, fill: 'both' } });
    });
  };
  if (root.querySelector('.pb-ex-chart')) {
    add('.pb-ex-kpi', emphasize, 0, 60, 420, '.pb-ex-kpis');
    add('.pb-ex-col', grow, 0, 55, 520, '.pb-ex-chart');
    add('.pb-ex-actions');
  } else if (root.querySelector('.dev-home-grid')) {
    add('.dev-feat');
  } else if (root.querySelector('.dev-review-block')) {
    add('.dev-review-block');
    add('.dev-wiz-foot', emphasize);
  } else if (root.querySelector('.dev-canary')) {
    add('.dev-canary-row', wipe, 0, 60, 480, '.dev-canary');
    add('.dev-dc-row', arrive, 0, 60, 480, '.dev-dc');
    add('.dev-wiz-sec:not(:has(.dev-canary-row,.dev-dc-row))');
    add('.dev-wiz-foot', emphasize);
  } else if (root.querySelector('.dev-wiz-sec')) {
    add('.dev-wiz-sec');
    add('.dev-wiz-foot', emphasize);
  } else if (root.querySelector('.dev-table')) {
    add('.dev-table tbody tr', arrive, 0, 60, 480, 'tbody');
  } else if (root.matches('.booking-breakdown')) {
    add('.booking-night dl > div', arrive, 0, 60, 480, 'dl');
    add('.booking-total strong', emphasize);
  } else if (root.matches('.stacking-education')) {
    add('.stacking-steps > li');
    add('.stacking-net', emphasize);
  } else if (root.querySelector('.pb-ex-compare')) {
    add('.pb-ex-card');
    add('.pb-ex-link', emphasize);
  } else if (root.querySelector('.pb-ex-reasons')) {
    add('.pb-ex-kpi', emphasize, 0, 60, 420, '.pb-ex-kpis');
    add('.pb-ex-lose-list > li', arrive, 0, 60, 480, '.pb-ex-lose-list');
    add('.pb-ex-reasons,.pb-ex-actions');
  } else if (root.querySelector('.pb-ex-field')) {
    add('.pb-ex-field');
    add('.pb-ex-actions', emphasize);
  } else if (root.querySelector('.hero-product-card')) {
    add('.hero-product-card-id', arrive, 0, 60, 480, '.hero-product-card');
    add('.desc,.pb-ex-hero-benefits,.hero-product-card-stats', arrive, 60, 60, 480, '.hero-product-card');
    add('.hero-product-badge.rec', emphasize, 120, 60, 420, '.hero-product-card');
    add('.hero-product-card-actions,.pb-ex-faq', emphasize, 180, 60, 420, '.hero-product-card');
  } else if (root.matches('[data-developer]')) {
    add('[data-step]:not([hidden]) .deploy-field-group,[data-step]:not([hidden]) h2');
  }
  return parts;
}

// A group is primed before it is readable, never dimmed after the reader has
// reached it. Direct jumps into content therefore keep its final, readable pose.
export function createScene(root, recipe, allowed = () => !motionPaused() && !document.hidden, entryInset = () => 0) {
  let visible = false, approaching = false, played = false, manual = false, generation = 0;
  let animations = [];
  const stop = () => {
    generation++;
    animations.forEach(animation => animation.cancel());
    animations = [];
    root.dataset.sceneState = played ? 'settled' : 'waiting';
  };
  const prepare = () => {
    if (!approaching || visible || played || manual || animations.length || !allowed()) return;
    const bounds = root.getBoundingClientRect();
    if (bounds.bottom > 0 && bounds.top < innerHeight - entryInset()) return;
    animations = recipe().filter(({node}) => {
      if (!node.animate || node.closest('[hidden]')) return false;
      const rect = node.getBoundingClientRect();
      return rect.right > bounds.left && rect.left < bounds.right;
    }).map(({node, frames, options}) => {
      const animation = node.animate(frames, options);
      animation.pause();
      animation.currentTime = 0;
      animation.finished.catch(() => {});
      return animation;
    });
    root.dataset.sceneState = animations.length ? 'prepared' : 'waiting';
  };
  const play = () => {
    if (!visible || manual || !allowed() || played) return;
    played = true;
    const token = generation;
    animations.forEach(animation => animation.play());
    root.dataset.sceneState = animations.length ? 'playing' : 'settled';
    Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (generation !== token) return;
      animations.forEach(animation => animation.cancel());
      animations = [];
      root.dataset.sceneState = 'settled';
    });
  };
  return {
    setApproach(value) {
      approaching = value;
      if (!value) stop();
      else prepare();
    },
    setVisible(value) {
      visible = value;
      if (!value) { played = false; stop(); prepare(); }
      else play();
    },
    sync() {
      if (!allowed()) stop();
      else if (visible) play();
      else prepare();
    },
    // Taking control settles every group in this product surface immediately.
    takeControl() { manual = true; played = true; stop(); },
    stop,
  };
}

const roots = [...document.querySelectorAll('.product-surface')].filter(root => !root.parentElement.closest('.product-surface'));
const scenes = new Map();
for (const root of roots) {
  enhanceDemoControls(root);
  root.classList.add('demo-interactive');
  // The live homepage and receipt previews already own their scene timelines.
  if (root.matches('[data-mini-growth],[data-mini-deploy],[data-receipt]')) continue;
  const groups = new Map();
  for (const part of sceneRecipe(root)) {
    if (!groups.has(part.target)) groups.set(part.target, []);
    groups.get(part.target).push(part);
  }
  const localScenes = [];
  for (const [target, parts] of groups) {
    const scene = createScene(target, () => parts);
    scenes.set(target, scene);
    localScenes.push(scene);
  }
  const takeControl = event => {
    if (!event.target.closest('button,input,select,summary,a')) return;
    localScenes.forEach(scene => scene.takeControl());
  };
  root.addEventListener('pointerdown', takeControl, true);
  root.addEventListener('focusin', takeControl, true);
  root.addEventListener('input', takeControl, true);
}

observeDemoReveals([...scenes].map(([target, scene]) => ({
  target,
  onApproach(approaching) { scene.setApproach(approaching); },
  onVisible(visible) {
    scene.setVisible(visible);
    if (!visible) cancelFeedback(target);
  },
})));
const sync = () => scenes.forEach(scene => scene.sync());
document.addEventListener('visibilitychange', sync);
document.addEventListener('portfolio:motionchange', sync);
sync();

// Brief press feedback stays on the control. Program tiles retain their
// established static outline/checkmark treatment, without scaling or lifting.
document.addEventListener('click', event => {
  const button = event.target.closest('.demo-interactive button:not([data-mini-program])');
  if (!button || button.disabled) return;
  animateFeedback(button, [{ transform: 'translateY(1px)' }, { transform: 'translateY(0)' }], 140);
});
