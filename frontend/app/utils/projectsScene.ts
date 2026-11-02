// The projects page's WebGL scene (after mathildedechiara.com): a perspective
// camera (45deg, at z = 5 at rest), picture planes of 32 x 32 segments, and a
// full-screen "lens" pass. Everything is in the camera's world units: at z = 5
// the screen is 2 * tan(22.5deg) * 5 = 4.1421 units tall.
//
// A plane can bend four ways, all from its uniforms:
// - distortion: its edges fall back from the centre (a pillow) as it moves;
// - wind: it bends and ripples along a direction while it flies;
// - sphere: the whole scene curves away from the centre, as on a globe;
// - uvAngle: the picture inside turns (a diamond tile keeps it upright).
// Its corners are rounded by `radius` (world units), as the site's cards.
// The lens draws the planes into a texture and shows it on a screen-sized
// plane whose centre comes towards the camera, which reads as a zoom into the
// middle while the column moves fast.

export const FOV = (45 * Math.PI) / 180;
export const HALF_TAN = Math.tan(FOV / 2);
export const REST_Z = 5;
/** The screen's height in world units at the camera's resting distance. */
export const VIEW_HEIGHT = 2 * HALF_TAN * REST_Z;

export type Picture = { texture: WebGLTexture; width: number; height: number };

export type Plane = {
  x: number;
  y: number;
  z: number;
  rotation: number;
  width: number;
  height: number;
  picture: Picture | null;
  distortion: number;
  wind: number;
  windX: number;
  windY: number;
  sphere: number;
  sphereDepth: number;
  uvAngle: number;
  inactive: number;
  alpha: number;
  ready: number;
  radius: number;
};

export const createPlane = (): Plane => ({
  x: 0, y: 0, z: 0, rotation: 0, width: 1, height: 1, picture: null,
  distortion: 0, wind: 0, windX: 0, windY: 0, sphere: 0, sphereDepth: 1,
  uvAngle: 0, inactive: 0, alpha: 1, ready: 1, radius: 0,
});

const PLANE_VERTEX = `
precision highp float;
attribute vec2 a_uv;
uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_model;
uniform float u_distortion;
uniform float u_wind;
uniform vec2 u_windDir;
uniform float u_sphere;
uniform float u_sphereDepth;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  vec3 pos = vec3(a_uv.x - 0.5, 0.5 - a_uv.y, 0.0);
  // The pillow: the further from the plane's centre, the further back.
  pos.z -= distance(a_uv, vec2(0.5)) / 0.5 * u_distortion;
  // The wind: a bend along its direction (y up, as world space) and a ripple.
  float axis = dot(vec2(a_uv.x - 0.5, 0.5 - a_uv.y), u_windDir);
  pos.z += axis * u_wind * 0.5 + sin(axis * 6.28318) * u_wind * 0.12;
  vec4 world = u_model * vec4(pos, 1.0);
  // The globe: points fall back with their distance from the axis.
  float bow = u_sphere * dot(world.xy, world.xy);
  world.z -= bow / (1.0 + bow / max(u_sphereDepth, 1e-4));
  gl_Position = u_projection * u_view * world;
}
`;

const PLANE_FRAGMENT = `
precision highp float;
uniform sampler2D u_texture;
uniform vec2 u_textureSize;
uniform vec2 u_size;
uniform float u_alpha;
uniform float u_ready;
uniform float u_inactive;
uniform float u_worldPx;
uniform float u_uvAngle;
uniform float u_radius;
varying vec2 v_uv;
// object-fit: cover.
vec2 cover(vec2 uv, vec2 textureSize, vec2 size) {
  vec2 s = size / textureSize;
  float scale = max(s.x, s.y);
  vec2 fitted = textureSize * scale;
  vec2 offset = (fitted - size) / fitted * 0.5;
  return uv * size / fitted + offset;
}
void main() {
  vec2 coords = v_uv;
  // The picture turns with the plane's own turn (v runs down here, so the
  // matrix is the y-up rotation mirrored), shrunk to keep it covering.
  if (u_uvAngle != 0.0) {
    float c = cos(u_uvAngle);
    float s = sin(u_uvAngle);
    coords = 0.5 + mat2(c, -s, s, c) * (v_uv - 0.5) / (abs(c) + abs(s));
  }
  vec4 color = texture2D(u_texture, cover(coords, u_textureSize, u_size));
  float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  color.rgb = mix(color.rgb, vec3(luminance) * 0.6, u_inactive);
  // A pixel and a half of soft edge, so the planes stay smooth when turned.
  vec2 feather = max(vec2(u_worldPx * 1.5) / u_size, vec2(1e-5));
  vec2 edge = smoothstep(vec2(0.0), feather, v_uv) * smoothstep(vec2(0.0), feather, 1.0 - v_uv);
  // Rounded corners: outside a rectangle inset by the radius, by more than it.
  vec2 q = abs((v_uv - 0.5) * u_size) - (u_size * 0.5 - u_radius);
  float outside = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - u_radius;
  float corner = u_radius > 0.0 ? 1.0 - smoothstep(-u_worldPx * 0.75, u_worldPx * 0.75, outside) : 1.0;
  gl_FragColor = vec4(color.rgb, color.a * u_alpha * u_ready * edge.x * edge.y * corner);
}
`;

