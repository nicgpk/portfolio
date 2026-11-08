// The DOM owns layout and visibility. All WebGL calls stay in the worker.
const shaderStyle = `@layer paper-shaders {
  :where([data-paper-shader]) {
    isolation: isolate;
    position: relative;
    & canvas {
      contain: strict;
      display: block;
      position: absolute;
      inset: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      corner-shape: inherit;
    }
  }
}`;

// Same sizing formula and budgets as the reference ShaderMount, including zoom.
export function waveSize(box, {dpr = 1, pinchZoom = 1, browserZoom = 1, minPixelRatio = 1, maxPixelCount}) {
  let width, height;
  dpr = Math.max(1, dpr);
  if (box.deviceWidth !== undefined) {
    const scale = Math.max(1, minPixelRatio / dpr) * pinchZoom;
    width = box.deviceWidth * scale; height = box.deviceHeight * scale;
  } else {
    const scale = Math.max(dpr, minPixelRatio) * pinchZoom * Math.max(1, browserZoom);
    width = Math.round(box.width) * scale; height = Math.round(box.height) * scale;
  }
  const limit = Math.min(1, Math.sqrt(maxPixelCount) / Math.sqrt(width * height));
  const pixels = {width: Math.round(width * limit), height: Math.round(height * limit)};
  return {...pixels, renderScale: pixels.width / Math.round(box.width)};
}

function browserZoom() {
  const ua = navigator.userAgent.toLowerCase();
  if (!ua.includes('safari') || ua.includes('chrome') || ua.includes('android')) return 1;
  const viewportScale = visualViewport?.scale ?? 1;
  const viewportWidth = visualViewport?.width ?? innerWidth;
  const scrollbarWidth = innerWidth - document.documentElement.clientWidth;
  const ratio = outerWidth / (viewportScale * viewportWidth + scrollbarWidth);
  const rounded = Math.round(100 * ratio);
  if (rounded % 5 === 0) return rounded / 100;
  if (rounded === 33) return 1 / 3;
  if (rounded === 67) return 2 / 3;
  if (rounded === 133) return 4 / 3;
  return ratio;
}

