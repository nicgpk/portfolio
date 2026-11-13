import { WaveRenderer } from './wave-renderer.mjs?v=2b5ca47330d1';
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
  let frame = 0, speed = 0, lastTime = 0, raf = null, rafVersion = 0;
  let uniforms = {}, size = null, debug = false;
  let hasSpeed = false, hasFrame = false, initialized = false, disposed = false;
  let generation = 0;
  let ownerLeaseMs = 0, ownerDeadline = 0, ownerHighWater = 0, ownerPaused = false;
  const now = () => scope.performance.now();
  const epoch = time => (Number.isFinite(scope.performance.timeOrigin) ? scope.performance.timeOrigin : 0) + time;
  const stop = () => {
    rafVersion++;
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
  const checkOwner = (time = now()) => {
    if (!ownerLeaseMs) return true;
    if (!renderer) return false;
    const paused = ownerDeadline <= epoch(time);
    if (paused !== ownerPaused) {
      ownerPaused = paused;
      stop();
      // Freeze at the last painted frame; suspended time is never caught up.
      lastTime = time;
      scope.postMessage({ type: 'owner-status', paused, frame });
    }
    if (paused) stop();
    return !paused;
  };
  const schedule = () => {
    if (!disposed && renderer && speed !== 0 && raf === null && checkOwner()) {
      const version = rafVersion;
      raf = scope.requestAnimationFrame(time => { if (version === rafVersion) tick(time); });
    }
  };
  const tick = time => {
    raf = null;
    if (disposed || !renderer || speed === 0) return;
    try {
      if (!checkOwner()) return;
      frame += (time - lastTime) * speed;
      lastTime = time;
      renderer.render(frame);
      schedule();
    } catch (error) { fail(error); }
  };
  const advance = () => {
    const time = now();
    if (checkOwner(time) && speed !== 0) frame += (time - lastTime) * speed;
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
          if (data.ownerLeaseMs !== undefined && (!Number.isFinite(data.ownerLeaseMs) || data.ownerLeaseMs < 0))
            throw new Error('Invalid wave owner lease');
          ownerLeaseMs = data.ownerLeaseMs ?? 0;
          ownerPaused = ownerLeaseMs > 0;
          debug = Boolean(data.debug);
          const source = await loadNoise();
          if (disposed || token !== generation) { source.close?.(); return; }
          bitmap = source;
          canvas.addEventListener?.('webglcontextlost', contextLost);
          renderer = new Renderer(canvas, { ...uniforms, u_noiseTexture: bitmap }, { frame });
          renderer.resize(size);
          scope.postMessage({ type: 'ready', cache: Boolean(renderer.cache),
            cacheMode: renderer.cacheMode, size: { ...size }, frame, ownerPaused });
          lastTime = now();
          checkOwner(lastTime);
          schedule();
          break;
        }
        case 'owner': {
          if (!ownerLeaseMs) break;
          const time = now();
          // An old lease may have expired while a callback or heartbeat waited.
          // Observe that boundary before accepting its replacement.
          if (renderer) checkOwner(time);
          if (data.deadline === 0) ownerDeadline = 0;
          else {
            if (!Number.isFinite(data.deadline) || data.deadline <= epoch(time)) break;
            const deadline = Math.min(data.deadline, epoch(time) + ownerLeaseMs);
            if (deadline <= ownerHighWater) break;
            ownerDeadline = deadline;
            ownerHighWater = deadline;
          }
          if (renderer) {
            checkOwner(time);
            schedule();
          }
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
