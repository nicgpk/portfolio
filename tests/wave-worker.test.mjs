import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWaveWorkerController} from '../js/wave-worker.mjs';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
}

function worker({loadNoise, raf = 'supported', constructorError = false} = {}) {
  let time = 1000, nextFrame = 0, bitmapCloses = 0, pixelReads = 0;
  const frames = new Map(), listeners = new Map(), canvasListeners = new Map();
  const messages = [], instances = [], paints = [];
  const bitmap = {width:128, height:128, close:() => {bitmapCloses++;}};
  const canvas = {
    width:1, height:1,
    addEventListener:(type, callback) => canvasListeners.set(type, callback),
    removeEventListener:(type, callback) => {
      if (canvasListeners.get(type) === callback) canvasListeners.delete(type);
    },
  };
  class Renderer {
    constructor(target, uniforms, {frame}) {
      if (constructorError) throw new Error('fixture renderer initialization failed');
      this.canvas = target;
      this.uniforms = {...uniforms};
      this.frame = frame;
      this.cache = true;
      this.cacheMode = 'cached';
      this.disposals = 0;
      this.gl = {
        RGBA:'rgba', UNSIGNED_BYTE:'byte',
        readPixels:(x, y, width, height, format, type, pixels) => {
          pixelReads++;
          assert.deepEqual([width, height], [canvas.width, canvas.height]);
          for (let i = 0; i < pixels.length; i++) pixels[i] = i % 256;
        },
      };
      instances.push(this);
    }
    resize(size, uniforms = {}) {
      this.canvas.width = size.width;
      this.canvas.height = size.height;
      this.uniforms = {...this.uniforms, ...uniforms};
      this.render(this.frame);
    }
    render(frame) {
      assert.equal(this.disposals, 0, 'a disposed renderer never paints');
      if (this.failRender) throw new Error('fixture draw failed');
      this.frame = frame;
      paints.push({frame, size:[canvas.width, canvas.height], uniforms:{...this.uniforms}});
    }
    setFrame(frame) {this.render(frame);}
    dispose() {this.disposals++;}
  }
  const scope = {
    performance:{now:() => time},
    requestAnimationFrame:callback => {
      if (raf === 'throws') throw new DOMException('Worker rAF is unsupported', 'NotSupportedError');
      frames.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelAnimationFrame:id => frames.delete(id),
    addEventListener:(type, callback) => listeners.set(type, callback),
    removeEventListener:(type, callback) => {
      if (listeners.get(type) === callback) listeners.delete(type);
    },
    postMessage:(message, transfer = []) => messages.push({message, transfer}),
  };
  if (raf === 'missing') delete scope.requestAnimationFrame;
  const controller = createWaveWorkerController(scope, {
    Renderer, loadNoise:loadNoise ?? (async () => bitmap),
  });
  const init = overrides => ({type:'init', canvas, uniforms:{u_scale:1.3},
    size:{width:64, height:48, renderScale:1}, frame:12000, speed:0, ...overrides});
  return {
    controller, scope, canvas, bitmap, messages, instances, paints, frames, listeners,
    init,
    send:data => controller.handleMessage(data),
    setTime:value => {time = value;},
    step(value) {
      time = value;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback(value));
    },
    loseContext:() => canvasListeners.get('webglcontextlost')?.({}),
    bitmapCloses:() => bitmapCloses,
    pixelReads:() => pixelReads,
    ready:() => messages.filter(({message}) => message.type === 'ready'),
    errors:() => messages.filter(({message}) => message.type === 'error'),
  };
}

test('the installed worker message handler paints one static frame before ready', async () => {
  const w = worker();
  w.listeners.get('message')({data:w.init()});
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(w.instances.length, 1);
  assert.equal(w.paints.length, 1);
  assert.equal(w.paints[0].frame, 12000);
  assert.equal(w.instances[0].uniforms.u_noiseTexture, w.bitmap);
  assert.deepEqual(w.ready()[0].message, {
    type:'ready', cache:true, cacheMode:'cached',
    size:{width:64, height:48, renderScale:1}, frame:12000,
  });
  assert.equal(w.frames.size, 0, 'speed zero has no recurring work');
  w.controller.dispose();
});

