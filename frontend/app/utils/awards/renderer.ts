import {
  AmbientLight, DirectionalLight, Mesh,
  NoToneMapping, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer,
  type BufferGeometry, type Material,
} from "three";
import { CAMERA_DISTANCE, STAGE_HEIGHT, STAGE_WIDTH } from "./layout";
import { createAwardNumeral } from "./scenery";
import { createStageLights } from "./ceiling";

export interface AwardsRenderer {
  resize: (width: number, height: number) => void;
  render: () => void;
  dispose: (releaseContext?: boolean) => void;
}

export function createAwardsRenderer(canvas: HTMLCanvasElement, { numeral = true } = {}): AwardsRenderer {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  const scene = new Scene();
  const camera = new PerspectiveCamera(2 * Math.atan(STAGE_HEIGHT / 2 / CAMERA_DISTANCE) * 180 / Math.PI, STAGE_WIDTH / STAGE_HEIGHT, 100, 8000);
  camera.position.z = CAMERA_DISTANCE;
  scene.add(new AmbientLight(0xffffff, 1.2));
  const key = new DirectionalLight(0xe4ffb5, 4);
  key.position.set(-200, 500, 500);
  const rim = new DirectionalLight(0x5aff22, .6);
  rim.position.set(300, 80, -100);
  scene.add(key, rim, createStageLights());
  if (numeral) scene.add(createAwardNumeral());
  return {
    resize(width, height) {
      if (width <= 0 || height <= 0) return;
      const aspect = width / height;
      // Keep the complete stage visible on phones rather than cropping the foreground numeral.
      const worldHeight = Math.max(STAGE_HEIGHT, STAGE_WIDTH / aspect);
      camera.aspect = aspect;
      camera.fov = 2 * Math.atan(worldHeight / 2 / CAMERA_DISTANCE) * 180 / Math.PI;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
    },
    render() { renderer.render(scene, camera); },
    dispose(releaseContext = true) {
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      scene.traverse(object => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      renderer.dispose();
      if (releaseContext) renderer.forceContextLoss();
    },
  };
}
