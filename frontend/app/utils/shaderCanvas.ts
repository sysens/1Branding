/**
 * A fragment shader on a <canvas>: one full-screen triangle and the
 * housekeeping every such canvas needs, so a component only writes its GLSL.
 *
 * - The drawing buffer follows the canvas's CSS box (ResizeObserver) at the
 *   screen's pixel density, capped by `maxDpr` (a phone at 3x would shade nine
 *   times the pixels for no visible gain).
 * - It runs only while the canvas is on screen and the tab is visible; its
 *   clock (uTime, seconds) stops with it, so nothing jumps on return.
 * - `still` draws single frames (on resize, when a texture arrives) and never
 *   animates: prefers-reduced-motion.
 * - Output is premultiplied alpha over a transparent canvas.
 *
 * Every shader gets `uniform vec2 uRes` (buffer size, px) and `uniform float
 * uTime`. Returns null where WebGL is not available (the caller shows its
 * fallback).
 */
export type ShaderValue = number | readonly number[];

export interface ShaderCanvasOptions {
  /** The fragment shader's body: its own uniforms, functions and main(). */
  fragment: string;
  /** Read every frame. A number is a float, an array a vec2/vec3/vec4. */
  uniforms?: () => Record<string, ShaderValue>;
  /** Sampler name -> image URL. Bound in order to texture units 0, 1, ... */
  textures?: Record<string, string>;
  maxDpr?: number;
  still?: boolean;
  /** uTime of a still frame. */
  stillTime?: number;
}

export interface ShaderCanvas {
  destroy: () => void;
}

const VERTEX = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const HEADER = [
  "#ifdef GL_FRAGMENT_PRECISION_HIGH",
  "precision highp float;",
  "#else",
  "precision mediump float;",
  "#endif",
  "uniform vec2 uRes;",
  "uniform float uTime;",
  "",
].join("\n");

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (import.meta.dev) console.warn("[shaderCanvas]", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

export const mountShaderCanvas = (canvas: HTMLCanvasElement, options: ShaderCanvasOptions): ShaderCanvas | null => {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, HEADER + options.fragment);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (import.meta.dev) console.warn("[shaderCanvas]", gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.clearColor(0, 0, 0, 0);

  const locations = new Map<string, WebGLUniformLocation | null>();
  const location = (name: string) => {
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
    return locations.get(name) ?? null;
  };

  let destroyed = false;
  let frame = 0;
  let visible = false;
  let time = options.stillTime ?? 0;
  let last = 0;

  const draw = () => {
    if (destroyed || !canvas.width || !canvas.height) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(location("uRes"), canvas.width, canvas.height);
    gl.uniform1f(location("uTime"), time);
    const values = options.uniforms?.();
    if (values) {
      for (const name in values) {
        const value = values[name];
        const at = location(name);
        if (!at || value === undefined) continue;
        if (typeof value === "number") gl.uniform1f(at, value);
        else if (value.length === 2) gl.uniform2f(at, value[0]!, value[1]!);
        else if (value.length === 3) gl.uniform3f(at, value[0]!, value[1]!, value[2]!);
        else if (value.length === 4) gl.uniform4f(at, value[0]!, value[1]!, value[2]!, value[3]!);
      }
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const tick = (now: number) => {
    frame = 0;
    if (destroyed || !visible || document.hidden) return;
    // A long gap (a stalled tab) counts as one frame, not as seconds of motion.
    time += Math.min(0.1, (now - last) / 1000);
    last = now;
    draw();
    frame = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (destroyed || frame) return;
    if (options.still) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        draw();
      });
      return;
    }
    if (!visible || document.hidden) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  // Textures: a clear pixel until the image arrives. Flipped, so uv (0, 0) is
  // the image's bottom-left, like gl_FragCoord.
  Object.entries(options.textures ?? {}).forEach(([name, url], unit) => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(location(name), unit);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (destroyed) return;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      wake();
    };
    image.src = url;
  });

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr ?? 2);
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    // Drawn at once: a resized buffer is cleared, and the next frame may be a tick away.
    draw();
  };

  const resizes = new ResizeObserver(resize);
  resizes.observe(canvas);
  const sights = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) wake();
  }, { rootMargin: "120px 0px" });
  sights.observe(canvas);
  const onVisibility = () => wake();
  document.addEventListener("visibilitychange", onVisibility);
  // A lost context (the GPU was taken away) leaves the canvas clear; the page reads without it.
  const onLost = (event: Event) => event.preventDefault();
  canvas.addEventListener("webglcontextlost", onLost);

  resize();

  return {
    destroy: () => {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      resizes.disconnect();
      sights.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
};