const LENS_VERTEX = `
precision highp float;
attribute vec2 a_uv;
uniform mat4 u_projection;
uniform mat4 u_view;
uniform vec2 u_size;
uniform float u_distortion;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  // The screen-sized plane's centre comes towards the camera, its corners
  // stay (or fall behind): a zoom into the middle.
  float z = (1.0 - distance(a_uv, vec2(0.5)) / 0.5) * u_distortion;
  gl_Position = u_projection * u_view * vec4((a_uv.x - 0.5) * u_size.x, (0.5 - a_uv.y) * u_size.y, z, 1.0);
}
`;

const LENS_FRAGMENT = `
precision highp float;
uniform sampler2D u_scene;
varying vec2 v_uv;
void main() {
  gl_FragColor = texture2D(u_scene, vec2(v_uv.x, 1.0 - v_uv.y));
}
`;

const SEGMENTS = 32;
// The page colour, #f7f5f2, cleared at alpha 0 so the page shows through and
// the planes' soft edges blend into it.
const CLEAR = [0.9686, 0.9608, 0.949, 0] as const;

export type Scene = {
  /** The screen in world units at the camera's resting distance. */
  view: () => { width: number; height: number; pxHeight: number };
  setCameraZ: (z: number) => void;
  load: (url: string) => Promise<Picture | null>;
  render: (planes: Plane[], lens: number) => void;
  resize: () => void;
  destroy: () => void;
};

const perspective = (aspect: number): Float32Array => {
  const near = 0.1;
  const far = 100;
  const f = 1 / HALF_TAN;
  const range = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * range, -1, 0, 0, 2 * near * far * range, 0]);
};

const model = (plane: Plane): Float32Array => {
  const c = Math.cos(plane.rotation);
  const s = Math.sin(plane.rotation);
  return new Float32Array([
    c * plane.width, s * plane.width, 0, 0,
    -s * plane.height, c * plane.height, 0, 0,
    0, 0, 1, 0,
    plane.x, plane.y, plane.z, 1,
  ]);
};

