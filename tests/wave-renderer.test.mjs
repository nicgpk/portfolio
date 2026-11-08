import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WaveRenderer} from '../js/wave-renderer.mjs';

function graphics({float = false, complete = true, fragmentFailure = false,
  programFailure = false, linkFailure = false,
  bufferFailure = false, uploadFailure = false} = {}) {
  const resources = [], deletions = new Map(), draws = [], allocations = [], viewports = [];
  const textures = new Map(), sampler = new Map(), uniforms = new Map(), contexts = [];
  const state = {program:null, framebuffer:null, textureUnit:0};
  const create = (kind, type) => {
    const resource = {kind, type, id:resources.length};
    resources.push(resource);
    return resource;
  };
  const remove = resource => deletions.set(resource, (deletions.get(resource) ?? 0) + 1);
  const write = (location, value) => {
    assert.equal(state.program, location.program, 'uniform uses its owning active program');
    if (!uniforms.has(state.program)) uniforms.set(state.program, new Map());
    uniforms.get(state.program).set(location.name, Array.isArray(value) ? [...value] : value);
  };
  const gl = {
    VERTEX_SHADER:'vertex', FRAGMENT_SHADER:'fragment', MEDIUM_FLOAT:'medium',
    COMPILE_STATUS:'compiled', LINK_STATUS:'linked', ARRAY_BUFFER:'array-buffer',
    STATIC_DRAW:'static', FLOAT:'float', TRIANGLES:'triangles', COLOR_BUFFER_BIT:'color-bit',
    TEXTURE0:0, TEXTURE1:1, TEXTURE_2D:'texture-2d', RGBA:'rgba', UNSIGNED_BYTE:'byte',
    RG32F:'rg32f', RG:'rg', TEXTURE_MIN_FILTER:'min', TEXTURE_MAG_FILTER:'mag',
    TEXTURE_WRAP_S:'wrap-s', TEXTURE_WRAP_T:'wrap-t', CLAMP_TO_EDGE:'clamp',
    LINEAR:'linear', NEAREST:'nearest', FRAMEBUFFER:'framebuffer',
    COLOR_ATTACHMENT0:'attachment', FRAMEBUFFER_COMPLETE:'complete', NO_ERROR:0,
    getExtension:name => float && name === 'EXT_color_buffer_float' ? {} : null,
    getShaderPrecisionFormat:() => ({precision:23}),
    createShader:type => create('shader', type),
    shaderSource() {}, compileShader() {},
    getShaderParameter:shader => !(fragmentFailure && shader.type === 'fragment'),
    getShaderInfoLog:() => 'fixture fragment compile failed',
    deleteShader:remove,
    createProgram:() => programFailure ? null : create('program'),
    attachShader() {}, linkProgram() {}, detachShader() {},
    getProgramParameter:() => !linkFailure,
    getProgramInfoLog:() => 'fixture program link failed',
    deleteProgram:remove,
    createBuffer:() => bufferFailure ? null : create('buffer'),
    bindBuffer() {}, bufferData() {}, deleteBuffer:remove,
    getAttribLocation:() => 0,
    enableVertexAttribArray() {}, vertexAttribPointer() {},
    getUniformLocation:(program, name) => ({program, name}),
    useProgram:program => {
      assert.equal(deletions.get(program) ?? 0, 0, 'active program remains alive');
      state.program = program;
    },
    uniform1f:write, uniform1i:write, uniform2fv:write, uniform3fv:write, uniform4fv:write,
    uniform2f:(location, x, y) => write(location, [x, y]),
    createTexture:() => create('texture'), deleteTexture:remove,
    activeTexture:unit => {state.textureUnit = unit;},
    bindTexture:(_, texture) => textures.set(state.textureUnit, texture),
    texParameteri:(_, name, value) => {
      const texture = textures.get(state.textureUnit);
      if (!sampler.has(texture)) sampler.set(texture, new Map());
      sampler.get(texture).set(name, value);
    },
    texImage2D(...args) {
      allocations.push({texture:textures.get(state.textureUnit), format:args[2],
        size:args.length === 9 ? [args[3], args[4]] : [args[5].width, args[5].height]});
    },
    getError:() => uploadFailure ? 1282 : 0,
    createFramebuffer:() => create('framebuffer'), deleteFramebuffer:remove,
    bindFramebuffer:(_, framebuffer) => {state.framebuffer = framebuffer;},
    framebufferTexture2D() {},
    checkFramebufferStatus:() => complete ? gl.FRAMEBUFFER_COMPLETE : 'incomplete',
    viewport:(...size) => viewports.push(size), clear() {},
    drawArrays:() => draws.push({program:state.program, framebuffer:state.framebuffer,
      uniforms:new Map(uniforms.get(state.program)), textures:new Map(textures)}),
  };
  const canvas = {width:1, height:1, getContext:(type, attributes) => {
    contexts.push({type, attributes}); return gl;
  }};
  const bitmap = {width:128, height:128};
  const provided = {
    u_noiseTexture:bitmap, u_colorBack:[0.04, 0.04, 0.04, 1],
    u_colors:[[0, 0, 0, 1], [0.1, 0.2, 0.3, 1], [0.8, 0.78, 0.73, 1], [0, 0, 0, 1]],
    u_colorsCount:4, u_shape:1, u_fit:0, u_scale:1.3, u_rotation:18,
    u_offsetX:0, u_offsetY:0, u_originX:0.5, u_originY:0.5,
    u_worldWidth:0, u_worldHeight:0, u_softness:0.84, u_intensity:0.32, u_noise:0.0308,
  };
  return {
    gl, canvas, bitmap, provided, resources, allocations, sampler, draws, viewports, contexts,
    create:() => new WaveRenderer(canvas, provided, {frame:12000}),
    visible:() => draws.filter(draw => draw.framebuffer === null),
    bakes:() => draws.filter(draw => draw.framebuffer !== null),
    assertReleasedOnce() {
      for (const resource of resources) assert.equal(deletions.get(resource), 1,
        resource.kind + ' ' + resource.id + ' released exactly once');
    },
  };
}

