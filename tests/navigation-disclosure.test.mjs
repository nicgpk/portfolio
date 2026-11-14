import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

function disclosure() {
  const source = readFileSync(new URL('../js/glass-demos.mjs', import.meta.url), 'utf8');
  const handlers = source.slice(source.indexOf('  nav.addEventListener("click"'), source.indexOf('  document.addEventListener(', source.indexOf('  nav.addEventListener("click"')));
  const events = {}, tasks = [], microtasks = [], changes = [];
  const link = {inside:true}, outside = {}, document = {activeElement:outside};
  const nav = {addEventListener:(name, handler) => {events[name] = handler;}};
  const header = {contains:node => node?.inside === true, addEventListener:nav.addEventListener};
  new Function('nav', 'header', 'document', 'setMenu', 'setTimeout', 'queueMicrotask', handlers)(
    nav, header, document, (...args) => changes.push(args), callback => tasks.push(callback), callback => microtasks.push(callback),
  );
  const flush = queue => {while (queue.length) queue.shift()();};
  return {events, link, outside, document, changes, flushMicrotasks:() => flush(microtasks), flushTasks:() => flush(tasks)};
}

test('touch focus transfer within the menu does not close it while activeElement is temporarily body', () => {
  const x = disclosure();
  x.events.focusout({relatedTarget:x.link});
  x.flushMicrotasks();
  assert.deepEqual(x.changes, []);
  x.document.activeElement = x.link;
  x.flushTasks();
  assert.deepEqual(x.changes, []);
});

test('a missing focus destination settles before dismissal and an outside destination closes the menu', () => {
  const x = disclosure();
  x.events.focusout({relatedTarget:null});
  x.flushMicrotasks();
  assert.deepEqual(x.changes, []);
  x.document.activeElement = x.link;
  x.flushTasks();
  assert.deepEqual(x.changes, []);
  x.events.focusout({relatedTarget:x.outside});
  x.document.activeElement = x.outside;
  x.flushTasks();
  assert.deepEqual(x.changes, [[false]]);
});

test('native link activation finishes before menu dismissal without stealing destination focus', () => {
  const x = disclosure();
  x.events.click({target:{closest:() => x.link},button:0});
  x.flushMicrotasks();
  assert.deepEqual(x.changes, []);
  x.flushTasks();
  assert.deepEqual(x.changes, [[false]]);
});

test('modified, cancelled and non-link clicks keep their native behavior', () => {
  const x = disclosure();
  for (const modifier of ['ctrlKey','metaKey','shiftKey','altKey','defaultPrevented']) {
    x.events.click({target:{closest:() => x.link},button:0,[modifier]:true});
  }
  x.events.click({target:{closest:() => x.link},button:1});
  x.events.click({target:{closest:() => null},button:0});
  x.flushMicrotasks();x.flushTasks();
  assert.deepEqual(x.changes, []);
});
