import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Group, Mesh, ShaderMaterial } from "three";
import { AWARD_ROWS, STAGE_HEIGHT, STAGE_WIDTH } from "./layout";

const referenceScale = STAGE_WIDTH / 1325;
export const CEILING_CENTERS: readonly number[] = [2, 28, 50, 70, 87, 102, 115, 126, 136, 145, 153, 160, 166]
  .map(height => height * referenceScale);
const RIBBON_STRENGTHS = [.12, .34, .46, .82, .86, .87, .55, .68, .66, .62, .56, .5, .44] as const;
const BLOOM_GAINS = [1, 1.1, 1.15, 1.2, 1.45, 1.5, 2.4, 2.4, 2.3, 2.1, 2, 2, 2] as const;

export function ceilingCurveY(row: number, x: number): number {
  const distance = Math.abs(x) / referenceScale;
  const curve = 34 * (Math.sqrt(1 + (distance / 120) ** 2) - 1) / (1 + distance / 1200);
  return CEILING_CENTERS[row]! - curve * (1.34 - row * .066) * referenceScale;
}

export function createStageLights(): Group {
  const group = new Group();
  for (let row = 0; row < CEILING_CENTERS.length; row++) {
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const gap = row ? CEILING_CENTERS[row]! - CEILING_CENTERS[row - 1]! : 28;
    const glowHeight = gap * 2.1;
    // Extend both sides of the rim so its light fades instead of ending at a hard edge.
    for (let i = 0; i <= 240; i++) {
      const x = (i / 240 * 2 - 1) * 1200;
      const screenY = ceilingCurveY(row, x);
      const y = STAGE_HEIGHT / 2 - screenY;
      vertices.push(x, y - 4, -2, x, y + glowHeight, -2);
      uvs.push(i / 240, 0, i / 240, 1);
      if (i < 240) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    const material = new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending,
      uniforms: {
        strength: { value: RIBBON_STRENGTHS[row] },
        gap: { value: gap },
        glowHeight: { value: glowHeight },
        bloomGain: { value: BLOOM_GAINS[row] },
        galleryTop: { value: AWARD_ROWS[0]!.top },
      },
      vertexShader: `varying vec2 vUv; varying vec2 vStage;
        void main() {
          vUv = uv; vStage = vec2(position.x, ${STAGE_HEIGHT / 2}. - position.y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }`,
      fragmentShader: `varying vec2 vUv; varying vec2 vStage;
        uniform float strength; uniform float gap; uniform float glowHeight;
        uniform float bloomGain; uniform float galleryTop;
        void main() {
          float distance = mix(-4., glowHeight, vUv.y);
          // The rims run out past the stage's edges (as in the design), fading only far out.
          float across = exp(-pow(abs(vStage.x) / 950., 4.));
          float centerLight = exp(-pow(abs(vStage.x) / 235., 2.4));
          float rim = exp(-pow(distance / .8, 2.));
          float glow = exp(-max(distance, 0.) / (gap * .85))
            * exp(-pow(min(distance, 0.) / 2.4, 2.))
            * (1. - smoothstep(.7, 1., vUv.y));
          vec3 rimColor = mix(vec3(.14, .14, .125), vec3(.16, .19, .071), centerLight);
          vec3 color = rimColor * rim * .91 + vec3(.055, .14, .0002) * glow * centerLight * .24 * bloomGain;
          float fade = 1. - smoothstep(galleryTop - 2., galleryTop + 1., vStage.y);
          gl_FragColor = vec4(color, across * strength * fade);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    group.add(new Mesh(geometry, material));
  }
  return group;
}
