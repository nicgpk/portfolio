import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function setup(theme = null) {
  let paused = false;
  const listeners = {};
  const animations = [];
  const document = {
    hidden: false,
    addEventListener: (name, listener) => { listeners[name] = listener; },
  };
  const element = {
    closest: () => theme,
    animate: (frames, options) => {
      const animation = new EventTarget();
      animation.cancelled = false;
      animation.frames = frames;
      animation.options = options;
      animation.cancel = () => {
        animation.cancelled = true;
        animation.dispatchEvent(new Event('cancel'));
      };
      animations.push(animation);
      return animation;
    },
  };
  const source = readFileSync(new URL('../js/interaction-motion.mjs', import.meta.url), 'utf8');
  const code = source.slice(source.indexOf('// Shared feedback:'), source.indexOf('const hero ='))
    .replaceAll('export ', '');
  const context = vm.createContext({ document, motionPaused: () => paused, getComputedStyle: () => ({getPropertyValue: name => theme?.[name] ?? ''}) });
  vm.runInContext(code, context);
  return { element, document, listeners, animations, play: duration => context.animateFeedback(element, [{ opacity: .8 }, { opacity: 1 }], duration), pause: () => { paused = true; listeners['portfolio:motionchange'](); } };
}

test('explicit reveal timing survives a theme and missing tokens use a finite fallback', () => {
  const themed = setup({'--duration-medium':'600ms'});
  assert.equal(themed.play(700).options.duration, 700);
  assert.equal(themed.play().options.duration, 600);
  assert.equal(setup({}).play().options.duration, 420);
});

test('rapid input replaces feedback rather than stacking animations', () => {
  const x = setup();
  const first = x.play();
  const second = x.play();
  assert.equal(first.cancelled, true);
  assert.equal(second.cancelled, false);
  x.document.hidden = true;
  x.listeners.visibilitychange();
  assert.equal(second.cancelled, true);
});

test('completed feedback is released before the next interaction', () => {
  const x = setup();
  const first = x.play();
  first.dispatchEvent(new Event('finish'));
  x.play();
  assert.equal(first.cancelled, false);
});

test('a late completion cannot detach newer feedback from its control', () => {
  const x = setup();
  const first = x.play();
  const second = x.play();
  first.dispatchEvent(new Event('finish'));
  x.play();
  assert.equal(second.cancelled, true);
});

test('reduced motion cancels feedback and prevents new animation work', () => {
  const x = setup();
  const first = x.play();
  x.pause();
  assert.equal(first.cancelled, true);
  assert.equal(x.play(), undefined);
  assert.equal(x.animations.length, 1);
});

test('hidden documents apply no feedback animation', () => {
  const x = setup();
  x.document.hidden = true;
  assert.equal(x.play(), undefined);
  assert.equal(x.animations.length, 0);
});
