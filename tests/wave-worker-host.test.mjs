import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorkerWave, waveSize} from '../js/wave-worker-host.mjs';

function hostFixture(t, {supported = true} = {}) {
  let time = 1000, id = 0;
  const frames = new Map(), timers = new Map(), workers = [], sizes = [], intersections = [], styles = [];
  const events = () => ({
    listeners:new Map(),
    addEventListener(type, callback) {this.listeners.set(type, callback);},
    removeEventListener(type, callback) {
      if (this.listeners.get(type) === callback) this.listeners.delete(type);
    },
    emit(type, event = {}) {this.listeners.get(type)?.(event);},
  });
  const host = {dataset:{}, canvases:[], attributes:new Map(),
    prepend(canvas) {this.canvases.unshift(canvas); canvas.parent = this;},
    setAttribute(name, value) {this.attributes.set(name, value);},
  };
  class Canvas {
    constructor() {this.attributes = new Map(); this.transfers = 0;}
    setAttribute(name, value) {this.attributes.set(name, value);}
    transferControlToOffscreen() {
      assert.equal(this.transfers++, 0, 'transfer happens only once per canvas');
      return {kind:'offscreen'};
    }
    remove() {
      if (this.parent) this.parent.canvases = this.parent.canvases.filter(canvas => canvas !== this);
      this.parent = null;
    }
  }
  class Worker {
    constructor(url, options) {
      Object.assign(this, events());
      this.url = url; this.options = options; this.messages = []; this.terminations = 0;
      workers.push(this);
    }
    postMessage(message, transfer = []) {this.messages.push({message, transfer});}
    terminate() {this.terminations++;}
  }
  const observer = list => class {
    constructor(callback) {this.callback = callback; this.disconnections = 0; list.push(this);}
    observe(target) {this.target = target;}
    disconnect() {this.target = null; this.disconnections++;}
  };
  const document = {...events(), hidden:false,
    createElement:name => name === 'canvas' ? new Canvas() : {dataset:{}, textContent:''},
    querySelector:() => styles[0] ?? null,
    head:{prepend:style => styles.unshift(style)}, documentElement:{clientWidth:1000},
  };
  const viewport = {...events(), scale:1, width:1000};
  const globals = {
    Worker:supported ? Worker : undefined, OffscreenCanvas:class {}, HTMLCanvasElement:Canvas,
    document, navigator:{userAgent:'Chrome'}, devicePixelRatio:1,
    visualViewport:viewport, innerWidth:1000, outerWidth:1000,
    performance:{now:() => time}, ResizeObserver:observer(sizes), IntersectionObserver:observer(intersections),
    requestAnimationFrame:callback => {frames.set(++id, callback); return id;},
    cancelAnimationFrame:frame => frames.delete(frame),
    setTimeout:(callback, delay) => {timers.set(++id, {callback, delay}); return id;},
    clearTimeout:timer => timers.delete(timer),
  };
  const descriptors = Object.fromEntries(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, {configurable:true, writable:true, value});
  t.after(() => {
    workers.forEach(worker => {if (!worker.terminations) worker.terminate();});
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const options = extra => ({uniforms:{u_scale:1.3}, speed:0.18, frame:12000,
    minPixelRatio:1, maxPixelCount:800000, ...extra});
  const resize = (width = 1000, height = 800) => sizes[0].callback([{
    borderBoxSize:[{inlineSize:width, blockSize:height}], contentRect:{width, height},
  }]);
  const flush = () => {
    const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(time));
  };
  const ready = () => {
    const init = workers[0].messages.find(({message}) => message.type === 'init').message;
    workers[0].emit('message', {data:{type:'ready', cache:true, cacheMode:'cached', size:init.size, frame:init.frame}});
  };
  return {host, document, viewport, workers, sizes, intersections, frames, timers, styles,
    options, resize, flush, ready,
    setTime:value => {time = value;},
    async start(extra) {
      const pending = createWorkerWave(host, options(extra)); resize(); flush(); ready(); return pending;
    },
    error(message = 'fixture worker failed') {
      const event = {message, prevented:false, preventDefault() {this.prevented = true;}};
      workers[0].emit('error', event); return event;
    },
  };
}

for (const [name, box, options, expected] of [
  ['desktop capped budget', {width:1000, height:800}, {dpr:2, maxPixelCount:800000}, {width:1000, height:800, renderScale:1}],
  ['mobile capped budget', {width:300, height:600}, {dpr:2, maxPixelCount:450000}, {width:474, height:949, renderScale:1.58}],
  ['device-pixel dimensions and pinch zoom', {width:300, height:200, deviceWidth:600, deviceHeight:400}, {dpr:2, pinchZoom:1.5, browserZoom:2, maxPixelCount:800000}, {width:900, height:600, renderScale:3}],
  ['fallback dimensions round CSS pixels before browser zoom', {width:300.4, height:200.4}, {dpr:2, pinchZoom:1.5, browserZoom:1.25, maxPixelCount:800000}, {width:1095, height:730, renderScale:3.65}],
  ['minimum pixel ratio', {width:300, height:200}, {dpr:0.5, minPixelRatio:2, maxPixelCount:800000}, {width:600, height:400, renderScale:2}],
]) test('physical wave sizing preserves ' + name, () => {
  assert.deepEqual(waveSize(box, options), expected);
});

test('unsupported workers leave the host untouched for the main renderer fallback', async t => {
  const f = hostFixture(t, {supported:false});
  assert.equal(await createWorkerWave(f.host, f.options()), null);
  assert.equal(f.host.canvases.length, 0);
  assert.equal(f.styles.length, 0);
  assert.equal(f.sizes.length, 0);
});

test('generic post-ready failure estimates the current phase and cleans pending readback', async t => {
  const f = hostFixture(t), failures = [];
  const api = await f.start({debug:true, onError:failure => failures.push(failure)});
  const readback = api.readFrame(18000);
  const rejected = assert.rejects(readback, /fixture worker failed/);
  f.setTime(2000);
  assert.equal(f.error().prevented, true);
  await rejected;
  assert.equal(failures.length, 1);
  assert.equal(failures[0].frame, 12180);
  assert.equal(f.workers[0].terminations, 1);
  assert.equal(f.host.canvases.length, 0);
  assert.equal(f.host.dataset.waveRenderer, undefined);
  assert.equal(f.timers.size, 0);
  assert.equal(f.document.listeners.has('visibilitychange'), false);
  assert.equal(f.viewport.listeners.has('resize'), false);
  assert.ok(f.sizes[0].disconnections > 0);
  assert.ok(f.intersections[0].disconnections > 0);
});

test('offscreen, reduced-speed and tab visibility gates retain desired speed and paused phase', async t => {
  const f = hostFixture(t), failures = [];
  const pending = createWorkerWave(f.host, f.options({onError:failure => failures.push(failure)}));
  f.intersections[0].callback([{isIntersecting:false}]);
  f.resize(); f.flush();
  const worker = f.workers[0];
  assert.equal(worker.messages[0].message.speed, 0, 'offscreen initialization never autoplays');
  f.ready(); const api = await pending;
  f.intersections[0].callback([{isIntersecting:true}]);
  f.setTime(2000); api.setSpeed(0);
  f.setTime(5000); f.document.hidden = true; f.document.emit('visibilitychange');
  api.setSpeed(0.18);
  assert.deepEqual(worker.messages.filter(({message}) => message.type === 'speed').map(({message}) => message.speed), [0.18, 0]);
  f.setTime(7000); f.document.hidden = false; f.document.emit('visibilitychange');
  assert.equal(worker.messages.at(-1).message.speed, 0.18);
  f.setTime(8000); f.error();
  assert.equal(failures[0].frame, 12360, 'five paused seconds do not advance the fallback phase');
});

test('exact protocol failure phase takes precedence over the host estimate', async t => {
  const f = hostFixture(t), failures = [];
  await f.start({onError:failure => failures.push(failure)});
  f.setTime(10000);
  f.workers[0].emit('message', {data:{type:'error', message:'fixture draw failed', frame:12345}});
  assert.equal(failures[0].frame, 12345);
  assert.equal(f.host.canvases.length, 0);
  assert.equal(f.workers[0].terminations, 1);
});

test('successful readback updates phase anchor and clears its timeout', async t => {
  const f = hostFixture(t), failures = [];
  const api = await f.start({debug:true, speed:0, onError:failure => failures.push(failure)});
  const readback = api.readFrame(14600);
  const request = f.workers[0].messages.at(-1).message;
  const reply = {type:'frame', id:request.id, frame:14600, width:1000, height:800, pixels:new ArrayBuffer(4)};
  f.workers[0].emit('message', {data:reply});
  assert.equal(await readback, reply);
  assert.equal(f.timers.size, 0);
  f.setTime(10000); f.error();
  assert.equal(failures[0].frame, 14600);
});

test('resize and composition updates coalesce without transferring the canvas twice', async t => {
  const f = hostFixture(t), api = await f.start();
  api.setUniformsAndMaxPixelCount({u_scale:0.85}, 450000);
  api.setUniformsAndMaxPixelCount({u_rotation:18}, 450000);
  f.resize(300, 600);
  assert.equal(f.frames.size, 1);
  f.flush();
  const messages = f.workers[0].messages;
  assert.equal(messages.filter(({message}) => message.type === 'init').length, 1);
  assert.equal(messages.filter(({message}) => message.type === 'update').length, 1);
  assert.deepEqual(messages.at(-1).message.uniforms, {u_scale:0.85, u_rotation:18});
  assert.equal(api.canvasElement.transfers, 1);
  api.dispose();
});

test('disposal rejects pending requests, cancels queued updates and accepts a final acknowledgement', async t => {
  const f = hostFixture(t), api = await f.start({debug:true});
  const readback = api.readFrame(18000);
  const rejected = assert.rejects(readback, /Wave disposed/);
  api.setUniformsAndMaxPixelCount({u_scale:0.85}, 450000);
  api.dispose(); api.dispose();
  await rejected;
  assert.equal(f.frames.size, 0);
  assert.equal(f.host.canvases.length, 0);
  assert.equal(f.workers[0].messages.filter(({message}) => message.type === 'dispose').length, 1);
  assert.equal(f.timers.size, 1, 'only the bounded termination fallback remains');
  f.workers[0].emit('message', {data:{type:'disposed', frame:12000}});
  assert.equal(f.timers.size, 0);
  assert.equal(f.workers[0].terminations, 1);
});

test('initialization failure rejects startup and removes the transferred placeholder', async t => {
  const f = hostFixture(t), failures = [];
  const pending = createWorkerWave(f.host, f.options({onError:failure => failures.push(failure)}));
  f.resize(); f.flush();
  const rejected = assert.rejects(pending, /fixture worker failed/);
  f.error(); await rejected;
  f.ready();
  assert.equal(failures.length, 0, 'post-ready fallback callback is not used before ready');
  assert.equal(f.host.canvases.length, 0);
  assert.equal(f.host.dataset.waveRenderer, undefined);
  assert.equal(f.workers[0].terminations, 1);
  assert.equal(f.timers.size, 0);
});
