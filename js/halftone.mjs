// Original monochrome cloud screen. A small brush texture avoids a per-pixel trail loop.
const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }
`;
const fragmentSource = `
precision mediump float;
varying vec2 uv;
uniform sampler2D cloud;
uniform sampler2D brushMask;
uniform vec2 size;
uniform float time;
uniform float background;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float cloudNoise(vec2 p) {
  vec2 cell = floor(p), local = fract(p);
  local = local * local * (3. - 2. * local);
  return mix(mix(hash(cell), hash(cell + vec2(1., 0.)), local.x),
    mix(hash(cell + vec2(0., 1.)), hash(cell + vec2(1.)), local.x), local.y);
}
void main() {
  vec2 screen = vec2(uv.x, 1. - uv.y);
  vec2 pixel = screen * size;
  float pitch = 4.5;
  vec2 cell = floor(pixel / pitch);
  vec2 center = (cell + .5) * pitch;
  vec2 sampleUV = center / size;
  float brush = texture2D(brushMask, sampleUV).a;
  bool layeredHorizon = background > .5 && background < 1.5;
  float quiet = (1. - smoothstep(size.x < 900. ? .42 : .23, .50, abs(sampleUV.x - .5)))
    * (1. - smoothstep(layeredHorizon ? .82 : .48, layeredHorizon ? .98 : .65, sampleUV.y));
  brush *= 1. - quiet * .92;
  vec2 drift = vec2(sin(time * .12 + sampleUV.y * 4.) * .012,
    sin(time * .16 + sampleUV.x * 6.) * .008);
  vec2 photoUV = vec2(sampleUV.x, clamp((sampleUV.y - .42) / .58, 0., 1.));
  photoUV += drift + vec2(sin(sampleUV.y * 18. + time), cos(sampleUV.x * 16. - time)) * brush * .025;
  vec3 photo = texture2D(cloud, clamp(photoUV, .001, .999)).rgb;
  float luma = dot(photo, vec3(.299, .587, .114));
  float density = pow(clamp((.98 - luma) * 2.65, 0., 1.), .95);
  density *= smoothstep(.30, .48, sampleUV.y);
  density *= 1. - quiet * .75;
  // Layered Horizon balances cloud texture with the quiet copy area.
  vec2 q = sampleUV + vec2(sin(time * .08) * .004, 0.);
  if (background > .5 && background < 1.5) {
    vec2 air = q * vec2(7., 4.) + vec2(0., sin(time * .035) * .025);
    float broad = cloudNoise(air);
    float detail = broad * .60 + cloudNoise(air * 2.03) * .28
      + cloudNoise(air * 4.09) * .12;
    float rear = .35 + cos(q.x * 5.2 + .4) * .05 + (broad - .5) * .28;
    float middle = .61 + sin(q.x * 7. - .8) * .04 + (detail - .5) * .34;
    float front = .87 + cos(q.x * 10. + .3) * .025 + (detail - .5) * .18;
    density = smoothstep(rear - .12, rear + .13, q.y) * .26;
    density += smoothstep(middle - .05, middle + .10, q.y) * .40;
    density += smoothstep(front - .035, front + .08, q.y) * .30;
    density *= mix(.20, 1., smoothstep(.35, .65, detail));
  } else if (background > 1.5 && background < 2.5) {
    vec2 left = vec2((q.x - .10) * 1.65, (q.y - 1.02) * 3.1);
    vec2 right = vec2((q.x - .96) * 2.2, (q.y - .94) * 3.7);
    density = .46 * exp(-dot(left, left)) + .34 * exp(-dot(right, right));
  } else if (background > 2.5) {
    float orbit = length(vec2((q.x - .50) * .72, q.y - 1.15));
    density = (1. - smoothstep(.025, .13, abs(orbit - .49))) * .42;
    density += smoothstep(.88, 1.20, q.y) * .08;
  }
  float grain = hash(cell);
  density = clamp(density + .002 + grain * .008 + sin(time * .35 + grain * 6.28) * .002, 0., 1.);
  // The brush exposes another ink treatment, then dissolves into the cloud.
  density = mix(density, density > .22 ? .006 : .50, brush);
  density *= 1. - quiet * .94;
  float radius = .04 + sqrt(density) * .48;
  vec2 local = fract(pixel / pitch) - .5;
  float dotInk = 1. - smoothstep(radius - .065, radius + .065, length(local));
  vec3 paper = vec3(.957);
  vec3 ink = vec3(.075);
  gl_FragColor = vec4(mix(paper, ink, dotInk), 1.);
}
`;

export function createHalftoneRenderer(canvas, image, background = 0) {
  let gl;
  try {
    gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  if (!gl || gl.isContextLost()) return null;
  const shaders = [];
  function compile(type, source) {
    const shader = gl.createShader(type);
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error("Cloud shader unavailable");
    return shader;
  }
  let program, buffer, texture, brushTexture;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Cloud renderer unavailable");
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (image) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 255]),
      );
    }
    gl.uniform1i(gl.getUniformLocation(program, "cloud"), 0);
    gl.uniform1f(gl.getUniformLocation(program, "background"), background);
    const brushCanvas = document.createElement("canvas");
    const brushContext = brushCanvas.getContext("2d");
    const stamp = document.createElement("canvas");
    stamp.width = stamp.height = 210;
    const stampContext = stamp.getContext("2d");
    const fade = stampContext.createRadialGradient(105, 105, 0, 105, 105, 105);
    for (const [offset, alpha] of [
      [0, 1],
      [0.12, 1],
      [0.5, 0.7],
      [0.8, 0.15],
      [1, 0],
    ])
      fade.addColorStop(offset, `rgba(255,255,255,${alpha})`);
    stampContext.fillStyle = fade;
    stampContext.fillRect(0, 0, 210, 210);
    brushTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, brushTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "brushMask"), 1);
    const locations = Object.fromEntries(
      ["size", "time"].map((name) => [
        name,
        gl.getUniformLocation(program, name),
      ]),
    );
    let previousBrush = true;
    return {
      draw(width, height, time = 0, points = []) {
        if (gl.isContextLost()) return false;
        const maskWidth = 384;
        const maskHeight = Math.max(
          1,
          Math.round((height * maskWidth) / width),
        );
        const resized =
          brushCanvas.width !== maskWidth || brushCanvas.height !== maskHeight;
        if (resized) {
          brushCanvas.width = maskWidth;
          brushCanvas.height = maskHeight;
        }
        if (resized || points.length || previousBrush) {
          brushContext.setTransform(1, 0, 0, 1, 0, 0);
          brushContext.clearRect(0, 0, maskWidth, maskHeight);
          brushContext.setTransform(
            maskWidth / width,
            0,
            0,
            maskHeight / height,
            0,
            0,
          );
          brushContext.globalCompositeOperation = "lighten";
          for (const p of points) {
            const life = Math.max(0, 1 - (time - p.time) / 1.8);
            brushContext.globalAlpha = life * life;
            brushContext.drawImage(stamp, p.x - 105, p.y - 105);
          }
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            brushCanvas,
          );
          previousBrush = Boolean(points.length);
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(locations.size, width, height);
        gl.uniform1f(locations.time, time);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return true;
      },
      dispose() {
        if (gl.isContextLost()) return;
        gl.deleteTexture(texture);
        gl.deleteTexture(brushTexture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        shaders.forEach((shader) => gl.deleteShader(shader));
      },
    };
  } catch {
    if (texture) gl.deleteTexture(texture);
    if (brushTexture) gl.deleteTexture(brushTexture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    shaders.forEach((shader) => gl.deleteShader(shader));
    return null;
  }
}
