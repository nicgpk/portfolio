import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/movie-carousel.mjs', import.meta.url), 'utf8');

function setup({reduced = false, motion = 'on'} = {}) {
  const cards = Array.from({length: 5}, (_, index) => ({offsetLeft: index * 280}));
  const events = () => ({
    listeners: new Map(),
    addEventListener(type, listener) {this.listeners.set(type, listener);},
    emit(type, values = {}) {this.listeners.get(type)?.(values);},
  });
  const playback = {...events(), hidden: true, textContent: 'Pause reel'};
  const preference = {...events(), matches: reduced};
  let intersectionChanged;
  let nextTimer;
  const track = {
    ...events(),
    clientWidth: 600, scrollWidth: 1400, scrollLeft: 0,
    matches: () => false,
    querySelectorAll: () => cards,
    scrollTo({left, behavior}) {
      this.scrollLeft = left;
      this.behavior = behavior;
    },
  };
  const document = {
    ...events(),
    documentElement: {dataset: {motion}},
    querySelector: selector => selector === '.film-track' ? track : playback,
  };
  vm.runInNewContext(source, {
    document,
    matchMedia: query => query.includes('reduced-motion') ? preference : {matches: false},
    MutationObserver: class {observe() {}},
    ResizeObserver: class {observe() {}},
    IntersectionObserver: class {
      constructor(callback) {intersectionChanged = callback;}
      observe() {}
    },
    setTimeout(callback, delay) {
      assert.equal(delay, 4000);
      nextTimer = callback;
      return callback;
    },
    clearTimeout(timer) {if (nextTimer === timer) nextTimer = undefined;},
  });

  return {
    track,
    playback,
    preference,
    document,
    show(ratio) {intersectionChanged([{intersectionRatio: ratio}]);},
    advance() {
      const callback = nextTimer;
      if (!callback) return false;
      nextTimer = undefined;
      callback();
      return true;
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
  press('ArrowRight');
  assert.equal(track.scrollLeft, 800);
  press('ArrowRight');
  assert.equal(track.scrollLeft, 800);
  press('ArrowLeft');
  assert.equal(track.scrollLeft, 560);
});

test('Home and End reach both ends, including with motion disabled', () => {
  for (const options of [{reduced: true}, {motion: 'off'}]) {
    const {track, press} = setup(options);
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

test('the visible film reel advances to each snap position and loops back', () => {
  const {track, playback, show, advance} = setup();
  assert.equal(playback.hidden, false);
  show(.49);
  assert.equal(advance(), false);
  show(.5);
  for (const left of [280, 560, 800, 0]) {
    assert.equal(advance(), true);
    assert.equal(track.scrollLeft, left);
  }
  show(0);
  assert.equal(advance(), false);
});

test('film autoplay respects interaction, explicit pause, and motion preferences', () => {
  const {track, playback, preference, document, show, advance} = setup();
  show(1);
  track.emit('pointerenter', {pointerType: 'mouse'});
  assert.equal(advance(), false);
  track.emit('pointerleave', {pointerType: 'mouse'});

  document.activeElement = track;
  track.emit('focus');
  assert.equal(advance(), false);
  document.activeElement = null;
  track.emit('blur');

  playback.emit('click');
  assert.equal(playback.textContent, 'Resume reel');
  show(0);
  show(1);
  assert.equal(advance(), false);
  playback.emit('click');
  assert.equal(playback.textContent, 'Pause reel');
  assert.equal(advance(), true);

  document.hidden = true;
  document.emit('visibilitychange');
  assert.equal(advance(), false);
  document.hidden = false;
  document.emit('visibilitychange');
  preference.matches = true;
  preference.emit('change');
  assert.equal(playback.hidden, true);
  assert.equal(advance(), false);
});
