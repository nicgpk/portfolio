import { motionPaused } from './kinetics.mjs?v=2178cec3bf8c';

// An offset from the viewport edge makes reaching a demo the trigger. Cap the
// required visible area so tall/mobile examples never need to fit on screen.
export function revealReady(entry, height) {
  if (!entry?.isIntersecting) return false;
  const { boundingClientRect: bounds, intersectionRect: intersection } = entry;
  const top = Math.min(96, height * .12);
  const bottom = height - Math.min(180, Math.max(96, height * .2));
  const visibleHeight = Math.max(0, Math.min(intersection.bottom, bottom) - Math.max(intersection.top, top));
  const requiredHeight = Math.min(bounds.height * .5, 120, (bottom - top) * .35);
  return visibleHeight >= requiredHeight
    && intersection.width >= Math.min(bounds.width, entry.rootBounds?.width ?? bounds.width) * .5;
}

export function observeDemoReveals(items) {
  if (!('IntersectionObserver' in window)) return;
  const records = new Map(items.map(item => [item.target, {
    ...item, near: false, approached: false, revealed: false, timer: 0,
  }]));
  let frame = 0;
  const cancel = record => { clearTimeout(record.timer); record.timer = 0; };
  const approach = (record, value) => {
    if (record.approached === value) return;
    record.approached = value;
    record.onApproach?.(value);
  };
  const exit = record => {
    cancel(record);
    if (record.revealed) { record.revealed = false; record.onVisible(false); }
  };
  const check = (record, dwellComplete = false) => {
    if (record.target.closest('[inert],[aria-hidden="true"]')) {
      exit(record); approach(record, false); return;
    }
    if (document.hidden || motionPaused()) {
      cancel(record); approach(record, false); return;
    }
    if (!record.near) {
      exit(record); approach(record, false); return;
    }
    // An element can move without crossing an IO threshold, particularly inside
    // the pinned stack. Read its current geometry instead of an old entry.
    const bounds = record.target.getBoundingClientRect();
    // Start inside the observer's outer margin. A prepared target can shift by
    // a few pixels without crossing that boundary and cancelling itself.
    if (!record.approached && (bounds.top > innerHeight + 160 || bounds.bottom < -160)) return;
    const clip = record.target.closest('.work-feature-list,.dev-table-wrap,.hero-product-cards')?.getBoundingClientRect()
      || { top: 0, bottom: innerHeight, left: 0, right: innerWidth };
    const intersectionRect = {
      top: Math.max(bounds.top, clip.top, 0),
      bottom: Math.min(bounds.bottom, clip.bottom, innerHeight),
      width: Math.max(0, Math.min(bounds.right, clip.right, innerWidth) - Math.max(bounds.left, clip.left, 0)),
    };
    const visible = intersectionRect.bottom > intersectionRect.top && intersectionRect.width > 0;
    approach(record, true);
    if (!visible) { exit(record); return; }
    if (record.revealed) return;
    const ready = revealReady({ isIntersecting: true, boundingClientRect: bounds, intersectionRect, rootBounds: { width: innerWidth } }, innerHeight);
    if (!ready) { cancel(record); return; }
    if (dwellComplete) {
      record.revealed = true;
      record.onVisible(true);
    } else if (!record.timer) {
      // Fixed dwell for each group, not a scroll debounce: continued reading
      // never pushes playback back, and a fast pass cancels the pending start.
      record.timer = setTimeout(() => { record.timer = 0; check(record, true); }, 100);
    }
  };
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      records.forEach(record => {
        if (record.near || record.revealed || record.approached || record.timer) check(record);
      });
    });
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) records.get(entry.target).near = entry.isIntersecting;
    schedule();
  }, { rootMargin: '240px 0px', threshold: 0 });
  records.forEach(record => observer.observe(record.target));
  const projectObserver = new MutationObserver(schedule);
  const projects = new Set([...records.keys()].map(target => target.closest('.work-feature')).filter(Boolean));
  projects.forEach(project => projectObserver.observe(project, { attributes: true, attributeFilter: ['inert', 'aria-hidden'] }));
  addEventListener('scroll', schedule, { passive: true, capture: true });
  addEventListener('resize', schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('portfolio:motionchange', schedule);
  document.addEventListener('portfolio:workframe', schedule);
}