export const createScene = (canvas: HTMLCanvasElement, onLost: () => void): Scene | null => {
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const link = (vertexSource: string, fragmentSource: string) => {
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
  };
  const planeProgram = link(PLANE_VERTEX, PLANE_FRAGMENT);
  const lensProgram = link(LENS_VERTEX, LENS_FRAGMENT);
  if (!planeProgram || !lensProgram) return null;

  // One grid of SEGMENTS x SEGMENTS quads, shared by every plane.
  const uvs: number[] = [];
  for (let row = 0; row <= SEGMENTS; row++) {
    for (let column = 0; column <= SEGMENTS; column++) uvs.push(column / SEGMENTS, row / SEGMENTS);
  }
  const indices: number[] = [];
  for (let row = 0; row < SEGMENTS; row++) {
    for (let column = 0; column < SEGMENTS; column++) {
      const corner = row * (SEGMENTS + 1) + column;
      indices.push(corner, corner + SEGMENTS + 1, corner + 1, corner + 1, corner + SEGMENTS + 1, corner + SEGMENTS + 2);
    }
  }
  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  const locate = (program: WebGLProgram, names: string[]) =>
    Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)])) as Record<string, WebGLUniformLocation | null>;
  const pu = locate(planeProgram, ["u_projection", "u_view", "u_model", "u_distortion", "u_wind", "u_windDir", "u_sphere", "u_sphereDepth", "u_texture", "u_textureSize", "u_size", "u_alpha", "u_ready", "u_inactive", "u_worldPx", "u_uvAngle", "u_radius"]);
  const lu = locate(lensProgram, ["u_projection", "u_view", "u_size", "u_distortion", "u_scene"]);
  const planeUv = gl.getAttribLocation(planeProgram, "a_uv");
  const lensUv = gl.getAttribLocation(lensProgram, "a_uv");

  // A grey pixel for planes whose picture has not arrived.
  const blank = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, blank);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([232, 229, 224, 255]));

  // The lens pass draws from this target.
  const target = gl.createTexture();
  const framebuffer = gl.createFramebuffer();

  let cssWidth = 1;
  let cssHeight = 1;
  let cameraZ = REST_Z;
  let projection = perspective(1);

  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    cssWidth = Math.max(1, canvas.clientWidth);
    cssHeight = Math.max(1, canvas.clientHeight);
    canvas.width = Math.round(cssWidth * scale);
    canvas.height = Math.round(cssHeight * scale);
    projection = perspective(cssWidth / cssHeight);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  const view = () => ({ width: VIEW_HEIGHT * (cssWidth / cssHeight), height: VIEW_HEIGHT, pxHeight: cssHeight });

  const pictures = new Map<string, Promise<Picture | null>>();
  const load = (url: string) => {
    const known = pictures.get(url);
    if (known) return known;
    const promise = new Promise<Picture | null>((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        const texture = gl.createTexture();
        if (!texture) return resolve(null);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        resolve({ texture, width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = () => resolve(null);
      image.src = url;
    });
    pictures.set(url, promise);
    return promise;
  };

  const bindGrid = (attribute: number) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  };

  const drawPlanes = (planes: Plane[], viewMatrix: Float32Array) => {
    gl.useProgram(planeProgram);
    bindGrid(planeUv);
    gl.uniformMatrix4fv(pu.u_projection!, false, projection);
    gl.uniformMatrix4fv(pu.u_view!, false, viewMatrix);
    gl.uniform1i(pu.u_texture!, 0);
    gl.uniform1f(pu.u_worldPx!, VIEW_HEIGHT / cssHeight);
    gl.activeTexture(gl.TEXTURE0);
    for (const plane of planes) {
      if (plane.alpha <= 0) continue;
      gl.uniformMatrix4fv(pu.u_model!, false, model(plane));
      gl.uniform1f(pu.u_distortion!, plane.distortion);
      gl.uniform1f(pu.u_wind!, plane.wind);
      gl.uniform2f(pu.u_windDir!, plane.windX, plane.windY);
      gl.uniform1f(pu.u_sphere!, plane.sphere);
      gl.uniform1f(pu.u_sphereDepth!, plane.sphereDepth);
      gl.uniform1f(pu.u_uvAngle!, plane.uvAngle);
      gl.uniform1f(pu.u_radius!, Math.min(plane.radius, plane.width / 2, plane.height / 2));
      gl.uniform1f(pu.u_inactive!, plane.inactive);
      gl.uniform1f(pu.u_alpha!, plane.alpha);
      gl.uniform1f(pu.u_ready!, plane.picture ? plane.ready : 0.3);
      gl.uniform2f(pu.u_size!, plane.width, plane.height);
      gl.uniform2f(pu.u_textureSize!, plane.picture?.width ?? 1, plane.picture?.height ?? 1);
      gl.bindTexture(gl.TEXTURE_2D, plane.picture?.texture ?? blank);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
  };

  const render = (planes: Plane[], lens: number) => {
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const viewMatrix = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -cameraZ, 1]);
    // No lens: the planes go straight to the screen.
    if (lens < 1e-4) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(...CLEAR);
      gl.clear(gl.COLOR_BUFFER_BIT);
      drawPlanes(planes, viewMatrix);
      return;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(...CLEAR);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawPlanes(planes, viewMatrix);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(...CLEAR);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(lensProgram);
    bindGrid(lensUv);
    gl.uniformMatrix4fv(lu.u_projection!, false, projection);
    // The lens plane is always seen from the resting distance.
    gl.uniformMatrix4fv(lu.u_view!, false, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -REST_Z, 1]));
    gl.uniform2f(lu.u_size!, view().width, VIEW_HEIGHT);
    gl.uniform1f(lu.u_distortion!, lens);
    gl.uniform1i(lu.u_scene!, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  resize();
  return {
    view,
    setCameraZ: (z: number) => { cameraZ = z; },
    load,
    render,
    resize,
    destroy: () => {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
};
