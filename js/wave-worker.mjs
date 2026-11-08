import { WaveRenderer } from './wave-renderer.mjs?v=f2a7962f5552';
import { noiseSrc } from './vendor/paper/get-shader-noise-texture.js?v=d0d1b0de0a4f';

export async function loadNoiseBitmap() {
  const response = await fetch(noiseSrc);
  if (!response.ok) throw new Error('Wave noise image could not be loaded');
  return createImageBitmap(await response.blob(), {
    imageOrientation: 'from-image', premultiplyAlpha: 'none', colorSpaceConversion: 'none',
  });
}

export function createWaveWorkerController(scope, { Renderer = WaveRenderer, loadNoise = loadNoiseBitmap } = {}) {
  let renderer = null, bitmap = null, canvas = null;
  let frame = 0, speed = 0, lastTime = 0, raf = null;
  let uniforms = {}, size = null, debug = false;
  let hasSpeed = false, hasFrame = false, initialized = false, disposed = false;
  let generation = 0;
  const now = () => scope.performance.now();
  const stop = () => {
    if (raf !== null) scope.cancelAnimationFrame(raf);
    raf = null;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    generation++;
    stop();
    canvas?.removeEventListener?.('webglcontextlost', contextLost);
    renderer?.dispose();
    renderer = null;
    // Keep the bitmap alive until disposal: cache fallback may upload it again.
    bitmap?.close?.();
    bitmap = null;
    scope.removeEventListener?.('message', receive);
  };
  const fail = error => {
    if (disposed) return;
    const message = error instanceof Error ? error.message : String(error);
    dispose();
    scope.postMessage({ type: 'error', message, frame });
  };
  const contextLost = () => fail(new Error('Wave WebGL context was lost'));
  const schedule = () => {
    if (!disposed && renderer && speed !== 0 && raf === null) raf = scope.requestAnimationFrame(tick);
  };
  const tick = time => {
    raf = null;
    if (disposed || !renderer || speed === 0) return;
    try {
      frame += (time - lastTime) * speed;
      lastTime = time;
      renderer.render(frame);
      schedule();
    } catch (error) { fail(error); }
  };
  const advance = () => {
    const time = now();
    if (speed !== 0) frame += (time - lastTime) * speed;
    lastTime = time;
  };
  const repaint = () => {
    advance();
    renderer.frame = frame;
    renderer.resize(size, uniforms);
    stop();
    schedule();
  };
  const diagnostic = data => {
    const reply = { type: 'frame', id: data.id, frame,
      width: canvas.width, height: canvas.height };
    const transfer = [];
    if (debug && data.pixels) {
      const gl = renderer.gl;
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      reply.pixels = pixels.buffer;
      transfer.push(pixels.buffer);
    }
    scope.postMessage(reply, transfer);
  };

  async function handleMessage(data) {
    if (disposed || !data) return;
    try {
      switch (data.type) {
        case 'init': {
          if (initialized) throw new Error('Wave worker is already initialized');
          initialized = true;
          const token = ++generation;
          if (typeof scope.requestAnimationFrame !== 'function' || typeof scope.cancelAnimationFrame !== 'function')
            throw new Error('Worker animation frames are unavailable');
          const probe = scope.requestAnimationFrame(() => {});
          scope.cancelAnimationFrame(probe);
          canvas = data.canvas;
          uniforms = { ...data.uniforms, ...uniforms };
          size = size || data.size;
          if (!hasFrame) frame = data.frame ?? 0;
          if (!hasSpeed) speed = data.speed ?? 0;
          if (!Number.isFinite(frame) || !Number.isFinite(speed)) throw new Error('Invalid wave clock');
          debug = Boolean(data.debug);
          const source = await loadNoise();
          if (disposed || token !== generation) { source.close?.(); return; }
          bitmap = source;
          canvas.addEventListener?.('webglcontextlost', contextLost);
          renderer = new Renderer(canvas, { ...uniforms, u_noiseTexture: bitmap }, { frame });
          renderer.resize(size);
          scope.postMessage({ type: 'ready', cache: Boolean(renderer.cache),
            cacheMode: renderer.cacheMode, size: { ...size }, frame });
          lastTime = now();
          schedule();
          break;
        }
        case 'update':
          uniforms = { ...uniforms, ...data.uniforms };
          if (data.size) size = data.size;
          if (renderer) repaint();
          break;
        case 'speed': {
          if (!Number.isFinite(data.speed)) throw new Error('Invalid wave speed');
          hasSpeed = true;
          speed = data.speed;
          if (speed === 0) stop();
          else if (renderer && raf === null) { lastTime = now(); schedule(); }
          break;
        }
        case 'frame':
          if (!Number.isFinite(data.frame)) throw new Error('Invalid wave frame');
          hasFrame = true;
          frame = data.frame;
          if (renderer) {
            lastTime = now();
            renderer.setFrame(frame);
            stop();
            schedule();
            diagnostic(data);
          }
          break;
        case 'dispose':
          dispose();
          scope.postMessage({ type: 'disposed', frame });
          break;
      }
    } catch (error) { fail(error); }
  }
  function receive(event) { void handleMessage(event.data); }
  scope.addEventListener('message', receive);
  return { handleMessage, dispose };
}

if (typeof DedicatedWorkerGlobalScope !== 'undefined' && globalThis instanceof DedicatedWorkerGlobalScope)
  createWaveWorkerController(globalThis);
