import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

async function setup() {
  let now = 0, id = 0, writes = 0;
  const frames = new Map(), events = {}, documentEvents = {};
  const style = () => new Proxy({setProperty(name, value) {this[name] = value;}, removeProperty(name) {delete this[name.startsWith('--') ? name : name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())];}}, {
    set(target, key, value) {writes++; target[key] = value; return true;},
  });
  const cards = Array.from({length:3}, () => ({style:style(), inert:false, offsetHeight:940,
    setAttribute() {writes++;}, removeAttribute() {}, contains:() => false,
    scrollIntoView() {}, querySelector:() => ({focus() {}}),
  }));
  const previous = {}, next = {}, status = {};
  previous.addEventListener = next.addEventListener = () => {};
  const controls = {querySelector:s => s.includes('previous') ? previous : s.includes('next') ? next : status};
  const atmosphere = {style:style(), classList:{toggle() {}}};
  const stage = {offsetHeight:1000};
  const root = {style:style(), classList:{toggle() {}},
    querySelector:s => s.includes('stage') ? stage : s.includes('list') ? {offsetHeight:940} : controls,
    querySelectorAll:() => cards, closest:() => ({querySelector:() => atmosphere}),
    getBoundingClientRect:() => ({top:504 - context.scrollY}),
  };
  const document = {hidden:false, activeElement:null, documentElement:{dataset:{motion:'on'}},
    fonts:{ready:Promise.resolve()}, querySelector:() => root,
    addEventListener:(type, fn) => {documentEvents[type] = fn;},
  };
  const context = {document, scrollY:400, innerHeight:1305, performance:{now:() => now},
    matchMedia:query => ({matches:query.includes('min-width'), addEventListener() {}}),
    requestAnimationFrame:fn => {frames.set(++id, fn); return id;},
    cancelAnimationFrame:key => frames.delete(key),
    addEventListener:(type, fn) => {events[type] = fn;},
    ResizeObserver:class {observe() {}}, MutationObserver:class {observe() {}},
  };
  context.window = {scrollTo:({top}) => {context.scrollY = top;}};
  vm.runInNewContext(readFileSync(new URL('../js/work-scroll.mjs', import.meta.url), 'utf8'), context);
  await Promise.resolve();
  return {cards, frames, document, documentEvents, atmosphere,
    scroll(progress) {context.scrollY = 400 + Math.round(1305 * .85) * progress; events.scroll();},
    tick(ms) {now += ms; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now));},
    writes:() => writes,
  };
}

const verticalOffset = card => Number(card.style.transform.match(/translate3d\(0,([^p]+)px/)[1]);

test('coarse wheel steps slide over frames, reverse continuously, and settle without idle work', async () => {
  const x = await setup();
  x.scroll(.65);
  for (let i=0; i<60; i++) x.tick(1000/60);
  x.scroll(.95); x.scroll(.95);
  assert.equal(x.frames.size, 1, 'scroll events share a frame');
  x.tick(1000/60);
  const first = verticalOffset(x.cards[1]);
  assert(first > 470 && first < 940, 'first frame should soften the wheel jump');
  x.tick(1000/60);
  const second = verticalOffset(x.cards[1]);
  assert(second < first);
  x.scroll(.65); x.tick(1000/60);
  assert(verticalOffset(x.cards[1]) > second, 'reversal should start immediately');
  for (let i=0; i<100; i++) x.tick(1000/60);
  assert.equal(x.frames.size, 0);
  const writes = x.writes();
  x.scroll(.65); x.tick(1000/60);
  assert.equal(x.writes(), writes, 'unchanged scroll position should not rewrite styles or accessibility state');
});

test('background geometry stays unchanged through forward and reverse scrolling', async () => {
  const x = await setup();
  const geometry = {...x.atmosphere.style};
  assert.equal(geometry['--work-pin-distance'], '2218px');
  assert.equal(geometry['--work-atmosphere-top'], '-400px');
  for (const progress of [0, .8, 1, 2, 1, 0]) {
    x.scroll(progress);
    for (let i=0; i<60; i++) x.tick(1000/60);
    assert.deepEqual({...x.atmosphere.style}, geometry);
  }
});

test('elapsed-time easing has the same position at 60Hz and 120Hz', async () => {
  const a = await setup(), b = await setup();
  a.scroll(.95); b.scroll(.95);
  for (let i=0; i<12; i++) a.tick(1000/60);
  for (let i=0; i<24; i++) b.tick(1000/120);
  assert(Math.abs(verticalOffset(a.cards[1]) - verticalOffset(b.cards[1])) < 1e-10);
});

test('hiding a tab cancels the pending scroll frame and resumes from the same position', async () => {
  const x = await setup();
  x.scroll(.95); x.tick(160);
  const position = verticalOffset(x.cards[1]);
  x.document.hidden = true;
  x.documentEvents.visibilitychange();
  x.scroll(.95);
  assert.equal(x.frames.size, 0);
  x.tick(5000);
  assert.equal(verticalOffset(x.cards[1]), position);
  x.document.hidden = false;
  x.documentEvents.visibilitychange();
  assert.equal(x.frames.size, 1);
  x.tick(16);
  assert(verticalOffset(x.cards[1]) < position);
  assert(verticalOffset(x.cards[1]) > 0, 'a hidden interval must not jump straight to the target');
});

test('turning motion off cancels a pending blend and restores all cards', async () => {
  const x = await setup();
  x.scroll(.95); x.tick(16);
  assert.equal(x.frames.size, 1);
  x.document.documentElement.dataset.motion = 'off';
  x.documentEvents['portfolio:motionchange']();
  assert.equal(x.frames.size, 0);
  assert.equal(x.atmosphere.style['--work-pin-distance'], undefined);
  assert.equal(x.atmosphere.style['--work-atmosphere-top'], undefined);
  for (const card of x.cards) {
    assert.equal(card.inert, false);
    assert.equal(card.style.opacity, undefined);
    assert.equal(card.style.transform, undefined);
    assert.equal(card.style.clipPath, undefined);
    assert.equal(card.style.willChange, undefined);
  }
});

test('stacked glass cards never expose overlapping text and arrive at full size', async () => {
  const x = await setup();
  for (const progress of [.7, .825, .95]) {
    x.scroll(progress);
    for (let i=0; i<100; i++) x.tick(1000/60);
    const incomingTop = verticalOffset(x.cards[1]);
    const scale = Number(x.cards[0].style.transform.match(/scale\(([^)]+)/)[1]);
    const cut = Number(x.cards[0].style.clipPath.match(/inset\(0 0 ([^%]+)/)[1]);
    const outgoingBottom = 940 * scale * (1 - cut / 100);
    assert(Math.abs(outgoingBottom - incomingTop) < .001, 'outgoing content stops at the incoming card');
    assert.equal(x.cards[1].style.opacity, '1', 'incoming text stays solid');
    assert.equal(x.cards.filter(card => !card.inert).length, 1);
  }
  x.scroll(1);
  for (let i=0; i<100; i++) x.tick(1000/60);
  assert.equal(x.cards[0].style.visibility, 'hidden');
  assert.equal(x.cards[1].style.transform, 'translate3d(0,0px,0) scale(1)');
  assert.equal(x.cards[1].style.clipPath, 'none');
});
