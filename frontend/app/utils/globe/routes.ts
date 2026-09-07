import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  SphereGeometry,
  Uniform,
} from "three";
import { arcPoint, globePoint } from "./geography";
import { LOCATIONS, ROUTES } from "./locations";

export function createRoutes(): {
  group: Group;
  update: (time: number) => void;
} {
  const group = new Group();
  const markerGeometry = new SphereGeometry(0.008, 8, 8);
  const markerMaterial = new MeshBasicMaterial({
    color: 0xff610a,
    toneMapped: false,
  });
  for (const location of LOCATIONS) {
    const marker = new Mesh(markerGeometry, markerMaterial);
    marker.position.set(...globePoint(location.coordinate, 1.009));
    group.add(marker);
  }
  const time = new Uniform(0);
  ROUTES.forEach(([from, to], index) => {
    const origin = LOCATIONS[from],
      destination = LOCATIONS[to];
    if (!origin || !destination) return;
    const vertices: number[] = [],
      progress: number[] = [];
    for (let step = 0; step <= 80; step++) {
      const t = step / 80;
      vertices.push(...arcPoint(origin.coordinate, destination.coordinate, t));
      progress.push(t);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("progress", new Float32BufferAttribute(progress, 1));
    const material = new ShaderMaterial({
      uniforms: { time, offset: new Uniform(index * 0.173) },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: `attribute float progress; varying float vProgress;
        void main(){ vProgress=progress; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform float time; uniform float offset; varying float vProgress;
        void main(){
          float head=fract(time*0.19+offset);
          float distance=mod(head-vProgress+1.0,1.0);
          float trail=1.0-smoothstep(0.0,0.24,distance);
          gl_FragColor=vec4(mix(vec3(1.0,0.24,0.015),vec3(1.0,0.8,0.25),pow(trail,8.0)),0.07+trail*0.9);
        }`,
    });
    group.add(new Line(geometry, material));
  });
  return {
    group,
    update: (elapsed) => {
      time.value = elapsed;
    },
  };
}
