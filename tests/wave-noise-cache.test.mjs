import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cacheWaveNoise} from '../js/wave-noise-cache.mjs';
import {ShaderMount} from '../js/vendor/paper/shader-mount.js';
import {grainGradientFragmentShader} from '../js/vendor/paper/shaders/grain-gradient.js';

function renderer({supported = true, complete = true} = {}) {
  const resources = [], deletions = new Map(), draws = [], allocations = [];
  const uniforms = new Map(), textureUnits = new Map(), attachments = new Map();
  const state = {complete, framebuffer: null, program: null, textureUnit: 0};
  const create = kind => {
    const resource = {kind, id: resources.length};
    resources.push(resource);
    return resource;
  };
  const remove = resource => deletions.set(resource, (deletions.get(resource) ?? 0) + 1);
  const writeUniform = (location, value) => {
    assert.equal(state.program, location.program, 'uniform belongs to the active program');
    if (!uniforms.has(location.program)) uniforms.set(location.program, new Map());
    uniforms.get(location.program).set(location.name, Array.isArray(value) ? [...value] : value);
  };
  const gl = {
    VERTEX_SHADER: 'vertex', FRAGMENT_SHADER: 'fragment', MEDIUM_FLOAT: 'medium',
    COMPILE_STATUS: 'compiled', LINK_STATUS: 'linked',
    TEXTURE0: 0, TEXTURE1: 1, TEXTURE_2D: 'texture-2d',
    RG32F: 'rg32f', RG: 'rg', FLOAT: 'float',
    TEXTURE_MIN_FILTER: 'min', TEXTURE_MAG_FILTER: 'mag',
    TEXTURE_WRAP_S: 'wrap-s', TEXTURE_WRAP_T: 'wrap-t',
    NEAREST: 'nearest', CLAMP_TO_EDGE: 'clamp',
    FRAMEBUFFER: 'framebuffer', COLOR_ATTACHMENT0: 'color',
    FRAMEBUFFER_COMPLETE: 'complete', TRIANGLES: 'triangles',
    getExtension: name => supported && name === 'EXT_color_buffer_float' ? {} : null,
    getShaderPrecisionFormat: () => ({precision: 23}),
    createShader: () => create('shader'),
    shaderSource() {}, compileShader() {},
    getShaderParameter: () => true,
    deleteShader: remove,
    createProgram: () => create('program'),
    attachShader() {}, linkProgram() {}, detachShader() {},
    getProgramParameter: () => true,
    deleteProgram: remove,
    createTexture: () => create('texture'),
    deleteTexture: remove,
    createFramebuffer: () => create('framebuffer'),
    deleteFramebuffer: remove,
    getUniformLocation: (program, name) => ({program, name}),
    useProgram(program) {
      assert.equal(deletions.get(program) ?? 0, 0, 'drawing program is still alive');
      state.program = program;
    },
    activeTexture: unit => { state.textureUnit = unit; },
    bindTexture: (_, texture) => { textureUnits.set(state.textureUnit, texture); },
    texImage2D(_, level, format, width, height) {
      allocations.push({texture: textureUnits.get(state.textureUnit), width, height});
    },
    texParameteri() {},
    bindFramebuffer: (_, framebuffer) => { state.framebuffer = framebuffer; },
    framebufferTexture2D: (_, attachment, target, texture) => {
      attachments.set(state.framebuffer, texture);
    },
    checkFramebufferStatus: () => state.complete ? gl.FRAMEBUFFER_COMPLETE : 'incomplete',
    uniform1f: writeUniform,
    uniform1i: writeUniform,
    uniform2f: (location, x, y) => writeUniform(location, [x, y]),
    uniform2fv: writeUniform,
    uniform3fv: writeUniform,
    uniform4fv: writeUniform,
    drawArrays() {
      draws.push({
        program: state.program,
        framebuffer: state.framebuffer,
        target: attachments.get(state.framebuffer),
        textures: new Map(textureUnits),
        uniforms: new Map(uniforms.get(state.program)),
      });
    },
  };

  const originalProgram = gl.createProgram(), sourceTexture = gl.createTexture();
  const noiseImage = {src: 'fixture-noise-image'};
  const forwardedUniforms = [];
  let frame = 0;
  const mount = {
    gl,
    program: originalProgram,
    canvasElement: {width: 640, height: 360},
    parentElement: {dataset: {}},
    providedUniforms: {
      u_noiseTexture: noiseImage,
      u_scale: 0.9,
      u_rotation: 18,
      u_colors: [[0.1, 0.2, 0.3, 1], [0.4, 0.5, 0.6, 1]],
      u_colorsCount: 2,
      u_colorBack: [0, 0, 0, 1],
      u_softness: 0.84, u_intensity: 0.32, u_noise: 0.0308,
      u_shape: 1, u_offsetX: 0, u_offsetY: 0,
      u_originX: 0.5, u_originY: 0.5,
      u_worldWidth: 0, u_worldHeight: 0, u_fit: 0,
    },
    uniformCache: {},
    uniformLocations: {},
    renderScale: 1,
    resolutionChanged: false,
    beforeDraw: null,
    textures: new Map([['u_noiseTexture', sourceTexture]]),
  };
  mount.setupUniforms = () => {
    mount.uniformLocations = Object.fromEntries(
      [...Object.keys(mount.providedUniforms), 'u_time', 'u_resolution', 'u_pixelRatio']
        .map(name => [name, gl.getUniformLocation(mount.program, name)]),
    );
  };
  mount.setUniformValues = values => {
    gl.useProgram(mount.program);
    for (const [name, value] of Object.entries(values)) {
      const location = gl.getUniformLocation(mount.program, name);
      if (value && typeof value === 'object' && 'src' in value) {
        if (value !== noiseImage) {
          gl.deleteTexture(mount.textures.get(name));
          mount.textures.set(name, gl.createTexture());
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, mount.textures.get(name));
        gl.uniform1i(location, 0);
      } else if (typeof value === 'number') gl.uniform1f(location, value);
      else if (Array.isArray(value)) gl.uniform4fv(location, value.flat());
    }
  };
  mount.drawFrame = () => {
    mount.beforeDraw?.();
    gl.useProgram(mount.program);
    gl.uniform1f(mount.uniformLocations.u_time, frame++ / 60);
    if (mount.resolutionChanged) {
      gl.uniform2f(mount.uniformLocations.u_resolution,
        mount.canvasElement.width, mount.canvasElement.height);
      gl.uniform1f(mount.uniformLocations.u_pixelRatio, mount.renderScale);
      mount.resolutionChanged = false;
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  // The real mount renders synchronously when a caller changes uniforms.
  mount.setUniforms = (values, render = true) => {
    forwardedUniforms.push(values);
    mount.setUniformValues(values);
    mount.providedUniforms = {...mount.providedUniforms, ...values};
    if (render) mount.drawFrame();
  };
  mount.dispose = () => {
    if (!mount.program) return;
    for (const texture of mount.textures.values()) gl.deleteTexture(texture);
    mount.textures.clear();
    gl.deleteProgram(mount.program);
    mount.program = null;
  };
  mount.setupUniforms();
  mount.setUniformValues(mount.providedUniforms);

  return {
    mount, state, resources, deletions, allocations, draws, forwardedUniforms,
    originalProgram, sourceTexture, noiseImage,
    install: () => cacheWaveNoise(mount, grainGradientFragmentShader),
    bakes: () => draws.filter(draw => draw.framebuffer !== null),
    visible: () => draws.filter(draw => draw.framebuffer === null),
    assertReleasedOnce() {
      for (const resource of resources) {
        assert.equal(deletions.get(resource), 1, `${resource.kind} ${resource.id} released once`);
      }
    },
  };
}

test('missing float render-target support leaves the original renderer untouched', () => {
  const r = renderer({supported: false});
  let originalHookCalls = 0;
  r.mount.beforeDraw = () => originalHookCalls++;
  const before = {...r.mount};
  const uniforms = {...r.mount.providedUniforms};
  const resourceCount = r.resources.length;

  assert.equal(r.install(), false);
  assert.equal(r.resources.length, resourceCount);
  assert.equal(r.deletions.size, 0);
  assert.deepEqual(r.mount, before);
  assert.deepEqual(r.mount.providedUniforms, uniforms);
  assert.deepEqual(r.mount.parentElement.dataset, {});
  r.mount.drawFrame();
  assert.equal(originalHookCalls, 1);
  assert.equal(r.bakes().length, 0);
  assert.equal(r.visible()[0].program, r.originalProgram);
  r.mount.dispose();
  r.assertReleasedOnce();
});

test('the first animated frame bakes grain once and later frames reuse its texture', () => {
  const r = renderer();
  assert.equal(r.install(), true);
  assert.equal(r.draws.length, 0, 'installation does not render an eager extra frame');
  r.mount.drawFrame();
  const bake = r.bakes()[0];
  assert.equal(r.bakes().length, 1);
  assert.equal(r.visible().length, 1);
  assert.deepEqual(bake.uniforms.get('u_resolution'), [640, 360]);
  assert.equal(bake.textures.get(0), r.sourceTexture);
  assert.equal(r.visible()[0].textures.get(1), bake.target);
  assert.notEqual(r.visible()[0].program, r.originalProgram);

  r.mount.drawFrame();
  r.mount.drawFrame();
  assert.equal(r.bakes().length, 1);
  assert.equal(r.allocations.length, 1);
  assert.equal(r.visible().length, 3);
  assert.ok(r.visible().every(draw => draw.textures.get(1) === bake.target));
  assert.ok(r.visible()[2].uniforms.get('u_time') > r.visible()[0].uniforms.get('u_time'));
  r.mount.dispose();
  r.assertReleasedOnce();
});

test('changing either canvas dimension rebakes once at the new resolution', () => {
  const r = renderer();
  r.install();
  r.mount.drawFrame();
  const cacheTexture = r.bakes()[0].target;
  for (const [dimension, value, expected] of [
    ['width', 800, [800, 360]],
    ['height', 450, [800, 450]],
  ]) {
    const count = r.bakes().length;
    r.mount.canvasElement[dimension] = value;
    r.mount.drawFrame();
    assert.equal(r.bakes().length, count + 1);
    assert.deepEqual(r.bakes().at(-1).uniforms.get('u_resolution'), expected);
    assert.equal(r.bakes().at(-1).target, cacheTexture, 'reuse the owned texture on resize');
    r.mount.drawFrame();
    assert.equal(r.bakes().length, count + 1);
  }
  assert.deepEqual(r.allocations.map(({width, height}) => [width, height]),
    [[640, 360], [800, 360], [800, 450]]);
  r.mount.dispose();
  r.assertReleasedOnce();
});

test('setUniforms rebakes with the latest values before its synchronous visible frame', () => {
  const r = renderer();
  r.install();
  r.mount.drawFrame();
  const values = {u_scale: 0.65, u_colors: [[0.7, 0.6, 0.5, 1], [0.2, 0.1, 0, 1]]};
  r.mount.setUniforms(values);

  assert.deepEqual(r.forwardedUniforms, [values]);
  assert.equal(r.bakes().length, 2);
  assert.equal(r.visible().length, 2);
  assert.equal(r.bakes().at(-1).uniforms.get('u_scale'), 0.65);
  assert.deepEqual(r.bakes().at(-1).uniforms.get('u_colors'), values.u_colors.flat());
  assert.equal(r.visible().at(-1).uniforms.get('u_scale'), 0.65);
  assert.equal(r.allocations.length, 1, 'uniform changes do not resize the cache');
  r.mount.drawFrame();
  assert.equal(r.bakes().length, 2);
  r.mount.dispose();
  r.assertReleasedOnce();
});

test('a responsive composition and pixel budget bake only at the final geometry', () => {
  const r = renderer();
  r.install();
  r.mount.drawFrame();
  r.mount.speed = 0.18;
  const values = {u_scale: 0.85, u_rotation: 18, u_colors: [[0, 0, 0, 1], [0.2, 0.3, 0.4, 1]]};
  r.mount.handleResize = (render = true) => {
    assert.equal(r.mount.maxPixelCount, 450000);
    assert.equal(r.mount.providedUniforms.u_scale, 0.85);
    r.mount.canvasElement.width = 750;
    r.mount.canvasElement.height = 600;
    r.mount.renderScale = 0.75;
    r.mount.resolutionChanged = true;
    if (render) r.mount.drawFrame();
  };
  r.mount.render = () => r.mount.drawFrame();

  ShaderMount.prototype.setUniformsAndMaxPixelCount.call(r.mount, values, 450000);

  assert.deepEqual(r.forwardedUniforms, [values]);
  assert.equal(r.bakes().length, 2, 'only one additional bake for the batch');
  assert.equal(r.visible().length, 2, 'only one additional visible frame');
  assert.deepEqual(r.bakes().at(-1).uniforms.get('u_resolution'), [750, 600]);
  assert.equal(r.bakes().at(-1).uniforms.get('u_pixelRatio'), 0.75);
  assert.equal(r.bakes().at(-1).uniforms.get('u_scale'), 0.85);
  assert.deepEqual(r.visible().at(-1).uniforms.get('u_colors'), values.u_colors.flat());
  assert.equal(r.visible().at(-1).uniforms.get('u_time'), 1 / 60);
  assert.equal(r.mount.speed, 0.18);
  assert.deepEqual(r.allocations.map(({width, height}) => [width, height]),
    [[640, 360], [750, 600]], 'never allocate an intermediate responsive size');
  r.mount.dispose();
  r.assertReleasedOnce();
});

test('color and appearance updates reuse grain while updating the visible pass', () => {
  const r = renderer();
  r.install();
  r.mount.drawFrame();
  const values = {
    u_colors: [[0.7, 0.6, 0.5, 1], [0.2, 0.1, 0, 1]],
    u_colorsCount: 2, u_colorBack: [0.1, 0.1, 0.1, 1],
    u_softness: 0.9, u_intensity: 0.4, u_noise: 0.0308,
  };
  r.mount.setUniforms(values);

  assert.equal(r.bakes().length, 1);
  assert.equal(r.allocations.length, 1);
  assert.equal(r.visible().length, 2);
  for (const [name, value] of Object.entries(values)) {
    assert.deepEqual(r.visible().at(-1).uniforms.get(name),
      Array.isArray(value) ? value.flat() : value);
  }
  r.mount.setUniforms({u_scale: 0.9, u_rotation: 18});
  assert.equal(r.bakes().length, 1, 'unchanged geometry does not invalidate');
  r.mount.dispose();
  r.assertReleasedOnce();
});

test('each changed noise-coordinate input rebakes before its visible frame', () => {
  const r = renderer();
  r.install();
  r.mount.drawFrame();
  const values = {
    u_shape: 4, u_scale: 0.65, u_rotation: 48,
    u_offsetX: 0.2, u_offsetY: -0.1, u_originX: 0.4, u_originY: 0.6,
    u_worldWidth: 120, u_worldHeight: 80, u_fit: 1,
  };
  for (const [name, value] of Object.entries(values)) {
    const count = r.bakes().length;
    r.mount.setUniforms({[name]: value});
    assert.equal(r.bakes().length, count + 1, name);
    assert.equal(r.bakes().at(-1).uniforms.get(name), value);
  }
  assert.equal(r.allocations.length, 1);
  r.mount.dispose();
  r.assertReleasedOnce();
});

test('replacing the source noise image restores the original texture-upload path', () => {
  const r = renderer();
  r.install();
  r.mount.drawFrame();
  const image = {src: 'replacement-noise-image'};
  r.mount.setUniforms({u_noiseTexture: image});

  assert.equal(r.mount.program, r.originalProgram);
  assert.equal(r.mount.beforeDraw, null);
  assert.equal(r.mount.parentElement.dataset.waveNoiseCache, undefined);
  assert.equal(r.mount.providedUniforms.u_noiseTexture, image);
  assert.notEqual(r.mount.textures.get('u_noiseTexture'), r.sourceTexture);
  assert.equal(r.visible().at(-1).textures.get(0), r.mount.textures.get('u_noiseTexture'));
  assert.equal(r.visible().at(-1).uniforms.get('u_noiseTexture'), 0);
  assert.equal(r.bakes().length, 1, 'the replaced image uses normal rendering, not stale grain');
  r.mount.drawFrame();
  assert.equal(r.bakes().length, 1);
  r.mount.dispose();
  r.assertReleasedOnce();
});

test('a render-scale change rebakes even when the canvas dimensions stay fixed', () => {
  const r = renderer();
  r.install();
  r.mount.drawFrame();
  r.mount.renderScale = 1.5;
  r.mount.drawFrame();

  assert.equal(r.bakes().length, 2);
  assert.equal(r.bakes().at(-1).uniforms.get('u_pixelRatio'), 1.5);
  assert.deepEqual(r.bakes().at(-1).uniforms.get('u_resolution'), [640, 360]);
  assert.equal(r.allocations.length, 1);
  r.mount.drawFrame();
  assert.equal(r.bakes().length, 2);
  r.mount.dispose();
  r.assertReleasedOnce();
});

for (const failAfterFirstBake of [false, true]) {
  test(`an incomplete framebuffer ${failAfterFirstBake ? 'on resize' : 'on first draw'} restores the original renderer`, () => {
    const r = renderer({complete: failAfterFirstBake});
    r.install();
    if (failAfterFirstBake) {
      r.mount.drawFrame();
      r.mount.canvasElement.width = 800;
      r.state.complete = false;
    }
    r.mount.drawFrame();

    assert.equal(r.state.framebuffer, null);
    assert.equal(r.mount.program, r.originalProgram);
    assert.equal(r.mount.providedUniforms.u_noiseTexture, r.noiseImage);
    assert.equal(r.mount.beforeDraw, null);
    assert.equal(r.mount.parentElement.dataset.waveNoiseCache, undefined);
    assert.equal(r.visible().at(-1).program, r.originalProgram);
    assert.equal(r.deletions.get(r.originalProgram), undefined);
    assert.equal(r.deletions.get(r.sourceTexture), undefined);
    const bakes = r.bakes().length;
    r.mount.setUniforms({u_rotation: 45});
    r.mount.drawFrame();
    assert.equal(r.bakes().length, bakes, 'fallback does not retry an unsupported framebuffer');
    assert.equal(r.visible().at(-1).uniforms.get('u_rotation'), 45);

    r.mount.dispose();
    r.mount.dispose();
    r.assertReleasedOnce();
  });
}

test('repeated disposal releases every program and cache resource exactly once', () => {
  const r = renderer();
  r.install();
  r.mount.drawFrame();
  r.mount.dispose();
  r.mount.dispose();

  assert.equal(r.mount.program, null);
  assert.equal(r.mount.beforeDraw, null);
  r.assertReleasedOnce();
});
