import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = file => readFileSync(new URL(`../js/${file}`, import.meta.url), 'utf8');

test('concurrent wave mounts decode one shared noise image', async () => {
  const wave = source('paper-wave.mjs');
  const sharedNoise = new Function(wave.slice(wave.indexOf('let noiseReady;'), wave.indexOf('for(const host')) + ';return sharedNoise;')();
  let images = 0, decodes = 0;
  const image = {decode: async () => {decodes++;}};
  const create = () => {images++; return image;};
  const results = await Promise.all([sharedNoise(create), sharedNoise(create), sharedNoise(create)]);
  assert.equal(images, 1);
  assert.equal(decodes, 1);
  assert.ok(results.every(result => result === image));
});

test('kinetic scheduler does no frame work on pages without kinetic scenes', () => {
  const kinetic = source('kinetics.mjs');
  const scheduleSource = kinetic.slice(kinetic.indexOf('function schedule('), kinetic.indexOf('function tick('));
  const run = new Function('states', `let frames=0, needsGeometry=false, frame=0;
    const motionPaused=()=>false, document={hidden:false}, tick=()=>{};
    const requestAnimationFrame=()=>++frames;
    ${scheduleSource}
    schedule(true);schedule(true);return frames;`);
  assert.equal(run([]), 0);
  assert.equal(run([{}]), 1);
});

test('scroll navigation reads About once and leaves unchanged attributes alone', () => {
  const demos = source('glass-demos.mjs');
  const syncSource = demos.slice(demos.indexOf('  const syncCurrent = () =>'), demos.indexOf('  const restoreNavigation ='));
  let reads = 0, writes = 0, inAbout = false;
  const about = {getBoundingClientRect: () => {reads++; return {top:inAbout ? 100 : 900, bottom:1800};}};
  const links = ['index.html', 'index.html#about', 'resume.html'].map((path, i) => {
    let current = i === 0 ? 'page' : null;
    return {url:new URL(path, 'https://example.com/'), link:{
      getAttribute:()=>current,
      setAttribute:(_, value)=>{writes++;current=value;},
      removeAttribute:()=>{writes++;current=null;},
    }};
  });
  const sync = new Function('about','destinations', `const home=true,innerHeight=1000;${syncSource};return syncCurrent;`)(about, links);
  sync();sync();
  assert.equal(reads, 2);
  assert.equal(writes, 0);
  inAbout = true;
  sync();sync();
  assert.equal(reads, 4);
  assert.equal(writes, 2);
  assert.equal(links[1].link.getAttribute(), 'location');
});

test('navigation coalesces scroll and resize, reading geometry before header writes', () => {
  const demos = source('glass-demos.mjs');
  const scheduler = demos.slice(demos.indexOf('  let navFrame=0;'), demos.indexOf('  const home ='));
  const sync = demos.slice(demos.indexOf('  const syncCurrent = () =>'), demos.indexOf('  const restoreNavigation ='));
  const events = {}, frames = [], order = [];
  const about = {getBoundingClientRect: () => {order.push('read'); return {top:900,bottom:1800};}};
  const header = {classList:{toggle: () => order.push('write')}};
  const create = new Function('about','header','addEventListener','requestAnimationFrame',
    `const home=true,innerHeight=1000,scrollY=100,destinations=[];${scheduler}${sync}`);
  create(about, header, (type, listener) => {events[type] = listener;}, callback => frames.push(callback));
  events.scroll(); events.scroll(); events.resize();
  assert.equal(frames.length, 1);
  frames[0]();
  assert.deepEqual(order, ['read', 'write']);
  events.scroll();
  assert.equal(frames.length, 2);
});