test('GPU engine preserves context settings, source texture sampling and fixed frame', () => {
  const r = graphics(), renderer = r.create();
  assert.deepEqual(r.contexts, [{type:'webgl2', attributes:{alpha:true, antialias:false, powerPreference:'low-power'}}]);
  assert.equal(r.draws.length, 0, 'construction waits for final physical dimensions');
  renderer.resize({width:640, height:360, renderScale:1});
  const image = r.allocations.find(item => item.format === r.gl.RGBA);
  assert.deepEqual(image.size, [128, 128]);
  assert.deepEqual(Object.fromEntries(r.sampler.get(image.texture)), {
    'wrap-s':'clamp', 'wrap-t':'clamp', min:'linear', mag:'linear',
  });
  assert.equal(renderer.cacheMode, 'original');
  assert.equal(r.visible().length, 1);
  assert.equal(r.visible()[0].uniforms.get('u_time'), 12);
  assert.deepEqual(r.visible()[0].uniforms.get('u_resolution'), [640, 360]);
  renderer.setFrame(18000);
  assert.equal(r.visible().at(-1).uniforms.get('u_time'), 18);
  renderer.dispose();
  r.assertReleasedOnce();
});

test('cached GPU updates bake once at final dimensions and paint with the latest uniforms', () => {
  const r = graphics({float:true}), renderer = r.create();
  renderer.resize({width:640, height:360, renderScale:1});
  renderer.render(12016);
  assert.equal(r.bakes().length, 1);
  assert.equal(r.visible().length, 2);
  renderer.resize({width:750, height:600, renderScale:0.75}, {u_scale:0.85, u_rotation:18});
  assert.equal(renderer.cacheMode, 'cached');
  assert.equal(r.bakes().length, 2);
  assert.equal(r.visible().length, 3, 'one additional visible paint for the batch');
  assert.deepEqual(r.allocations.filter(item => item.format === r.gl.RG32F).map(item => item.size),
    [[640, 360], [750, 600]], 'no intermediate texture allocation or reduced precision');
  const draw = r.visible().at(-1);
  assert.deepEqual(draw.uniforms.get('u_resolution'), [750, 600]);
  assert.equal(draw.uniforms.get('u_pixelRatio'), 0.75);
  assert.equal(draw.uniforms.get('u_scale'), 0.85);
  assert.equal(draw.uniforms.get('u_time'), 12.016);
  renderer.dispose();
  r.assertReleasedOnce();
});

