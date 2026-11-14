import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const sectionSource = readFileSync(new URL('../js/section-reveals.mjs', import.meta.url), 'utf8');
const sceneSource = readFileSync(new URL('../js/demo-scenes.mjs', import.meta.url), 'utf8');
const sceneCode = sceneSource.slice(sceneSource.indexOf('export function createScene'), sceneSource.indexOf('const roots ='));
const sectionCode = sectionSource.slice(sectionSource.indexOf('const ease ='), sectionSource.indexOf('const items ='));
const context = vm.createContext({ innerHeight: 800 });
vm.runInContext(`${sceneCode}\n${sectionCode}`.replaceAll('export function ', 'function '), context);

function node(tag = 'div', children = []) {
  const target = {
    tag, children, dataset: {}, offsetTop: 0, top: 900, effects: [],
    closest: () => null,
    matches: selector => selector.split(',').includes(tag),
    getBoundingClientRect() { return { top: this.top, bottom: this.top + 100, left: 0, right: 400 }; },
    querySelector(selector) {
      return selector === '.section-reveal-rule' ? this.children.find(child => child.isRule) || null : null;
    },
    querySelectorAll(selector) {
      assert.equal(selector, ':scope > h3,:scope > p');
      return this.children.filter(child => child.tag === 'h3' || child.tag === 'p');
    },
    animate(frames, options) {
      let finish;
      const effect = {
        frames, options, plays: 0, paused: false, cancelled: false,
        finished: new Promise(resolve => { finish = resolve; }),
        pause() { this.paused = true; },
        play() { this.paused = false; this.plays++; },
        cancel() { this.cancelled = true; finish(); },
        finish: () => finish(),
      };
      this.effects.push(effect);
      return effect;
    },
  };
  children.forEach(child => { child.parentElement = target; });
  return target;
}