test('pause and resume preserve phase without adding the paused interval', async () => {
  const w = worker();
  await w.send(w.init({speed:0.18}));
  assert.equal(w.frames.size, 1);
  w.step(1100);
  assert.equal(w.paints.at(-1).frame, 12018);
  assert.equal(w.frames.size, 1, 'exactly one future animation frame');
  await w.send({type:'speed', speed:0});
  w.step(6100);
  assert.equal(w.paints.length, 2);
  await w.send({type:'speed', speed:0.18});
  w.step(6200);
  assert.equal(w.paints.at(-1).frame, 12036);
  w.controller.dispose();
});

test('negative wave speed keeps the existing reverse animation clock', async () => {
  const w = worker();
  await w.send(w.init({frame:38000, speed:-0.12}));
  w.step(1250);
  assert.equal(w.paints.at(-1).frame, 37970);
  w.step(1500);
  assert.equal(w.paints.at(-1).frame, 37940);
  w.controller.dispose();
});

test('offscreen or reduced-motion speed zero updates once without autoplay', async () => {
  const w = worker();
  await w.send(w.init());
  w.setTime(1500);
  await w.send({type:'update', uniforms:{u_scale:0.85},
    size:{width:80, height:60, renderScale:0.75}});
  assert.equal(w.paints.length, 2);
  assert.deepEqual(w.paints.at(-1).size, [80, 60]);
  assert.equal(w.paints.at(-1).uniforms.u_scale, 0.85);
  assert.equal(w.paints.at(-1).frame, 12000);
  assert.equal(w.frames.size, 0);
  w.step(9000);
  assert.equal(w.paints.length, 2);
  w.controller.dispose();
});

test('a running update paints final dimensions and uniforms in one clock step', async () => {
  const w = worker();
  await w.send(w.init({speed:0.18}));
  w.setTime(1050);
  await w.send({type:'update', uniforms:{u_scale:0.85},
    size:{width:80, height:60, renderScale:0.75}});
  assert.equal(w.paints.length, 2);
  assert.deepEqual(w.paints.at(-1), {
    frame:12009, size:[80, 60], uniforms:{u_scale:0.85, u_noiseTexture:w.bitmap},
  });
  assert.equal(w.frames.size, 1);
  w.step(1100);
  assert.equal(w.paints.at(-1).frame, 12018);
  w.controller.dispose();
});

test('updates, pause and a fixed frame sent during decoding win over stale init state', async () => {
  const noise = deferred();
  const w = worker({loadNoise:() => noise.promise});
  const pending = w.send(w.init({speed:0.18}));
  await w.send({type:'speed', speed:0});
  await w.send({type:'update', uniforms:{u_scale:0.85},
    size:{width:80, height:60, renderScale:0.75}});
  await w.send({type:'frame', frame:4500});
  noise.resolve(w.bitmap);
  await pending;
  assert.equal(w.paints.length, 1);
  assert.equal(w.paints[0].frame, 4500);
  assert.deepEqual(w.paints[0].size, [80, 60]);
  assert.equal(w.instances[0].uniforms.u_scale, 0.85);
  assert.equal(w.frames.size, 0);
  w.controller.dispose();
});

test('disposal during decoding closes the late bitmap without creating or reviving a renderer', async () => {
  const noise = deferred();
  const w = worker({loadNoise:() => noise.promise});
  const pending = w.send(w.init({speed:0.18}));
  await w.send({type:'dispose'});
  noise.resolve(w.bitmap);
  await pending;
  await w.send({type:'speed', speed:0.18});
  await w.send(w.init());
  assert.equal(w.instances.length, 0);
  assert.equal(w.ready().length, 0);
  assert.equal(w.bitmapCloses(), 1);
  assert.equal(w.frames.size, 0);
  assert.equal(w.listeners.has('message'), false);
});

