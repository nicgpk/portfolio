import { createProgram } from './vendor/paper/shader-mount.js';
import { vertexShaderSource } from './vendor/paper/vertex-shader.js';

// These two fields depend on position, not time. Keep their original full
// floating-point values at the original pixel budget instead of recomputing
// simplex noise and 48 texture reads for every pixel of every animation frame.
export function cachedNoiseSources(fragment) {
  const start = fragment.indexOf('  float baseNoise =');
  const end = fragment.indexOf('\n  shape += u_intensity', start);
  if (start < 0 || end < 0) return null;
  return {
    noise: fragment.slice(0, end) + '\n  fragColor = vec4(grainDist, noise, 0., 1.);\n}',
    wave: fragment.slice(0, start)
      + '  vec2 cachedGrain = texelFetch(u_cachedGrain, ivec2(gl_FragCoord.xy), 0).rg;\n'
      + '  float grainDist = cachedGrain.r;\n  float noise = cachedGrain.g;\n'
      + fragment.slice(end),
  };
}

export function cacheWaveNoise(mount, fragment) {
  const gl = mount.gl, sources = cachedNoiseSources(fragment);
  // Unsupported devices keep the exact original renderer.
  if (!sources || !gl.getExtension('EXT_color_buffer_float')) return false;
  const noiseProgram = createProgram(gl, vertexShaderSource, sources.noise);
  const waveProgram = createProgram(gl, vertexShaderSource,
    sources.wave.replace('uniform sampler2D u_noiseTexture;',
      'uniform sampler2D u_noiseTexture;\nuniform highp sampler2D u_cachedGrain;'));
  if (!noiseProgram || !waveProgram) {
    if (noiseProgram) gl.deleteProgram(noiseProgram);
    if (waveProgram) gl.deleteProgram(waveProgram);
    return false;
  }
  const texture = gl.createTexture(), framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) {
    if (texture) gl.deleteTexture(texture);
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    gl.deleteProgram(noiseProgram); gl.deleteProgram(waveProgram);
    return false;
  }
  const originalProgram = mount.program;
  const originalUniforms = { ...mount.providedUniforms };
  const setUniforms = mount.setUniforms, dispose = mount.dispose;
  const locations = Object.fromEntries(
    [...Object.keys(originalUniforms), 'u_resolution', 'u_pixelRatio']
      .map(name => [name, gl.getUniformLocation(noiseProgram, name)]));
  let width = 0, height = 0, pixelRatio = 0, dirty = true, active = true;
  const release = () => {
    gl.deleteTexture(texture); gl.deleteFramebuffer(framebuffer);
    gl.deleteProgram(noiseProgram);
  };
  const restore = () => {
    active = false; mount.beforeDraw = null;
    mount.program = originalProgram;
    mount.providedUniforms.u_noiseTexture = originalUniforms.u_noiseTexture;
    mount.uniformCache = {}; mount.setupUniforms();
    mount.setUniformValues(mount.providedUniforms);
    mount.resolutionChanged = true;
    gl.deleteProgram(waveProgram); release();
    delete mount.parentElement.dataset.waveNoiseCache;
  };
  mount.beforeDraw = () => {
    const canvas = mount.canvasElement;
    if (!active || !canvas.width || !canvas.height) return;
    if (dirty || width !== canvas.width || height !== canvas.height || pixelRatio !== mount.renderScale) {
      pixelRatio = mount.renderScale;
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texture);
      if (width !== canvas.width || height !== canvas.height) {
        width = canvas.width; height = canvas.height;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, width, height, 0, gl.RG, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); restore(); return;
      }
      gl.useProgram(noiseProgram);
      for (const [name, value] of Object.entries(mount.providedUniforms)) {
        const location = locations[name];
        if (location === null || location === undefined) continue;
        if (typeof value === 'number') gl.uniform1f(location, value);
        else if (Array.isArray(value)) {
          const flat = value.flat(), size = Array.isArray(value[0]) ? value[0].length : value.length;
          if (size >= 2 && size <= 4) gl[`uniform${size}fv`](location, flat);
        }
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, mount.textures.get('u_noiseTexture'));
      gl.uniform1i(locations.u_noiseTexture, 0);
      gl.uniform2f(locations.u_resolution, width, height);
      gl.uniform1f(locations.u_pixelRatio, mount.renderScale);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      dirty = false;
    }
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texture);
  };
  mount.program = waveProgram;
  // The main pass no longer reads the source noise image, but the bake retains it.
  delete mount.providedUniforms.u_noiseTexture;
  mount.uniformCache = {}; mount.setupUniforms();
  mount.setUniformValues(mount.providedUniforms);
  gl.uniform1i(gl.getUniformLocation(waveProgram, 'u_cachedGrain'), 1);
  mount.resolutionChanged = true;
  mount.setUniforms = values => { dirty = true; setUniforms(values); };
  mount.dispose = () => {
    if (active) { release(); gl.deleteProgram(originalProgram); active = false; }
    mount.beforeDraw = null; dispose();
  };
  mount.parentElement.dataset.waveNoiseCache = 'ready';
  return true;
}
