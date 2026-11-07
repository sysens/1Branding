/** Original OneBranding aura renderer. Local vector mask; no dependencies or network requests. */
const VERTEX = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_intensity;
uniform float u_grain;
uniform float u_scale;
uniform vec3 u_color;
uniform vec3 u_midColor;
uniform vec3 u_deepColor;
uniform sampler2D u_logo;
uniform vec3 u_logoColor;
uniform float u_logoSize;
uniform float u_showLogo;
uniform float u_floatLogo;

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                 mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                 mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float value = 0.0, amplitude = 0.5;
  for (int i=0; i<4; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec3(7.1, 2.8, 4.3);
    amplitude *= 0.5;
  }
  return value;
}
mat2 rotate(float a) { float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5*u_resolution) / min(u_resolution.x,u_resolution.y);
  p /= u_scale;
  p -= u_pointer * 0.018;
  p = rotate(u_pointer.x*0.09) * p;
  float t = u_time;
  float r = length(p);
  float angle = atan(p.y, p.x);
  float broad = fbm(vec3(p*5.3 + vec2(0.07*t, -0.04*t), 0.19*t));
  float radius = 0.315 + 0.009*sin(3.0*angle + t*0.35)
                        + 0.015*(broad-0.47);
  float d = r - radius;
  float interior = 1.0 - smoothstep(radius-0.012, radius+0.016, r);

  // A projected sphere, with a slowly turning turbulent field on its surface.
  vec3 q = vec3(p / radius, sqrt(max(0.0,1.0-r*r/(radius*radius))));
  q.xz = rotate(t*0.12 + u_pointer.x*0.22) * q.xz;
  q.yz = rotate(-t*0.09 + u_pointer.y*0.22) * q.yz;
  float flow = fbm(q*2.6 + vec3(0.0, t*0.11, -t*0.09));
  float detail = noise(q*9.0 + flow*4.0 + t*0.17);
  float waves = sin(q.x*4.3 + q.z*3.8 + flow*9.0 - t*0.24);
  float filaments = pow(1.0-abs(waves), 5.0);
  float cloud = smoothstep(0.22,0.75,flow);
  float body = interior * (0.19 + 0.58*cloud + 0.14*detail + 0.28*filaments);

  // A broad luminous shell, with no hard geometric outline.
  float shellWidth = 0.012 + broad*0.012;
  float rim = exp(-pow(d/shellWidth,2.0)) * (0.85+0.26*detail);
  float bloom = exp(-abs(d)*30.0)*0.35;
  float atmosphere = exp(-r*r*9.0)*0.065;
  float innerFold = exp(-pow((d+0.047+flow*0.02)/0.034,2.0))*0.18;
  float palette = clamp(0.5 + p.x*1.05 + p.y*0.95 + (flow-0.5)*0.5
                         + sin(t*0.12)*0.12, 0.0, 1.0);
  vec3 tint = mix(u_color, u_midColor, smoothstep(0.1,0.92,palette));
  vec3 bodyTint = mix(u_deepColor, tint, 0.28+0.57*cloud);
  vec3 rgb = bodyTint*body + tint*(rim+bloom+innerFold) + u_midColor*atmosphere;

  // The mark occupies an interior plane: back volume -> mark -> front volume.
  // Nothing is painted over the finished sphere by the DOM.
  float drift = t * u_floatLogo;
  vec2 logoCenter = vec2(sin(drift*0.43)*0.012, sin(drift*0.57)*0.010-0.004);
  float depth = sin(drift*0.31)*0.06;
  float logoHeight = u_logoSize * (1.0 + depth*0.12);
  vec2 local = rotate(sin(drift*0.39)*0.025) * (p-logoCenter);
  vec2 logoUV = vec2(local.x/(logoHeight*(182.0/274.0)), -local.y/logoHeight) + 0.5;
  float inTexture = step(0.0,logoUV.x)*step(logoUV.x,1.0)*step(0.0,logoUV.y)*step(logoUV.y,1.0);
  float logoMask = texture2D(u_logo,logoUV).a * inTexture * u_showLogo * interior;
  vec3 submergedMark = u_logoColor*0.45 + tint*(0.014+0.012*cloud);
  rgb = mix(rgb, submergedMark, logoMask);

  // Near-side plasma crosses the mark. This is composited AFTER the logo mask.
  float frontFlow = fbm(vec3(q.xy*3.4+vec2(1.7,-0.09*t),q.z*2.1+t*0.12));
  float frontWisp = pow(1.0-abs(sin(q.x*3.0+q.y*2.5+frontFlow*8.0+t*0.16)),8.0);
  float frontAlpha = interior*(0.12+0.16*frontFlow+0.30*frontWisp);
  vec3 frontTint = mix(tint,u_midColor,0.32);
  rgb = mix(rgb,frontTint*(0.18+0.32*frontFlow),frontAlpha);
  vec3 surfaceNormal = normalize(vec3(p/radius,sqrt(max(0.0,1.0-r*r/(radius*radius)))));
  float reflection = pow(max(dot(surfaceNormal,normalize(vec3(-0.45,0.55,0.70))),0.0),22.0);
  rgb += mix(vec3(0.75,1.0,0.80),frontTint,0.35)*reflection*interior*0.18;
  rgb *= u_intensity * (0.96 + 0.04*sin(t*0.7));
  rgb = 1.0-exp(-rgb*1.35);
  rgb = pow(max(rgb,vec3(0.0)), vec3(0.88));

  // Film grain only on the aura; the surrounding canvas remains pure black.
  float grain = hash(vec3(floor(gl_FragCoord.xy), floor(t*24.0)))-0.5;
  float luminance = max(rgb.r,max(rgb.g,rgb.b));
  rgb += grain*u_grain*(0.25+sqrt(luminance));
  float fade = 1.0-smoothstep(0.40,0.56,r);
  gl_FragColor = vec4(clamp(rgb,0.0,1.0)*fade,1.0);
}
`;

const DEFAULTS = {
  speed: 0.5, intensity: 1.2, grain: 0.07, scale: 1,
  color: '#d4ff45', midColor: '#00efa5', deepColor: '#126b2a',
  paused: false, cursorInteraction: true, dpr: 1.5,
  showLogo:true, floatLogo:true, logoColor:'#1a1a1a', logoSize:0.40
};
function clamp(value, low, high, fallback) {
  return Number.isFinite(Number(value)) ? Math.min(high, Math.max(low, Number(value))) : fallback;
}
function normalize(input) {
  return { ...input,
    speed: clamp(input.speed, 0, 3, 0.5), intensity: clamp(input.intensity, 0, 3, 1.2),
    grain: clamp(input.grain, 0, 0.3, 0.07), scale: clamp(input.scale, 0.35, 1.5, 1),
    dpr: clamp(input.dpr, 0.5, 2, 1.5), logoSize:clamp(input.logoSize,0.15,0.48,0.40)
  };
}
function hex(value, fallback) {
  let v = typeof value === 'string' ? value.replace(/^#/, '') : '';
  if (/^[a-f\d]{3}$/i.test(v)) v = v.split('').map(c=>c+c).join('');
  if (!/^[a-f\d]{6}$/i.test(v)) v = fallback.replace('#','');
  return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255);
}

/** Mount once; update settings without rebuilding the renderer; destroy on unmount. */
export function createAura(canvas, initialOptions = {}) {
  let options = normalize({...DEFAULTS,...initialOptions});
  const host = canvas.parentElement || canvas;
  const setSide = () => {const r=canvas.getBoundingClientRect();host.style.setProperty('--one-aura-side',Math.min(r.width,r.height)+'px');};
  setSide();
  host.dataset.auraPaused=String(options.paused);
  function fallback() {canvas.dataset.renderer='fallback';host.dataset.auraFallback='true';host.dataset.auraRenderer='fallback';}
  function staticController() {
    const observer=typeof ResizeObserver==='function' ? new ResizeObserver(setSide) : null;
    observer?.observe(canvas);window.addEventListener('resize',setSide);
    return {supported:false,
      update(partial={}) {options=normalize({...options,...partial});host.dataset.auraPaused=String(options.paused);setSide();},
      destroy() {observer?.disconnect();window.removeEventListener('resize',setSide);delete host.dataset.auraFallback;delete host.dataset.auraPaused;delete host.dataset.auraRenderer;}
    };
  }
  const gl = canvas.getContext('webgl', {alpha:false, antialias:false, depth:false, stencil:false, powerPreference:'low-power'});
  if (!gl) {
    fallback();
    return staticController();
  }
  let program, buffer, uniforms, logoTexture;
  let destroyed=false, lost=false, inView=true, raf=0, previous=0, time=2.8;
  let pointer=[0,0], target=[0,0];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function shader(type, source) {
    const result=gl.createShader(type);
    gl.shaderSource(result,source); gl.compileShader(result);
    if (!gl.getShaderParameter(result,gl.COMPILE_STATUS)) {
      const log=gl.getShaderInfoLog(result); gl.deleteShader(result); throw new Error(log);
    }
    return result;
  }
  function init() {
    const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
    const fragmentSource=precision && precision.precision ? FRAGMENT : FRAGMENT.replace('precision highp float','precision mediump float');
    const vertex=shader(gl.VERTEX_SHADER,VERTEX);
    let fragment;
    try { fragment=shader(gl.FRAGMENT_SHADER,fragmentSource); }
    catch(error) { gl.deleteShader(vertex); throw error; }
    program=gl.createProgram(); gl.attachShader(program,vertex); gl.attachShader(program,fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {
      const log=gl.getProgramInfoLog(program); gl.deleteProgram(program); program=null; throw new Error(log);
    }
    gl.useProgram(program);
    buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'a_position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    uniforms={};
    for (const key of ['resolution','pointer','time','intensity','grain','scale','color','midColor','deepColor','logo','logoSize','logoColor','showLogo','floatLogo']) {
      uniforms[key]=gl.getUniformLocation(program,'u_'+key);
    }
    const mask=document.createElement('canvas');
    mask.width=512;mask.height=Math.round(512*274/182);
    const context=mask.getContext('2d');
    if(!context) throw new Error('Unable to prepare logo mask');
    context.scale(mask.width/182,mask.height/274);context.translate(-384,-214);
    context.fillStyle='#fff';
    context.fill(new Path2D('M482.8 214.3H565.5L493.5 487.2C464 487.2 435.5 481.8 409.5 470.8L451 322L530.5 299.5H384Z'));
    logoTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,logoTexture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,mask);
    gl.uniform1i(uniforms.logo,0);
    canvas.dataset.renderer='webgl';
    host.dataset.auraRenderer='webgl';
    delete host.dataset.auraFallback;
  }
  try {init();} catch(error) {
    console.warn('OneBranding aura: using static fallback.',error);
    fallback();
    return staticController();
  }

  function resize() {
    const rect=canvas.getBoundingClientRect();
    host.style.setProperty('--one-aura-side',Math.min(rect.width,rect.height)+'px');
    // Cap total drawing area as well as DPR for ultra-wide/high-DPI displays.
    const ratio=Math.min(window.devicePixelRatio || 1,options.dpr,Math.sqrt(1600000/Math.max(1,rect.width*rect.height)));
    const width=Math.max(1,Math.round(rect.width*ratio));
    const height=Math.max(1,Math.round(rect.height*ratio));
    if(canvas.width!==width || canvas.height!==height) {canvas.width=width; canvas.height=height;}
    gl.viewport(0,0,width,height);
  }
  function draw() {
    if(destroyed || lost) return;
    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);
    gl.uniform2f(uniforms.pointer,...pointer);
    gl.uniform1f(uniforms.time,time);
    gl.uniform1f(uniforms.intensity,options.intensity);
    gl.uniform1f(uniforms.grain,options.grain);
    gl.uniform1f(uniforms.scale,options.scale);
    gl.uniform1f(uniforms.logoSize,options.logoSize);
    gl.uniform1f(uniforms.showLogo,options.showLogo?1:0);
    gl.uniform1f(uniforms.floatLogo,options.floatLogo?1:0);
    gl.uniform3fv(uniforms.logoColor,hex(options.logoColor,DEFAULTS.logoColor));
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,logoTexture);
    for(const key of ['color','midColor','deepColor']) gl.uniform3fv(uniforms[key],hex(options[key],DEFAULTS[key]));
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  function shouldRun() {return !destroyed && !lost && !options.paused && !motion.matches && !document.hidden && inView;}
  function frame(now) {
    raf=0;
    if(!shouldRun()) {previous=0; return;}
    const delta=previous ? Math.min((now-previous)/1000,0.05) : 0;
    previous=now; time+=delta*options.speed;
    const lerp=1-Math.exp(-7*delta);
    pointer=pointer.map((v,i)=>v+(target[i]-v)*lerp);
    draw(); raf=requestAnimationFrame(frame);
  }
  function sync() {
    host.dataset.auraPaused=String(!shouldRun());
    if(raf) cancelAnimationFrame(raf);
    raf=0; previous=0;
    draw();
    if(shouldRun()) raf=requestAnimationFrame(frame);
  }
  function onResize() {if(!destroyed && !lost) {resize(); if(!raf) draw();}}
  function onPointer(event) {
    if(!options.cursorInteraction || motion.matches || options.paused || event.pointerType==='touch') return;
    const rect=host.getBoundingClientRect();
    target=[((event.clientX-rect.left)/rect.width-0.5)*2, -((event.clientY-rect.top)/rect.height-0.5)*2];
  }
  function onLeave() {target=[0,0];}
  function onMotion() {pointer=[0,0]; target=[0,0]; sync();}
  function onLost(event) {
    event.preventDefault(); lost=true;
    if(raf) cancelAnimationFrame(raf); raf=0;
    fallback();
  }
  function onRestored() {
    if(destroyed) return;
    try {init();lost=false;resize();sync();}
    catch(error) {fallback();console.warn('Aura restore failed.',error);}
  }
  const resizeObserver=typeof ResizeObserver==='function' ? new ResizeObserver(onResize) : null;
  resizeObserver?.observe(canvas);
  const intersectionObserver=typeof IntersectionObserver==='function' ? new IntersectionObserver(entries=>{
    inView=entries[0].isIntersecting;sync();
  }) : null;
  intersectionObserver?.observe(canvas);
  window.addEventListener('resize',onResize);
  document.addEventListener('visibilitychange',sync);
  motion.addEventListener('change',onMotion);
  host.addEventListener('pointermove',onPointer,{passive:true});
  host.addEventListener('pointerleave',onLeave,{passive:true});
  canvas.addEventListener('webglcontextlost',onLost);
  canvas.addEventListener('webglcontextrestored',onRestored);
  resize();sync();

  return {
    supported:true,
    update(partial={}) {
      if(destroyed) return;
      options=normalize({...options,...partial});
      if(!options.cursorInteraction) {pointer=[0,0];target=[0,0];}
      if(!lost) resize();
      sync();
    },
    destroy() {
      if(destroyed) return;
      destroyed=true;cancelAnimationFrame(raf);
      resizeObserver?.disconnect();intersectionObserver?.disconnect();
      window.removeEventListener('resize',onResize);
      document.removeEventListener('visibilitychange',sync);
      motion.removeEventListener('change',onMotion);
      host.removeEventListener('pointermove',onPointer);host.removeEventListener('pointerleave',onLeave);
      canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);
      delete host.dataset.auraFallback;
      delete host.dataset.auraPaused;
      delete host.dataset.auraRenderer;
      if(!lost) {gl.deleteTexture(logoTexture);gl.deleteBuffer(buffer);gl.deleteProgram(program);}
    }
  };
}
