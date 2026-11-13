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

const copyUniformValue = value => Array.isArray(value) ? value.map(copyUniformValue) : value;
const sameUniformValue = (left, right) => Array.isArray(left) && Array.isArray(right)
  ? left.length === right.length && left.every((value, index) => sameUniformValue(value, right[index]))
  : Object.is(left, right);
const sameUniforms = (left, right) => Object.keys(left).length === Object.keys(right).length
  && Object.entries(left).every(([name, value]) => Object.hasOwn(right, name) && sameUniformValue(value, right[name]));

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
    let worker, resize, intersection, timer, updateFrame = 0, ownerFrame = 0;
    let disposed = false, ready = false, sent = false, box;
    let visible = true, desiredSpeed = options.speed, lastSpeed;
    let ownerPaused = true, ownerLastTime = null, ownerHealthy = 0;
    let ownerDeadline = 0, ownerRenewedAt = -Infinity;
    let phaseFrame = options.frame ?? 0, phaseTime = performance.now();
    let uniforms = {...options.uniforms}, maxPixelCount = options.maxPixelCount;
    let lastSize, lastUniforms, nextId = 0;
    const pending = new Map();
    const size = () => waveSize(box, {
      dpr: devicePixelRatio, pinchZoom: visualViewport?.scale ?? 1,
      browserZoom: browserZoom(), minPixelRatio: options.minPixelRatio ?? 1, maxPixelCount,
    });
    const effectiveSpeed = () => !document.hidden && visible ? desiredSpeed : 0;
    const currentFrame = () => phaseFrame + (ready && !ownerPaused ? (performance.now() - phaseTime) * (lastSpeed ?? 0) : 0);
    const post = message => {if (!disposed) worker.postMessage(message);};
    const revokeOwner = () => {
      if (ownerDeadline) post({type: 'owner', deadline: 0});
      ownerDeadline = 0; ownerRenewedAt = -Infinity;
    };
    const stopOwner = () => {
      if (ownerFrame) cancelAnimationFrame(ownerFrame);
      ownerFrame = 0; ownerLastTime = null; ownerHealthy = 0;
      revokeOwner();
    };
    const probeOwner = () => {
      ownerFrame = 0;
      if (disposed || effectiveSpeed() === 0) {stopOwner(); return;}
      const time = performance.now();
      if (ownerLastTime !== null) {
        const interval = time - ownerLastTime;
        if (interval > 250 || interval < 0) {
          ownerHealthy = 0; revokeOwner();
        } else if (interval > 0 && interval <= 100) ownerHealthy = Math.min(2, ownerHealthy + 1);
        else if (ownerHealthy < 2) ownerHealthy = 0;
      }
      ownerLastTime = time;
      if (ownerHealthy === 2 && time - ownerRenewedAt >= 150) {
        ownerDeadline = performance.timeOrigin + time + 500;
        ownerRenewedAt = time;
        post({type: 'owner', deadline: ownerDeadline});
      }
      // Keep probing while the worker is suspended: an occluded owner may only
      // receive one callback per second, then recover its normal cadence.
      ownerFrame = requestAnimationFrame(probeOwner);
    };
    const syncOwner = () => {
      if (!sent || disposed) return;
      if (effectiveSpeed() === 0) stopOwner();
      else if (!ownerFrame) ownerFrame = requestAnimationFrame(probeOwner);
    };
    const syncSpeed = () => {
      if (!sent || disposed) return;
      const speed = effectiveSpeed();
      if (speed !== lastSpeed) {
        phaseFrame = currentFrame(); phaseTime = performance.now();
        lastSpeed = speed; post({type: 'speed', speed});
      }
      syncOwner();
    };
    const stopObservers = () => {
      resize?.disconnect(); intersection?.disconnect();
      document.removeEventListener('visibilitychange', syncSpeed);
      visualViewport?.removeEventListener('resize', observeSize);
      if (updateFrame) cancelAnimationFrame(updateFrame);
      stopOwner();
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
      delete host.dataset.waveOwner;
      clearPending(error);
      if (ready) options.onError?.({error, frame}); else reject(error);
    };
    const flush = () => {
      updateFrame = 0;
      if (disposed || !box || box.width <= 0 || box.height <= 0) return;
      const nextSize = size();
      // Re-observing an unchanged viewport and reapplying startup settings must
      // not interrupt the worker's frame loop with an identical extra draw.
      if (sent && nextSize.width === lastSize.width && nextSize.height === lastSize.height
        && nextSize.renderScale === lastSize.renderScale && sameUniforms(uniforms, lastUniforms)) return;
      if (!sent) {
        const offscreen = canvas.transferControlToOffscreen();
        sent = true; lastSize = nextSize; lastSpeed = effectiveSpeed();
        worker.postMessage({type: 'init', canvas: offscreen, uniforms, size: nextSize,
          frame: options.frame, speed: lastSpeed, ownerLeaseMs: 500, debug: Boolean(options.debug)}, [offscreen]);
        syncOwner();
      } else {
        lastSize = nextSize;
        post({type: 'update', uniforms, size: nextSize});
      }
      // Match the values structured-cloned to the worker, including nested
      // color arrays whose caller may reuse or mutate the original objects.
      lastUniforms = Object.fromEntries(Object.entries(uniforms).map(([name, value]) => [name, copyUniformValue(value)]));
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
        delete host.dataset.waveOwner;
        try {worker.postMessage({type: 'dispose'});} catch {}
        // Termination releases the worker's context even if it cannot acknowledge.
        timer = setTimeout(() => worker.terminate(), 500);
      },
    };
    try {
      worker = new Worker(new URL('./wave-worker.mjs?v=b55ad3cdd63c', import.meta.url), {type: 'module', name: 'portfolio-wave'});
      worker.addEventListener('error', event => {
        event.preventDefault(); fail(new Error(event.message || 'Wave worker failed.'));
      });
      worker.addEventListener('message', ({data}) => {
        if (data.type === 'disposed') {clearTimeout(timer); worker.terminate(); return;}
        if (disposed) return;
        if (data.type === 'error') {fail(new Error(data.message || 'Wave worker failed.'), data.frame); return;}
        if (data.type === 'ready') {
          phaseFrame = data.frame; phaseTime = performance.now();
          ownerPaused = data.ownerPaused ?? true;
          host.dataset.waveOwner = ownerPaused ? 'paused' : 'active';
          ready = true; clearTimeout(timer);
          host.dataset.waveRenderer = 'worker';
          if (data.cache) host.dataset.waveNoiseCache = 'ready';
          resolve(api);
        } else if (data.type === 'owner-status') {
          phaseFrame = data.frame; phaseTime = performance.now();
          ownerPaused = data.paused;
          host.dataset.waveOwner = ownerPaused ? 'paused' : 'active';
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
