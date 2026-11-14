import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function setup({reduced = false} = {}) {
  const frames = new Map();
  let frameId = 0, observer, motionChanged;
  const element = () => ({
    events: {}, attributes: {}, hidden: false,
    addEventListener(type, listener) {this.events[type] = listener;},
    setAttribute(name, value) {this.attributes[name] = value;},
    removeAttribute(name) {delete this.attributes[name];},
  });
  const makeCard = index => ({...element(), offsetLeft: index * 280, dataset: {}, image: {},
    querySelector() {return this.image;},
    cloneNode() {return makeCard(index + 5);},
  });
  const cards = Array.from({length: 5}, (_, index) => makeCard(index));
  const copies = [];
  const previous = element(), next = element(), playback = element();
  const controls = {...element(), hidden: true,
    querySelector: selector => selector.includes('previous') ? previous : selector.includes('next') ? next : playback,
  };
  let position = 0;
  const track = {...element(), clientWidth: 600,
    get scrollWidth() {return copies[0]?.hidden ? 1400 : 2800;},
    get scrollLeft() {return position;},
    set scrollLeft(left) {position = Math.max(0, Math.min(left, this.scrollWidth - this.clientWidth));},
    querySelectorAll: selector => selector === '.film-card' ? cards : [...cards, ...copies].map(card => card.image),
    append: copy => copies.push(copy),
    scrollTo({left, behavior}) {this.scrollLeft = left; this.behavior = behavior; this.events.scroll?.();},
    focus() {document.activeElement = track; carousel.events.focusin();},
  };
  const carousel = {...element(),
    querySelector: selector => selector === '.film-track' ? track : controls,
    classList: {add() {}, toggle() {}},
    contains: node => [track, previous, next, playback].includes(node),
  };
  const document = {...element(), hidden: false, activeElement: null,
    documentElement: {dataset: {motion: 'on'}}, querySelector: () => carousel,
  };
  const preference = {matches: reduced, addEventListener(type, callback) {motionChanged = callback;}};
  vm.runInNewContext(readFileSync(new URL('../js/movie-carousel.mjs', import.meta.url), 'utf8'), {
    document, matchMedia: () => preference, queueMicrotask,
    requestAnimationFrame: callback => {frames.set(++frameId, callback); return frameId;},
    cancelAnimationFrame: id => frames.delete(id),
    ResizeObserver: class {observe() {}},
    MutationObserver: class {observe() {}},
    IntersectionObserver: class {constructor(callback) {observer = callback;} observe() {}},
  });
  observer([{isIntersecting: true}]);
  return {frames, previous, next, playback, controls, track, copies,
    focused: () => document.activeElement,
    focus(node) {document.activeElement = node; carousel.events.focusin();},
    async blur() {document.activeElement = null; carousel.events.focusout(); await Promise.resolve();},
    reduce(value) {preference.matches = value; motionChanged();},
  };
}

test('film controls pause autoplay while focused and respect an explicit pause', async () => {
  const reel = setup();
  assert.equal(reel.controls.hidden, false);
  assert.equal(reel.frames.size, 1);
  reel.focus(reel.playback);
  assert.equal(reel.frames.size, 0, 'focus on controls stops scrolling');
  reel.playback.events.click();
  assert.equal(reel.playback.textContent, 'Resume reel');
  await reel.blur();
  assert.equal(reel.frames.size, 0, 'an explicit pause survives focus leaving');
  reel.focus(reel.playback);
  reel.playback.events.click();
  assert.equal(reel.frames.size, 0, 'resume waits until controls lose focus');
  await reel.blur();
  assert.equal(reel.frames.size, 1);
});

test('manual film navigation stops autoplay and supports the loop join', async () => {
  const reel = setup();
  reel.focus(reel.previous);
  reel.previous.events.click();
  assert.equal(reel.track.scrollLeft, 1120, 'previous from the start reaches the last original film');
  reel.next.events.click();
  assert.equal(reel.track.scrollLeft, 1400, 'next crosses to the identical first copy');
  reel.next.events.click();
  assert.equal(reel.track.scrollLeft, 280, 'the next step normalizes the repeated set');
  await reel.blur();
  assert.equal(reel.frames.size, 0);
  assert.equal(reel.playback.textContent, 'Resume reel');
});

test('reduced motion exposes a finite shelf with accurate arrow boundaries', () => {
  const reel = setup({reduced: true});
  assert.equal(reel.playback.hidden, true);
  assert.equal(reel.frames.size, 0);
  assert(reel.copies.every(copy => copy.hidden));
  assert.equal(reel.previous.disabled, true);
  assert.equal(reel.next.disabled, false);
  reel.next.events.click();
  assert.equal(reel.track.scrollLeft, 280);
  assert.equal(reel.track.behavior, 'instant');
  assert.equal(reel.previous.disabled, false);
  reel.next.events.click();
  reel.next.events.click();
  assert.equal(reel.track.scrollLeft, 800);
  assert.equal(reel.next.disabled, true);
  reel.previous.events.click();
  assert.equal(reel.next.disabled, false);
});

test('switching motion off preserves the film and focus when hiding playback', () => {
  const reel = setup();
  reel.track.scrollLeft = 1680;
  reel.focus(reel.playback);
  reel.reduce(true);
  assert.equal(reel.track.scrollLeft, 280);
  assert.equal(reel.playback.hidden, true);
  assert.equal(reel.frames.size, 0);
  assert.equal(reel.previous.disabled, false);
  assert.equal(reel.focused(), reel.track, 'keyboard focus remains on a visible element');
});