export function createWorkerWave(host, options) {
  if (typeof Worker !== 'function' || typeof OffscreenCanvas !== 'function'
    || !HTMLCanvasElement.prototype.transferControlToOffscreen) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('style[data-paper-shader]')) {
      const style = document.createElement('style'); style.dataset.paperShader = '';
      style.textContent = shaderStyle; document.head.prepend(style);
    }
    host.prepend(canvas); host.setAttribute('data-paper-shader', '');
    let worker, resize, intersection, timer, updateFrame = 0;
    let disposed = false, ready = false, sent = false, box;
    let visible = true, desiredSpeed = options.speed, lastSpeed;
    let phaseFrame = options.frame ?? 0, phaseTime = performance.now();
    let uniforms = {...options.uniforms}, maxPixelCount = options.maxPixelCount;
    let lastSize, nextId = 0;
    const pending = new Map();
    const size = () => waveSize(box, {
      dpr: devicePixelRatio, pinchZoom: visualViewport?.scale ?? 1,
      browserZoom: browserZoom(), minPixelRatio: options.minPixelRatio ?? 1, maxPixelCount,
    });
    const effectiveSpeed = () => !document.hidden && visible ? desiredSpeed : 0;
    const currentFrame = () => phaseFrame + (ready ? (performance.now() - phaseTime) * (lastSpeed ?? 0) : 0);
    const post = message => {if (!disposed) worker.postMessage(message);};
    const syncSpeed = () => {
      if (!sent || disposed) return;
      const speed = effectiveSpeed();
      if (speed !== lastSpeed) {
        phaseFrame = currentFrame(); phaseTime = performance.now();
        lastSpeed = speed; post({type: 'speed', speed});
      }
    };
    const stopObservers = () => {
      resize?.disconnect(); intersection?.disconnect();
      document.removeEventListener('visibilitychange', syncSpeed);
      visualViewport?.removeEventListener('resize', observeSize);
      if (updateFrame) cancelAnimationFrame(updateFrame);
      clearTimeout(timer);
    };
    const clearPending = error => {
      for (const request of pending.values()) {clearTimeout(request.timer); request.reject(error);}
      pending.clear();
    };
    const fail = (error, frame) => {
      if (disposed) return;
      frame ??= currentFrame();
      disposed = true; stopObservers(); worker?.terminate(); canvas.remove();
      delete host.dataset.waveNoiseCache; delete host.dataset.waveRenderer;
      clearPending(error);
      if (ready) options.onError?.({error, frame}); else reject(error);
    };
    const flush = () => {
      updateFrame = 0;
      if (disposed || !box || box.width <= 0 || box.height <= 0) return;
      const nextSize = size();
      if (!sent) {
        const offscreen = canvas.transferControlToOffscreen();
        sent = true; lastSize = nextSize; lastSpeed = effectiveSpeed();
        worker.postMessage({type: 'init', canvas: offscreen, uniforms, size: nextSize,
          frame: options.frame, speed: lastSpeed, debug: Boolean(options.debug)}, [offscreen]);
      } else {
        lastSize = nextSize;
        post({type: 'update', uniforms, size: nextSize});
      }
    };
    const queueUpdate = () => {
      if (!disposed && !updateFrame) updateFrame = requestAnimationFrame(() => {
        try {flush();} catch (error) {fail(error);}
      });
    };
    function observeSize() {resize?.disconnect(); resize?.observe(host);}
    const api = {
      canvasElement: canvas,
      setUniformsAndMaxPixelCount(values, budget) {
        uniforms = {...uniforms, ...values}; maxPixelCount = budget; queueUpdate();
      },
      setSpeed(speed) {desiredSpeed = speed; syncSpeed();},
      get size() {return lastSize;},
      // Fixed-frame readback is enabled only by the local comparison harness.
      readFrame(frame) {
        if (!options.debug || disposed) return Promise.reject(new Error('Frame readback is unavailable.'));
        if (updateFrame) {cancelAnimationFrame(updateFrame); flush();}
        const id = ++nextId;
        return new Promise((resolveFrame, rejectFrame) => {
          const timer = setTimeout(() => {pending.delete(id); rejectFrame(new Error('Frame readback timed out.'));}, 15000);
          pending.set(id, {resolve: resolveFrame, reject: rejectFrame, timer});
          post({type: 'frame', id, frame, pixels: true});
        });
      },
      dispose() {
        if (disposed) return;
        disposed = true; stopObservers(); canvas.remove(); clearPending(new Error('Wave disposed.'));
        try {worker.postMessage({type: 'dispose'});} catch {}
        // Termination releases the worker's context even if it cannot acknowledge.
        timer = setTimeout(() => worker.terminate(), 500);
      },
    };
    try {
      worker = new Worker(new URL('./wave-worker.mjs?v=76b1863358d4', import.meta.url), {type: 'module', name: 'portfolio-wave'});
      worker.addEventListener('error', event => {
        event.preventDefault(); fail(new Error(event.message || 'Wave worker failed.'));
      });
      worker.addEventListener('message', ({data}) => {
        if (data.type === 'disposed') {clearTimeout(timer); worker.terminate(); return;}
        if (disposed) return;
        if (data.type === 'error') {fail(new Error(data.message || 'Wave worker failed.'), data.frame); return;}
        if (data.type === 'ready') {
          phaseFrame = data.frame; phaseTime = performance.now();
          ready = true; clearTimeout(timer);
          host.dataset.waveRenderer = 'worker';
          if (data.cache) host.dataset.waveNoiseCache = 'ready';
          resolve(api);
        } else if (data.type === 'frame') {
          phaseFrame = data.frame; phaseTime = performance.now();
          const request = pending.get(data.id);
          if (request) {pending.delete(data.id); clearTimeout(request.timer); request.resolve(data);}
        }
      });
      resize = new ResizeObserver(([entry]) => {
        if (!entry || disposed) return;
        const border = entry.borderBoxSize?.[0], physical = entry.devicePixelContentBoxSize?.[0];
        box = {width: border?.inlineSize ?? entry.contentRect.width,
          height: border?.blockSize ?? entry.contentRect.height,
          deviceWidth: physical?.inlineSize, deviceHeight: physical?.blockSize};
        queueUpdate();
      });
      intersection = new IntersectionObserver(([entry]) => {visible = entry?.isIntersecting ?? true; syncSpeed();});
      intersection.observe(host); resize.observe(host);
      document.addEventListener('visibilitychange', syncSpeed);
      visualViewport?.addEventListener('resize', observeSize);
      timer = setTimeout(() => fail(new Error('Wave worker initialization timed out.')), 15000);
    } catch (error) {fail(error);}
  });
}
