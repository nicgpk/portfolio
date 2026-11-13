import {test} from 'node:test';
import assert from 'node:assert/strict';
import {waveFragmentShader as wave} from '../js/wave-shader.mjs';
import {grainGradientFragmentShader as reference} from '../js/vendor/paper/shaders/grain-gradient.js';
import {cachedNoiseSources} from '../js/wave-noise-cache.mjs';
import {noiseSrc, getShaderNoiseTexture} from '../js/vendor/paper/get-shader-noise-texture.js';

const canonical = source => source.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').trim();
function between(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first + start.length);
  assert.ok(first >= 0 && last > first, `reference bounds: ${start} … ${end}`);
  return source.slice(first, last);
}
function block(source, position) {
  const open = source.indexOf('{', position);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) {
      return {body: source.slice(open + 1, i), end: i + 1};
    }
  }
  throw new Error('Unbalanced reference shader block');
}

function withoutZeroContributionReturn(source) {
  const start = source.indexOf('  if (totalShape == 0.)');
  assert.ok(start >= 0, 'exact-zero optimization is present');
  return source.slice(0, start) + source.slice(block(source, start).end);
}

test('specialization retains precision and the exact reference animation trajectory', () => {
  assert.equal(canonical(wave.slice(0, wave.indexOf('#define TWO_PI'))),
    canonical(reference.slice(0, reference.indexOf('#define TWO_PI')).replace('u_colors[7]', 'u_colors[4]')));
  assert.equal(canonical(between(wave, '  const float firstFrameOffset', '  vec2 shape_uv')),
    canonical(between(reference, '  const float firstFrameOffset', '  vec2 shape_uv')));
  const originalWave = block(reference, reference.indexOf('if (u_shape < 1.5)')).body;
  assert.equal(canonical(between(wave, '    float wave =', '  float baseNoise =')),
    canonical(originalWave.slice(originalWave.indexOf('    float wave ='))));
});

test('wave coordinates preserve the reference pattern branch for fit=none', () => {
  const objectBranch = block(reference, reference.indexOf('if (u_shape > 3.5)'));
  let pattern = block(reference, reference.indexOf('else', objectBranch.end)).body;
  const fitStart = pattern.indexOf('    if (u_fit > 0.)');
  const fit = block(pattern, fitStart);
  pattern = pattern.slice(0, fitStart) + pattern.slice(fit.end);
  const expected = between(reference, '  float r =', '  if (u_shape > 3.5)') + pattern;
  assert.equal(canonical(between(wave, '  float r =', '  float shape =')), canonical(expected));
});

test('noise and premultiplied color blending keep the reference operation order', () => {
  const originalFbm = block(reference, reference.indexOf('vec4 fbmR('));
  const waveFbm = block(wave, wave.indexOf('vec4 fbmR('));
  assert.equal(canonical(wave.slice(wave.indexOf('float valueNoiseR('), waveFbm.end)),
    canonical(reference.slice(reference.indexOf('float valueNoiseR('), originalFbm.end)));
  assert.equal(canonical(between(wave, '  float baseNoise =', '\n  shape += u_intensity')),
    canonical(between(reference, '  float baseNoise =', '\n  shape += u_intensity')));
  const originalPath = withoutZeroContributionReturn(wave);
  assert.equal(canonical(originalPath.slice(originalPath.indexOf('  shape += u_intensity'))),
    canonical(reference.slice(reference.indexOf('  shape += u_intensity'))
      .replace('for (int i = 1; i < 7; i++)', 'for (int i = 1; i < 4; i++)')));
});

test('only an exact-zero contribution skips blending, after derivatives, with general background alpha', () => {
  const start = wave.indexOf('  if (totalShape == 0.)');
  assert.ok(wave.indexOf('  float aa = fwidth(shape);') < start);
  assert.ok(wave.indexOf('  float totalShape = smoothstep(') < start);
  assert.ok(start < wave.indexOf('  float mixer ='));
  assert.equal(canonical(block(wave, start).body),
    'fragColor = vec4(u_colorBack.rgb * u_colorBack.a, u_colorBack.a); return;');

  // Compare the original blend at a zero mask for opaque, translucent and
  // transparent backgrounds. The fast path must not assume an opaque canvas.
  for (const background of [[0.04, 0.04, 0.04, 1], [0.2, 0.5, 0.8, 0.4], [0.8, 0.3, 0.1, 0]]) {
    for (const gradient of [[0.1, 0.3, 0.2, 1], [0.7, 0.5, 0.2, 0.4]]) {
      const opacity = gradient[3] * 0;
      const referenceColor = gradient.slice(0, 3).map((color, i) =>
        color * 0 + background[i] * background[3] * (1 - opacity));
      const referenceAlpha = opacity + background[3] * (1 - opacity);
      assert.deepEqual([...referenceColor, referenceAlpha],
        [...background.slice(0, 3).map(color => color * background[3]), background[3]]);
    }
  }
});

test('four-stop source remains compatible with the existing full-precision cache factory', () => {
  assert.match(wave, /uniform vec4 u_colors\[4\];/);
  assert.match(wave, /for \(int i = 1; i < 4; i\+\+\)/);
  assert.doesNotMatch(wave, /truchet\(|hash11\(|if \(u_shape/);
  const cached = cachedNoiseSources(wave);
  assert.ok(cached);
  assert.match(cached.noise, /fragColor = vec4\(grainDist, noise, 0\., 1\.\);/);
  assert.match(cached.wave, /texelFetch\(u_cachedGrain, ivec2\(gl_FragCoord.xy\), 0\)/);
  assert.equal(canonical(cached.wave.slice(cached.wave.indexOf('  shape += u_intensity'))),
    canonical(wave.slice(wave.indexOf('  shape += u_intensity'))));
});

test('the original noise asset can be imported without DOM image APIs', () => {
  assert.equal(typeof getShaderNoiseTexture, 'function');
  const png = Buffer.from(noiseSrc.split(',')[1], 'base64');
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.length, 17418);
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [128, 128]);
  assert.equal(png[25], 3, 'retain the original indexed RGB texture');
});
