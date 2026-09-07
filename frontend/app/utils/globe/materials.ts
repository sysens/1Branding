import { AdditiveBlending, ShaderMaterial, Uniform } from "three";

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
    vec3 blue = vec3(0.012, 0.10, 1.0);
    vec3 orange = vec3(1.0, 0.24, 0.045);
    return mix(blue, orange, smoothstep(-0.2, 0.55, normal.y));
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
      vec3 color = vec3(0.0003, 0.0005, 0.001) + atmosphereColor(n) * pow(rim, 5.2) * 1.5;
      color += vec3(0.03, 0.06, 0.2) * pow(rim, 2.0) * (1.0-smoothstep(-0.7,0.3,n.y));
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
        float strength = smoothstep(0.975, 1.005, radius) * exp(-max(radius-1.0, 0.0)*50.0);
        strength *= 1.0-smoothstep(1.08,1.12,radius);
        gl_FragColor = vec4(atmosphereColor(n), strength * 0.58);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

export function dotMaterial(pixelRatio: Uniform<number>): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { pixelRatio },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      uniform float pixelRatio;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 1.5 * pixelRatio;
      }
    `,
    fragmentShader: `
      void main() {
        float alpha = 1.0-smoothstep(0.28,0.5,length(gl_PointCoord-0.5));
        gl_FragColor = vec4(vec3(0.87,0.94,1.0),alpha*0.88);
      }
    `,
  });
}
