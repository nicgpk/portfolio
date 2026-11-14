import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function setup() {
  let allowed = true, top = 900;
  const root = { dataset: {}, getBoundingClientRect: () => ({top,bottom:top+300,left:0,right:800}) };
  const effects = [];
  const node = {
    closest: () => null,
    getBoundingClientRect: () => ({top,bottom:top+100,left:0,right:100}),
    animate: () => {
      let finish;
      const effect = {
        cancelled: false, paused: false, plays: 0,
        finished: new Promise(resolve => { finish = resolve; }),
        pause() { this.paused = true; },
        play() { this.paused = false; this.plays++; },
        cancel() { this.cancelled = true; finish(); },
        finish: () => finish(),
      };
      effects.push(effect); return effect;
    },
  };
  const source = readFileSync(new URL('../js/demo-scenes.mjs', import.meta.url), 'utf8');
  const code = source.slice(source.indexOf('export function createScene'), source.indexOf('const roots =')).replace('export ', '');
  const context = vm.createContext({ innerHeight:800 });
  vm.runInContext(code, context);
  const scene = context.createScene(root, () => [{node,frames:[],options:{}}], () => allowed);
  return {
    scene, root, effects, node, allow: value => { allowed = value; },
    approach: () => scene.setApproach(true),
    reveal: () => { top = 180; scene.setVisible(true); },
    leave: () => { top = 900; scene.setVisible(false); },
    move: value => { top = value; },
  };
}

test('a group prepares outside the viewport and plays once at its reveal', () => {
  const x=setup();x.scene.sync();assert.equal(x.effects.length,0);
  x.approach();assert.equal(x.effects.length,1);assert.equal(x.effects[0].paused,true);
  assert.equal(x.root.dataset.sceneState,'prepared');assert.equal(x.effects[0].currentTime,0);
  x.reveal();assert.equal(x.effects[0].plays,1);assert.equal(x.root.dataset.sceneState,'playing');
  x.reveal();x.scene.sync();assert.equal(x.effects[0].plays,1);
});

test('direct jumps into already-readable content do not dim or reposition it', () => {
  const x=setup();x.move(180);x.approach();x.reveal();
  assert.equal(x.effects.length,0);assert.equal(x.root.dataset.sceneState,'settled');
});

test('full exit rearms within the approach margin without a second approach event', async () => {
  const x=setup();x.approach();x.reveal();x.leave();
  assert.equal(x.effects[0].cancelled,true);assert.equal(x.effects.length,2);
  assert.equal(x.effects[1].paused,true);x.reveal();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(x.root.dataset.sceneState,'playing');assert.equal(x.effects[1].plays,1);
});

test('finished groups release their fill effects and remain settled until leaving', async () => {
  const x=setup();x.approach();x.reveal();x.effects[0].finish();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(x.effects[0].cancelled,true);assert.equal(x.root.dataset.sceneState,'settled');
  x.reveal();x.scene.sync();assert.equal(x.effects.length,1);
});

test('moving away before reveal releases the prepared pose without playing', () => {
  const x=setup();x.approach();x.scene.setApproach(false);
  assert.equal(x.effects[0].cancelled,true);assert.equal(x.effects[0].plays,0);
  assert.equal(x.root.dataset.sceneState,'waiting');
});

test('reduced motion and hidden documents settle both prepared and playing effects', () => {
  const x=setup();x.allow(false);x.approach();assert.equal(x.effects.length,0);
  x.allow(true);x.scene.sync();assert.equal(x.effects.length,1);
  x.allow(false);x.scene.sync();assert.equal(x.effects[0].cancelled,true);
  x.allow(true);x.scene.sync();x.reveal();assert.equal(x.effects[1].plays,1);
  x.allow(false);x.scene.sync();assert.equal(x.effects[1].cancelled,true);
});

test('keyboard focus and editing settle delayed motion and prevent future reveals', () => {
  const x=setup();x.approach();x.scene.takeControl();
  assert.equal(x.effects[0].cancelled,true);assert.equal(x.effects[0].plays,0);
  x.reveal();x.leave();x.scene.setApproach(false);x.approach();x.reveal();
  assert.equal(x.effects.length,1);
});

test('hidden and horizontally clipped content are never primed', () => {
  const x=setup();x.node.closest=()=>({});x.approach();assert.equal(x.effects.length,0);
  x.node.closest=()=>null;x.node.getBoundingClientRect=()=>({top:900,bottom:1000,left:900,right:1000});
  x.scene.setApproach(false);x.approach();assert.equal(x.effects.length,0);
});

test('later groups retain their entrance after earlier content has completed', async () => {
  const upper=setup(),lower=setup();upper.approach();upper.reveal();upper.effects[0].finish();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(lower.effects.length,0);lower.approach();lower.reveal();
  assert.equal(lower.effects[0].plays,1);assert.equal(lower.root.dataset.sceneState,'playing');
});
