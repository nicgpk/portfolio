import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/movie-carousel.mjs', import.meta.url), 'utf8');

function setup({reduced = false, motion = 'on'} = {}) {
  const events = () => ({
    listeners: new Map(),
    addEventListener(type, listener) {this.listeners.set(type, listener);},
    emit(type, values = {}) {this.listeners.get(type)?.(values);},
  });
  const posters = [];
  function makeCard(offsetLeft) {
    return {
      offsetLeft,
      getBoundingClientRect() {return {left: this.offsetLeft};},
      cloneNode() {return makeCard(0);},
      setAttribute(name, value) {this[name] = value;},
      remove() {posters.splice(posters.indexOf(this), 1);},
    };
  }
  posters.push(...Array.from({length: 5}, (_, index) => makeCard(index * 280)));

  let scrollLeft = 0;
  let nextFrame;
  let nextTimer;
  let intersectionChanged;
  let motionChanged;
  const track = {
    ...events(),
    clientWidth: 600,
    style: {},
    focused: false,
    get scrollWidth() {return posters.length * 280;},
    get scrollLeft() {return scrollLeft;},
    set scrollLeft(value) {scrollLeft = Math.round(Math.max(0, Math.min(value, this.scrollWidth - this.clientWidth)));},
    querySelectorAll: () => posters,
    matches(selector) {return selector === ':focus-visible' && this.focused;},
    append(...copies) {
      for (const copy of copies) {
        copy.offsetLeft = posters.length * 280;
        posters.push(copy);
      }
    },
    scrollTo({left, behavior}) {
      this.scrollLeft = left;
      this.behavior = behavior;
    },
  };
  const document = {
    ...events(),
    documentElement: {dataset: {motion}},
    querySelector: () => track,
  };
  const preference = {...events(), matches: reduced};

  vm.runInNewContext(source, {
    document,
    matchMedia: query => query.includes('reduced-motion') ? preference : {matches: false},
    MutationObserver: class {
      constructor(callback) {motionChanged = callback;}
      observe() {}
    },
    ResizeObserver: class {observe() {}},
    IntersectionObserver: class {
      constructor(callback) {intersectionChanged = callback;}
      observe() {}
    },
    requestAnimationFrame(callback) {
      nextFrame = callback;
      return callback;
    },
    cancelAnimationFrame() {nextFrame = undefined;},
    setTimeout(callback) {
      nextTimer = callback;
      return callback;
    },
    clearTimeout() {nextTimer = undefined;},
  });

  return {
    document,
    posters,
    preference,
    track,
    show(visible) {intersectionChanged([{isIntersecting: visible}]);},
    setMotion(value) {
      document.documentElement.dataset.motion = value;
      motionChanged();
    },
    frame(time) {
      const callback = nextFrame;
      if (!callback) return false;
      nextFrame = undefined;
      callback(time);
      return true;
    },
    finishInteraction() {
      assert.ok(nextTimer);
      nextTimer();
    },
    press(key, modifiers = {}) {
      let prevented = false;
      track.emit('keydown', {key, ...modifiers, preventDefault() {prevented = true;}});
      return prevented;
    },
  };
}

test('film reel arrow keys move between posters and stop at the ends', () => {
  const {track, press} = setup();
  press('ArrowLeft');
  assert.equal(track.scrollLeft, 0);
  press('ArrowRight');
  assert.equal(track.scrollLeft, 280);
  assert.equal(track.behavior, 'smooth');
  press('ArrowRight');
  assert.equal(track.scrollLeft, 560);
  press('End');
  assert.equal(track.scrollLeft, track.scrollWidth - track.clientWidth);
  press('ArrowRight');
  assert.equal(track.scrollLeft, track.scrollWidth - track.clientWidth);
  press('ArrowLeft');
  assert.equal(track.scrollLeft, 1960);
});

test('Home and End reach both ends without motion or duplicate posters', () => {
  for (const options of [{reduced: true}, {motion: 'off'}]) {
    const {track, posters, press, show, frame} = setup(options);
    assert.equal(posters.length, 5);
    show(true);
    assert.equal(frame(0), false);
    assert.equal(press('End'), true);
    assert.equal(track.scrollLeft, 800);
    assert.equal(track.behavior, 'instant');
    press('Home');
    assert.equal(track.scrollLeft, 0);
  }
});

test('the film reel leaves other keys and browser shortcuts alone', () => {
  const {track, press} = setup();
  assert.equal(press('ArrowDown'), false);
  assert.equal(press('ArrowRight', {altKey: true}), false);
  assert.equal(track.scrollLeft, 0);
});

test('visible autoplay moves continuously and wraps across identical poster copies', () => {
  const {track, posters, show, frame} = setup();
  assert.equal(frame(0), false);
  assert.equal(posters.length, 10);
  assert.ok(posters.slice(5).every(poster => poster['aria-hidden'] === 'true' && poster.inert));
  assert.equal(track.style.scrollSnapType, 'none');
  track.scrollLeft = 1398;
  show(true);
  for (const [time, position] of [[0, 1398], [10, 1398], [20, 1399], [50, 1400], [100, 1], [150, 3]]) {
    assert.equal(frame(time), true);
    assert.equal(track.scrollLeft, position);
  }
  show(false);
  assert.equal(frame(200), false);
});

test('autoplay gives precedence to hover, keyboard focus, swipes, and page visibility', () => {
  const {track, document, show, frame, finishInteraction} = setup();
  show(true);
  track.emit('pointerenter', {pointerType: 'mouse'});
  assert.equal(frame(0), false);
  track.emit('pointerleave', {pointerType: 'mouse'});
  assert.equal(frame(100), true);
  track.focused = true;
  track.emit('focus');
  assert.equal(frame(200), false);
  track.focused = false;
  track.emit('blur');
  track.emit('pointerdown', {pointerType: 'touch'});
  assert.equal(frame(300), false);
  track.emit('pointercancel', {pointerType: 'touch'});
  track.scrollLeft = 400;
  track.emit('scroll');
  assert.equal(frame(400), false);
  finishInteraction();
  frame(500);
  frame(550);
  assert.ok(track.scrollLeft > 400);
  document.hidden = true;
  document.emit('visibilitychange');
  assert.equal(frame(600), false);
});

test('changing motion preferences stops the loop and restores native snap scrolling', () => {
  const {track, posters, preference, setMotion, show, frame} = setup();
  show(true);
  assert.equal(frame(0), true);
  preference.matches = true;
  preference.emit('change');
  assert.equal(frame(50), false);
  assert.equal(posters.length, 5);
  assert.equal(track.style.scrollSnapType, '');
  preference.matches = false;
  preference.emit('change');
  assert.equal(posters.length, 10);
  assert.equal(frame(100), true);
  setMotion('off');
  assert.equal(posters.length, 5);
  assert.equal(frame(150), false);
});