test('invalid physical dimensions cannot replace a valid buffer or paint', () => {
  const r = graphics(), renderer = r.create();
  renderer.resize({width:640, height:360, renderScale:1});
  for (const size of [
    {width:0, height:360, renderScale:1},
    {width:640, height:1.5, renderScale:1},
    {width:640, height:360, renderScale:NaN},
  ]) assert.throws(() => renderer.resize(size), /Invalid wave dimensions/);
  assert.equal(r.draws.length, 1);
  assert.deepEqual([r.canvas.width, r.canvas.height], [640, 360]);
  renderer.dispose();
  r.assertReleasedOnce();
});

test('incomplete floating-point target restores the original draw path without leaking resources', () => {
  const r = graphics({float:true, complete:false}), renderer = r.create();
  renderer.resize({width:640, height:360, renderScale:1});
  assert.equal(renderer.cacheMode, 'original');
  assert.equal(r.bakes().length, 0);
  assert.equal(r.visible().length, 1);
  assert.equal(r.visible()[0].uniforms.get('u_time'), 12);
  renderer.render(18000);
  assert.equal(r.visible().length, 2);
  renderer.dispose();
  r.assertReleasedOnce();
});

for (const float of [false, true]) test('GPU disposal is idempotent and blocks late paints: cache ' + float, () => {
  const r = graphics({float}), renderer = r.create();
  renderer.resize({width:640, height:360, renderScale:1});
  const paints = r.draws.length;
  renderer.dispose();
  renderer.dispose();
  renderer.render(18000);
  renderer.setFrame(22000);
  renderer.resize({width:800, height:450, renderScale:1});
  assert.equal(r.draws.length, paints);
  r.assertReleasedOnce();
});

test('unavailable WebGL2 reports initialization failure without starting GPU work', () => {
  assert.throws(() => new WaveRenderer({getContext:() => null}, {}), /WebGL2 context is unavailable/);
});

test('partial shader compilation failure releases the other successful shader', t => {
  t.mock.method(console, 'error', () => {});
  const r = graphics({fragmentFailure:true});
  assert.throws(() => r.create(), /compilation failed/);
  assert.equal(r.draws.length, 0);
  r.assertReleasedOnce();
});

test('position buffer allocation failure releases the compiled program', () => {
  const r = graphics({bufferFailure:true});
  assert.throws(() => r.create(), /buffer allocation failed/);
  assert.equal(r.draws.length, 0);
  r.assertReleasedOnce();
});

test('program allocation failure releases both compiled shaders', () => {
  const r = graphics({programFailure:true});
  assert.throws(() => r.create(), /compilation failed/);
  assert.equal(r.draws.length, 0);
  r.assertReleasedOnce();
});

test('program linking failure releases its program and both shaders', t => {
  t.mock.method(console, 'error', () => {});
  const r = graphics({linkFailure:true});
  assert.throws(() => r.create(), /compilation failed/);
  assert.equal(r.draws.length, 0);
  r.assertReleasedOnce();
});

test('texture upload failure releases the owned texture, buffer and program', () => {
  const r = graphics({uploadFailure:true});
  assert.throws(() => r.create(), /texture upload failed/);
  assert.equal(r.draws.length, 0);
  r.assertReleasedOnce();
});
