import { AdditiveBlending, Color, ShaderMaterial, Uniform } from "three";

const sphereVertex = `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vCenter;
  void main() {
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = -p.xyz;
    vCenter = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    gl_Position = projectionMatrix * p;
  }
`;
const lightColor = `
  vec3 atmosphereColor(vec3 normal) {
    vec3 emerald = vec3(0.008, 0.78, 0.045);
    vec3 lime = vec3(0.09, 1.0, 0.12);
    return mix(emerald, lime, smoothstep(-0.6, 0.65, normal.y));
  }
`;

export function earthMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: sphereVertex,
    fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vView;
    ${lightColor}
    void main() {
      vec3 n = normalize(vNormal);
      float rim = 1.0 - max(dot(n, normalize(vView)), 0.0);
      vec3 color = vec3(0.0, 0.001, 0.0002) + atmosphereColor(n) * pow(rim, 16.0) * 2.4;
      color += vec3(0.001, 0.048, 0.007) * pow(rim, 3.0);
      gl_FragColor = vec4(color, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
  });
}

export function atmosphereMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: sphereVertex,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vCenter;
      ${lightColor}
      void main() {
        vec3 n = normalize(vNormal);
        // Ray distance keeps the halo attached to the real surface, not the outer shell.
        float radius = length(cross(normalize(vView), vCenter));
        float strength = smoothstep(0.975, 1.005, radius) * exp(-max(radius-1.0, 0.0)*42.0);
        strength *= 1.0-smoothstep(1.08,1.12,radius);
        gl_FragColor = vec4(atmosphereColor(n), strength * 0.85);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

export interface GlobeDotStyle { color: number; size: number; opacity: number }

export function dotMaterial(pixelRatio: Uniform<number>, style: GlobeDotStyle = { color: 0x72ff8d, size: 1.6, opacity: .85 }): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { pixelRatio, color: new Uniform(new Color(style.color)), size: new Uniform(style.size), opacity: new Uniform(style.opacity) },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      uniform float pixelRatio;
      uniform float size;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * pixelRatio;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      void main() {
        float alpha = 1.0-smoothstep(0.28,0.5,length(gl_PointCoord-0.5));
        gl_FragColor = vec4(color, alpha * opacity);
        #include <colorspace_fragment>
      }
    `,
  });
}
