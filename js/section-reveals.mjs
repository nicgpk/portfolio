import { createScene } from './demo-scenes.mjs?v=0ff3773ee94e';
import { observeDemoReveals } from './demo-reveal.mjs?v=74b6932daa6c';

const ease = 'cubic-bezier(.22,.61,.36,1)';
const lift = distance => [
  { opacity: .35, transform: `translateY(${distance}px)` },
  { opacity: 1, transform: 'translateY(0)' },
];
const slide = [
  { opacity: .35, transform: 'translateX(14px)' },
  { opacity: 1, transform: 'translateX(0)' },
];
const part = (node, frames, delay = 0, duration = 480) => ({
  node, frames, options: { duration, delay, easing: ease, fill: 'both' },
});

export function sectionRecipe(target, kind) {
  if (kind === 'experience') {
    return [...target.children].map((node, index) => part(node, slide, 55 + index * 55));
  }
  if (kind === 'principle') {
    const siblings = [...(target.parentElement?.children || [])];
    const column = siblings.slice(0, siblings.indexOf(target)).filter(node => node.offsetTop === target.offsetTop).length;
    const offset = Math.min(column, 2) * 70;
    const rule = target.querySelector('.section-reveal-rule');
    const parts = rule ? [part(rule, [
      { opacity: 0, transform: 'scaleX(0)', offset: 0 },
      { opacity: .6, offset: .2 },
      { opacity: .35, transform: 'scaleX(1)', offset: .75 },
      { opacity: 0, transform: 'scaleX(1)', offset: 1 },
    ], offset, 620)] : [];
    target.querySelectorAll(':scope > h3,:scope > p').forEach((node, index) => {
      parts.push(part(node, lift(index ? 10 : 14), offset + 60 + index * 65));
    });
    return parts;
  }
  if (kind === 'tools') {
    return [...target.children].map((node, index) => part(node, lift(6), index * 35, 360));
  }
  if (kind === 'film') {
    return [part(target, [
      { opacity: .45, clipPath: 'inset(0 0 8% 0 round 0px)' },
      { opacity: 1, clipPath: 'inset(0 0 0% 0 round 0px)' },
    ], 0, 600)];
  }
  return [part(target, lift(target.matches('h2,h3') ? 18 : 10), 0, 520)];
}

// Editorial content enters once per page visit. Focus and direct anchor jumps
// keep the final readable pose; only approaching content receives a start pose.
export function createSectionReveal(target, recipe, factory = createScene) {
  // A delayed observer callback may arrive after the first pixels enter. The
  // bottom inset is still outside the reading area, so it can safely be primed.
  const inset = () => Math.min(180, Math.max(96, innerHeight * .2));
  const scene = factory(target, recipe, undefined, inset);
  let entered = false, dismissed = false;
  return {
    target,
    onApproach(value) { if (!entered && !dismissed) scene.setApproach(value); },
    onVisible(value) {
      if (dismissed) return;
      if (value && !entered) { entered = true; scene.setVisible(true); }
      else if (!value && entered) scene.takeControl();
    },
    settle() { dismissed = true; scene.takeControl(); },
    sync() { scene.sync(); },
  };
}

const items = [];
function register(selector, kind) {
  for (const target of document.querySelectorAll(selector)) {
    target.dataset.sectionReveal = kind;
    if (kind === 'principle') {
      const rule = document.createElement('span');
      rule.className = 'section-reveal-rule';
      rule.setAttribute('aria-hidden', 'true');
      target.append(rule);
    }
    const item = createSectionReveal(target, () => sectionRecipe(target, kind));
    target.addEventListener('focusin', () => item.settle());
    items.push(item);
  }
}
register('.home-narrow .leadership-copy > :not(.eyebrow),.home-narrow .about-detail > h3', 'copy');
register('.home-narrow .experience > li', 'experience');
register('.home-narrow .process-section > .glass-section-heading > *', 'copy');
register('.home-narrow .process-list > li', 'principle');
register('.home-narrow .process-tools', 'tools');
register('.home-narrow .film-section > .glass-section-heading > *,.home-narrow .film-intro', 'copy');
register('.home-narrow .film-carousel', 'film');
register('.home-narrow .footer-invitation > :not(.eyebrow)', 'copy');

if (items.length) {
  observeDemoReveals(items);
  const sync = () => items.forEach(item => item.sync());
  document.addEventListener('portfolio:motionchange', sync);
  document.addEventListener('visibilitychange', sync);
  addEventListener('beforeprint', () => items.forEach(item => item.settle()));
  sync();
}