for (const raf of ['missing', 'throws']) test('unsupported worker rAF fails cleanly: ' + raf, async () => {
  const w = worker({raf});
  await w.send(w.init({speed:0.18}));
  assert.equal(w.errors().length, 1);
  assert.equal(w.instances.length, 0);
  assert.equal(w.ready().length, 0);
  assert.equal(w.frames.size, 0);
  assert.equal(w.listeners.has('message'), false);
});

test('a duplicate initialization disposes the existing renderer and reports one error', async () => {
  const w = worker();
  await w.send(w.init({speed:0.18}));
  await w.send(w.init());
  assert.equal(w.instances.length, 1);
  assert.equal(w.instances[0].disposals, 1);
  assert.equal(w.bitmapCloses(), 1);
  assert.equal(w.errors().length, 1);
  assert.equal(w.frames.size, 0);
});

test('noise loading failure reports an error without ready or scheduled frames', async () => {
  const w = worker({loadNoise:async () => {throw new Error('fixture decode failed');}});
  await w.send(w.init({speed:0.18}));
  assert.equal(w.errors().length, 1);
  assert.match(w.errors()[0].message.message, /decode failed/);
  assert.equal(w.ready().length, 0);
  assert.equal(w.frames.size, 0);
});

test('renderer initialization failure releases the decoded bitmap', async () => {
  const w = worker({constructorError:true});
  await w.send(w.init({speed:0.18}));
  assert.equal(w.errors().length, 1);
  assert.equal(w.ready().length, 0);
  assert.equal(w.bitmapCloses(), 1);
  assert.equal(w.frames.size, 0);
});

test('draw failure stops the loop and releases resources before reporting fallback state', async () => {
  const w = worker();
  await w.send(w.init({speed:0.18}));
  w.instances[0].failRender = true;
  w.step(1100);
  assert.equal(w.errors().length, 1);
  assert.equal(w.errors()[0].message.frame, 12018);
  assert.equal(w.instances[0].disposals, 1);
  assert.equal(w.bitmapCloses(), 1);
  assert.equal(w.frames.size, 0);
  await w.send({type:'update', uniforms:{u_scale:2}});
  assert.equal(w.paints.length, 1);
});

test('context loss stops animation and reports the current phase once', async () => {
  const w = worker();
  await w.send(w.init({speed:0.18}));
  w.loseContext();
  w.loseContext();
  assert.equal(w.errors().length, 1);
  assert.match(w.errors()[0].message.message, /context was lost/);
  assert.equal(w.instances[0].disposals, 1);
  assert.equal(w.bitmapCloses(), 1);
  assert.equal(w.frames.size, 0);
});

for (const debug of [false, true]) test('fixed-frame diagnostics transfer pixels only when enabled: ' + debug, async () => {
  const w = worker();
  await w.send(w.init({debug}));
  await w.send({type:'frame', frame:18000, id:'comparison', pixels:true});
  const reply = w.messages.at(-1);
  assert.equal(reply.message.type, 'frame');
  assert.equal(reply.message.id, 'comparison');
  assert.equal(reply.message.frame, 18000);
  assert.equal(w.paints.at(-1).frame, 18000);
  assert.equal(w.frames.size, 0);
  if (debug) {
    assert.equal(w.pixelReads(), 1);
    assert.equal(reply.message.pixels.byteLength, 64 * 48 * 4);
    assert.equal(reply.transfer[0], reply.message.pixels);
    assert.equal(new Uint8Array(reply.message.pixels)[257], 1);
  } else {
    assert.equal(w.pixelReads(), 0);
    assert.equal(reply.message.pixels, undefined);
    assert.equal(reply.transfer.length, 0);
  }
  w.controller.dispose();
});

test('repeated disposal and a late animation callback cannot paint or double release', async () => {
  const w = worker();
  await w.send(w.init({speed:0.18}));
  const late = [...w.frames.values()][0];
  await w.send({type:'dispose'});
  await w.send({type:'dispose'});
  w.controller.dispose();
  late(4000);
  assert.equal(w.instances[0].disposals, 1);
  assert.equal(w.bitmapCloses(), 1);
  assert.equal(w.paints.length, 1);
  assert.equal(w.frames.size, 0);
  assert.equal(w.messages.filter(({message}) => message.type === 'disposed').length, 1);
});