function setup(target = node('h2'), kind = 'copy') {
  let allowed = true;
  const item = context.createSectionReveal(target, () => context.sectionRecipe(target, kind),
    (root, recipe, allowedByDefault, entryInset) => context.createScene(root, recipe, () => allowed, entryInset));
  return {
    item, target,
    allow: value => { allowed = value; },
    approach() { target.top = 900; item.onApproach(true); },
    reveal() { target.top = 180; item.onVisible(true); },
    leave() { target.top = 900; item.onVisible(false); item.onApproach(false); },
  };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('editorial content prepares before entry, plays once, and never replays after leaving', async () => {
  const x = setup();
  x.item.sync();
  assert.equal(x.target.effects.length, 0);
  x.approach();
  const first = x.target.effects[0];
  assert.equal(first.paused, true);
  assert.equal(first.currentTime, 0);
  assert.equal(x.target.dataset.sceneState, 'prepared');
  x.reveal();
  x.item.onVisible(true);
  assert.equal(first.plays, 1);
  first.finish();
  await flush();
  assert.equal(first.cancelled, true);
  assert.equal(x.target.dataset.sceneState, 'settled');
  x.leave();
  x.approach();
  x.reveal();
  x.item.sync();
  assert.equal(x.target.effects.length, 1);
  assert.equal(first.plays, 1);
});

test('leaving during entry settles the unfinished effect without preparing a replay', async () => {
  const x = setup();
  x.approach();
  x.reveal();
  x.leave();
  assert.equal(x.target.effects[0].cancelled, true);
  x.approach();
  x.reveal();
  await flush();
  assert.equal(x.target.effects.length, 1);
  assert.equal(x.target.dataset.sceneState, 'settled');
});

test('an abandoned approach can rearm before the first actual entry', async () => {
  const x = setup();
  x.approach();
  x.item.onVisible(false);
  x.item.onApproach(false);
  assert.equal(x.target.effects[0].cancelled, true);
  assert.equal(x.target.effects[0].plays, 0);
  x.approach();
  assert.equal(x.target.effects.length, 2);
  assert.equal(x.target.effects[1].paused, true);
  x.reveal();
  await flush();
  assert.equal(x.target.effects[1].plays, 1);
  assert.equal(x.target.effects[1].cancelled, false);
  assert.equal(x.target.dataset.sceneState, 'playing');
});

test('keyboard settling cancels prepared motion and rejects a delayed visibility callback', async () => {
  const x = setup();
  x.approach();
  x.item.settle();
  assert.equal(x.target.effects[0].cancelled, true);
  x.reveal();
  x.leave();
  x.approach();
  x.allow(false);
  x.item.sync();
  x.allow(true);
  x.item.sync();
  x.reveal();
  await flush();
  assert.equal(x.target.effects.length, 1);
  assert.equal(x.target.effects[0].plays, 0);
  assert.equal(x.target.dataset.sceneState, 'settled');
});

test('direct jumps keep already readable content settled for the rest of the visit', () => {
  const x = setup();
  x.target.top = 180;
  x.item.onApproach(true);
  x.reveal();
  assert.equal(x.target.effects.length, 0);
  x.leave();
  x.approach();
  x.reveal();
  assert.equal(x.target.effects.length, 0);
  assert.equal(x.target.dataset.sceneState, 'settled');
});

test('a delayed approach still primes content inside the bottom inset before its reading-area reveal', () => {
  const x = setup();
  x.target.top = 760;
  x.item.onApproach(true);
  assert.equal(x.target.effects.length, 1);
  assert.equal(x.target.effects[0].paused, true);
  assert.equal(x.target.effects[0].plays, 0);
  assert.equal(x.target.dataset.sceneState, 'prepared');
  x.reveal();
  assert.equal(x.target.effects[0].plays, 1);
  assert.equal(x.target.dataset.sceneState, 'playing');
});

test('the reading-area inset follows viewport resizing after the reveal was created', () => {
  const x = setup();
  try {
    context.innerHeight = 600;
    x.target.top = 460;
    x.item.onApproach(true);
    assert.equal(x.target.effects.length, 0, 'content inside the resized reading area stays readable');
    x.target.top = 500;
    x.item.onApproach(true);
    assert.equal(x.target.effects.length, 1, 'content in the resized bottom inset can still prepare');
    assert.equal(x.target.effects[0].paused, true);
    x.item.onApproach(false);
    assert.equal(x.target.effects[0].cancelled, true);
    context.innerHeight = 1000;
    x.target.top = 830;
    x.item.onApproach(true);
    assert.equal(x.target.effects.length, 2, 'growing the viewport also updates the preparation boundary');
    assert.equal(x.target.effects[1].paused, true);
  } finally {
    context.innerHeight = 800;
    x.item.settle();
  }
});

function principle(offsetTop = 0) {
  const rule = node('span');
  rule.isRule = true;
  const card = node('li', [node('h3'), node('p'), rule]);
  card.offsetTop = offsetTop;
  return card;
}

test('principle staggering follows columns and resets at the next row and stacked mobile layout', () => {
  const cards = [principle(0), principle(0), principle(0), principle(300), principle(300)];
  node('ul', cards);
  const headingDelay = card => context.sectionRecipe(card, 'principle').find(part => part.node.tag === 'h3').options.delay;
  const delays = cards.map(headingDelay);
  assert.equal(delays[1] - delays[0], 70);
  assert.equal(delays[2] - delays[1], 70);
  assert.equal(delays[3], delays[0]);
  assert.equal(delays[4], delays[1]);
  cards.forEach((card, index) => { card.offsetTop = index * 300; });
  assert.deepEqual(cards.map(headingDelay), cards.map(() => delays[0]));
});

test('nested tool pills have their own recipe without animating their parent or duplicating transforms', () => {
  const tools = node('ul', [node('li', [node('img')]), node('li', [node('img')])]);
  const card = principle();
  card.children.push(tools);
  tools.parentElement = card;
  const cardParts = Array.from(context.sectionRecipe(card, 'principle'));
  const toolParts = Array.from(context.sectionRecipe(tools, 'tools'));
  assert.deepEqual(cardParts.map(part => part.node), card.children.filter(child => child !== tools).sort((a, b) => Number(b.isRule || false) - Number(a.isRule || false)));
  assert.deepEqual(toolParts.map(part => part.node), tools.children);
  assert.ok(toolParts[1].options.delay > toolParts[0].options.delay);
  const transformed = [...cardParts, ...toolParts].filter(part => part.frames.some(frame => frame.transform)).map(part => part.node);
  for (const target of transformed) {
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      assert.equal(transformed.includes(parent), false, 'a revealed node must not also inherit a parent reveal transform');
    }
  }
});

test('below-fold tools retain their entrance after the containing principle finishes', async () => {
  const tools = node('ul', [node('li'), node('li')]);
  const card = principle();
  card.children.push(tools);
  tools.parentElement = card;
  const upper = setup(card, 'principle');
  const lower = setup(tools, 'tools');
  upper.approach();
  upper.reveal();
  card.children.flatMap(child => child.effects).forEach(effect => effect.finish());
  await flush();
  assert.equal(card.dataset.sceneState, 'settled');
  assert.ok(tools.children.every(pill => pill.effects.length === 0));
  lower.approach();
  assert.ok(tools.children.every(pill => pill.effects.length === 1 && pill.effects[0].paused));
  lower.reveal();
  assert.ok(tools.children.every(pill => pill.effects[0].plays === 1));
  assert.equal(card.dataset.sceneState, 'settled');
  assert.equal(tools.dataset.sceneState, 'playing');
});
