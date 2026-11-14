import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function setup() {
  let now = 0, id = 0, paused = false, inactive = false, callback;
  const timers = new Map(), events = {}, seen = [], approached = [];
  let bounds = { top: 180, bottom: 580, height: 400, left: 0, right: 600, width: 600 };
  const target = { getBoundingClientRect: () => bounds, closest: selector => selector.startsWith('[inert]') && inactive ? {} : null };
  const document = { hidden: false, addEventListener: (type, listener) => { events[type] = listener; } };
  const context = vm.createContext({
    window: { IntersectionObserver: true }, document, innerHeight: 800, innerWidth: 1000,
    motionPaused: () => paused,
    IntersectionObserver: class { constructor(fn) { callback = fn; } observe() {} },
    MutationObserver: class { observe() {} },
    addEventListener: (type, listener) => { events[type] = listener; },
    setTimeout: (fn, delay) => { timers.set(++id, { fn, at: now + delay }); return id; },
    clearTimeout: key => timers.delete(key),
    requestAnimationFrame: fn => { timers.set(++id, { fn, at: now }); return id; },
  });
  const source = readFileSync(new URL('../js/demo-reveal.mjs', import.meta.url), 'utf8')
    .replace(/^\uFEFF?import .*;\r?\n/, '').replaceAll('export function', 'function');
  vm.runInContext(source, context);
  context.observeDemoReveals([{ target, onVisible: value => seen.push(value), onApproach: value => approached.push(value) }]);
  const tick = ms => {
    const end = now + ms;
    for (;;) {
      const next = [...timers.entries()].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      timers.delete(next[0]); now = next[1].at; next[1].fn();
    }
    now = end;
  };
  return {
    seen, approached, events, tick, document, context,
    enter: (isIntersecting = true) => callback([{ target, isIntersecting, boundingClientRect: bounds, intersectionRect: bounds }]),
    move: (top, height = 400) => { bounds = { ...bounds, top, bottom: top + height, height }; },
    pause: value => { paused = value; }, inactive: value => { inactive = value; },
  };
}

test('a demo near the viewport bottom waits until it reaches the reading area', () => {
  const x = setup(); x.move(600); x.enter(); x.tick(1000); assert.deepEqual(x.seen, []);
  x.move(180); x.events.scroll(); x.tick(99); assert.deepEqual(x.seen, []);
  x.tick(1); assert.deepEqual(x.seen, [true]);
});

test('continued reading scroll does not postpone the fixed reveal dwell', () => {
  const x = setup(); x.enter();
  for (let i = 0; i < 10; i++) { x.tick(40); x.events.scroll(); }
  assert.deepEqual(x.seen, [true]);
  x.events.scroll(); x.tick(500); assert.deepEqual(x.seen, [true]);
});

test('quick passes cancel the dwell and can reveal on a later visit', () => {
  const x = setup(); x.enter(); x.tick(50); x.move(900); x.events.scroll(); x.tick(100);
  assert.deepEqual(x.seen, []);
  x.move(180); x.events.scroll(); x.tick(100); assert.deepEqual(x.seen, [true]);
  x.move(900); x.events.scroll(); x.tick(1); assert.deepEqual(x.seen, [true, false]);
  x.move(180); x.events.scroll(); x.tick(100); assert.deepEqual(x.seen, [true, false, true]);
});

test('approach prepares the initial pose before the viewport offset is crossed', () => {
  const x = setup(); x.move(900); x.enter(); x.tick(1);
  assert.deepEqual(x.approached, [true]); assert.deepEqual(x.seen, []);
  x.move(180); x.events.scroll(); x.tick(100); assert.deepEqual(x.seen, [true]);
  x.enter(false); x.tick(1); assert.deepEqual(x.approached, [true, false]);
});

test('preparation has room to move without crossing the outer observer boundary', () => {
  const x = setup(); x.move(1020); x.enter(); x.tick(1);
  assert.deepEqual(x.approached, []);
  x.move(950); x.events.scroll(); x.tick(1);
  assert.deepEqual(x.approached, [true]);
  // The entrance translates the same observed heading by 18px. It is outside
  // the preparation edge but still within the observer's 240px outer margin.
  x.move(968); x.events.scroll(); x.tick(500);
  assert.deepEqual(x.approached, [true]);
  assert.deepEqual(x.seen, []);
  x.move(1100); x.enter(false); x.tick(1);
  assert.deepEqual(x.approached, [true, false]);
});

test('tall mobile demos use a reachable portion of the viewport', () => {
  const x = setup(); x.move(180, 2400); x.enter(); x.tick(100);
  assert.deepEqual(x.seen, [true]);
});

test('the offset uses fresh geometry even without a new intersection event', () => {
  const x = setup(); x.enter(); x.move(750); x.events.scroll(); x.tick(100);
  assert.deepEqual(x.seen, []);
  x.move(180); x.events.scroll(); x.tick(100); assert.deepEqual(x.seen, [true]);
});

test('a pinned-card paint rechecks the offset without another native scroll or IO entry', () => {
  const x=setup();x.move(900);x.enter();x.tick(100);
  assert.deepEqual(x.seen,[]);
  x.move(180);x.events['portfolio:workframe']();x.tick(100);
  assert.deepEqual(x.seen,[true]);
});

test('hidden tabs, reduced motion and inactive pinned cards cannot spend a pending reveal', () => {
  const x = setup(); x.enter(); x.document.hidden = true; x.events.visibilitychange(); x.tick(500);
  assert.deepEqual(x.seen, []);
  x.document.hidden = false; x.pause(true); x.events.visibilitychange(); x.tick(500);
  assert.deepEqual(x.seen, []);
  x.pause(false); x.inactive(true); x.events['portfolio:motionchange'](); x.tick(500);
  assert.deepEqual(x.seen, []);
  x.inactive(false); x.events.scroll(); x.tick(100); assert.deepEqual(x.seen, [true]);
});

test('mostly clipped content does not count as revealed', () => {
  const x = setup();
  const bounds = { top: 180, bottom: 580, height: 400, width: 600 };
  assert.equal(x.context.revealReady({ isIntersecting: true, boundingClientRect: bounds, intersectionRect: { ...bounds, width: 100 } }, 800), false);
});
