import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Group, LineLoop, Points, ShaderMaterial, Uniform } from "three";

export function createOrbitalNetwork(): { group: Group; update: (time: number) => void } {
  const group = new Group();
  const time = new Uniform(0);
  const lightMaterial = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    vertexShader: `void main() { gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_PointSize=30.0; }`,
    fragmentShader: `void main() {
      vec2 p=gl_PointCoord-.5;
      float halo=exp(-length(p)*12.0);
      float rays=exp(-min(abs(p.x),abs(p.y))*85.0)*exp(-length(p)*10.0);
      gl_FragColor=vec4(.35,1.0,.45,halo+rays*.65);
    }`,
  });
  const planes = [[.38, .25, -.18], [-.6, .45, .7], [.75, -.55, -.7]] as const;
  const lights = planes.map((rotation, index) => {
    const orbit = new Group();
    orbit.rotation.set(rotation[0], rotation[1], rotation[2]);
    const radius = 1.045 + index * .012;
    const coordinates: number[] = [], progress: number[] = [];
    for (let i = 0; i < 180; i++) {
      const angle = i / 180 * Math.PI * 2;
      coordinates.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      progress.push(i / 180);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(coordinates, 3));
    geometry.setAttribute("progress", new Float32BufferAttribute(progress, 1));
    orbit.add(new LineLoop(geometry, new ShaderMaterial({
      uniforms: { time, offset: new Uniform(index / 3) }, transparent: true, depthWrite: false, blending: AdditiveBlending,
      vertexShader: `attribute float progress; varying float vProgress;
        void main() { vProgress=progress; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform float time; uniform float offset; varying float vProgress;
        void main() {
          float trail=1.0-smoothstep(0.0,.18,mod(time*.035+offset-vProgress+1.0,1.0));
          gl_FragColor=vec4(.35,1.0,.48,.32+trail*.62);
        }`,
    })));
    const positions = new Float32BufferAttribute(new Float32Array(12), 3);
    const lightGeometry = new BufferGeometry();
    lightGeometry.setAttribute("position", positions);
    const points = new Points(lightGeometry, lightMaterial);
    points.frustumCulled = false;
    orbit.add(points);
    group.add(orbit);
    return { positions, radius, offset: index / 3 };
  });
  return {
    group,
    update(elapsed) {
      time.value = elapsed;
      for (const { positions, radius, offset } of lights) {
        for (let i = 0; i < 4; i++) {
          const angle = (elapsed * .035 + offset + i / 4) * Math.PI * 2;
          positions.setXYZ(i, Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
        }
        positions.needsUpdate = true;
      }
    },
  };
}
