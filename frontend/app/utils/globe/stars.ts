import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, Uniform } from "three";

export function createStarField() {
  const positions: number[] = [], sizes: number[] = [], phases: number[] = [];
  let seed = 704;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 5200; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 1.1 + Math.pow(random(), 1.7) * 2.8;
    positions.push(Math.cos(angle) * radius * 1.25, Math.sin(angle) * radius * .78, -1.5 - random() * 2);
    sizes.push(i % 43 === 0 ? 5 + random() * 5 : .8 + random() * 1.5);
    phases.push(random() * Math.PI * 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("size", new Float32BufferAttribute(sizes, 1));
  geometry.setAttribute("phase", new Float32BufferAttribute(phases, 1));
  const time = new Uniform(0);
  const material = new ShaderMaterial({
    uniforms: { time }, transparent: true, depthWrite: false, blending: AdditiveBlending,
    vertexShader: `attribute float size; attribute float phase; varying float vPhase; varying float vSize;
      void main(){ vPhase=phase; vSize=size; gl_PointSize=size; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float time; varying float vPhase; varying float vSize;
      void main(){ vec2 p=gl_PointCoord-.5; float d=length(p);
        float glow=exp(-d*9.0); float star=exp(-min(abs(p.x),abs(p.y))*80.0)*exp(-d*7.0);
        float alpha=(glow+star*step(4.0,vSize))*(.55+.2*sin(time*.65+vPhase));
        gl_FragColor=vec4(.25,.95,.42,alpha); }`,
  });
  return { points: new Points(geometry, material), update: (elapsed: number) => { time.value = elapsed; } };
}
