import { createProgram } from './vendor/paper/create-program.js?v=a876f9fa3017';
import { vertexShaderSource } from './vendor/paper/vertex-shader.js?v=cd9856f2e071';
import { waveFragmentShader } from './wave-shader.mjs?v=e022c55e4682';
import { cacheWaveNoise } from './wave-noise-cache.mjs?v=0af8ec7a553f';

const isTexture = value => value && typeof value === 'object'
  && !Array.isArray(value) && Number.isFinite(value.width) && Number.isFinite(value.height);

// GPU state only. The host supplies physical dimensions; the worker owns time.
export class WaveRenderer {
  program = null;
  positionBuffer = null;
  uniformLocations = {};
  uniformCache = {};
  textures = new Map();
  textureUnitMap = new Map();
  beforeDraw = null;
  resolutionChanged = true;
  renderScale = 1;
  hasBeenDisposed = false;

  constructor(canvas, uniforms, { frame = 0 } = {}) {
    this.canvasElement = canvas;
    this.providedUniforms = { ...uniforms };
    this.frame = frame;
    this.gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!this.gl) throw new Error('Wave WebGL2 context is unavailable');
    try {
      const gl = this.gl;
      this.program = createProgram(gl, vertexShaderSource, waveFragmentShader);
      if (!this.program) throw new Error('Wave shader compilation failed');
      this.positionBuffer = gl.createBuffer();
      if (!this.positionBuffer) throw new Error('Wave position buffer allocation failed');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(this.program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      this.setupUniforms();
      this.setUniformValues(this.providedUniforms);
      cacheWaveNoise(this, waveFragmentShader);
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  get cache() { return typeof this.beforeDraw === 'function'; }
  get cacheMode() { return this.cache ? 'cached' : 'original'; }

  setupUniforms() {
    this.uniformLocations = Object.fromEntries(
      [...Object.keys(this.providedUniforms), 'u_time', 'u_resolution', 'u_pixelRatio']
        .map(name => [name, this.gl.getUniformLocation(this.program, name)]));
  }

  setUniformValues(values) {
    const gl = this.gl;
    gl.useProgram(this.program);
    for (const [name, value] of Object.entries(values)) {
      const location = this.uniformLocations[name];
      if (location === null || location === undefined || this.uniformCache[name] === value) continue;
      this.uniformCache[name] = value;
      if (isTexture(value)) {
        if (!value.width || !value.height) throw new Error('Wave noise bitmap is empty');
        const old = this.textures.get(name);
        if (old) gl.deleteTexture(old);
        if (!this.textureUnitMap.has(name)) this.textureUnitMap.set(name, this.textureUnitMap.size);
        const unit = this.textureUnitMap.get(name);
        const texture = gl.createTexture();
        if (!texture) throw new Error('Wave noise texture allocation failed');
        this.textures.set(name, texture);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, value);
        if (gl.getError() !== gl.NO_ERROR) throw new Error('Wave noise texture upload failed');
        gl.uniform1i(location, unit);
      } else if (Array.isArray(value)) {
        const size = Array.isArray(value[0]) ? value[0].length : value.length;
        const flat = value.flat();
        if (size >= 2 && size <= 4) gl[`uniform${size}fv`](location, flat);
        else if (size === 9 || size === 16) gl[`uniformMatrix${Math.sqrt(size)}fv`](location, false, flat);
      } else if (typeof value === 'number') gl.uniform1f(location, value);
      else if (typeof value === 'boolean') gl.uniform1i(location, value ? 1 : 0);
    }
  }

  // Kept as a bound function because the shared grain cache wraps this method.
  setUniforms = (values, paint = true) => {
    this.setUniformValues(values);
    this.providedUniforms = { ...this.providedUniforms, ...values };
    if (paint) this.render(this.frame);
  };

  resize({ width, height, renderScale }, uniforms) {
    if (this.hasBeenDisposed) return;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1
      || !Number.isFinite(renderScale) || renderScale <= 0) throw new Error('Invalid wave dimensions');
    if (uniforms) this.setUniforms(uniforms, false);
    const canvas = this.canvasElement;
    if (canvas.width !== width || canvas.height !== height || this.renderScale !== renderScale) {
      this.renderScale = renderScale;
      canvas.width = width;
      canvas.height = height;
      this.gl.viewport(0, 0, width, height);
      this.resolutionChanged = true;
    }
    this.render(this.frame);
  }

  setFrame(frame) { this.render(frame); }

  render(frame = this.frame) {
    if (this.hasBeenDisposed) return;
    this.frame = frame;
    const gl = this.gl;
    this.beforeDraw?.();
    // The two triangles overwrite every pixel, including transparent background.
    // Blending and depth testing are disabled; a preceding clear is redundant.
    gl.useProgram(this.program);
    gl.uniform1f(this.uniformLocations.u_time, frame * 1e-3);
    if (this.resolutionChanged) {
      gl.uniform2f(this.uniformLocations.u_resolution, this.canvasElement.width, this.canvasElement.height);
      gl.uniform1f(this.uniformLocations.u_pixelRatio, this.renderScale);
      this.resolutionChanged = false;
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose = () => {
    if (this.hasBeenDisposed) return;
    this.hasBeenDisposed = true;
    this.beforeDraw = null;
    const gl = this.gl;
    for (const texture of this.textures.values()) gl.deleteTexture(texture);
    this.textures.clear();
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.program) gl.deleteProgram(this.program);
    this.positionBuffer = null;
    this.program = null;
    this.uniformCache = {};
    this.uniformLocations = {};
  };
}
