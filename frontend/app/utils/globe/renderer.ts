import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  Material,
  Mesh,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Uniform,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { atmosphereMaterial, earthMaterial } from "./materials";
import { createWorldSurface } from "./surface";
import { createRoutes } from "./routes";
import { createLabels } from "./labels";

export interface GlobeRenderer {
  resize: (width: number, height: number) => void;
  render: (time: number, delta: number, moving: boolean) => void;
  rotate: (horizontal: number, vertical: number) => void;
  reset: () => void;
  dispose: (releaseContext?: boolean) => void;
}

function createStars(): Points {
  const positions: number[] = [];
  let seed = 704;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 1500; i++)
    positions.push(
      (random() - 0.5) * 16,
      (random() - 0.5) * 12,
      -3 - random() * 5,
    );
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return new Points(
    geometry,
    new PointsMaterial({
      size: 0.014,
      color: 0x30ac4c,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
  );
}

export function createGlobeRenderer(
  canvas: HTMLCanvasElement,
  labelLayer: HTMLElement,
  points: Float32Array,
  outlines: Float32Array,
): GlobeRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 50);
  const root = new Group();
  root.rotation.set(0.08, 0.45, -0.12);
  scene.add(root, createStars());
  root.add(new Mesh(new SphereGeometry(1, 96, 64), earthMaterial()));
  root.add(new Mesh(new SphereGeometry(1.12, 64, 48), atmosphereMaterial()));
  const pixelRatio = new Uniform(1);
  root.add(createWorldSurface(points, outlines, pixelRatio));
  const routes = createRoutes();
  root.add(routes.group);
  const labels = createLabels(labelLayer);
  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.autoRotateSpeed = 0.32;
  controls.minPolarAngle = Math.PI * 0.23;
  controls.maxPolarAngle = Math.PI * 0.77;
  canvas.style.touchAction = "pan-y";
  let width = 1,
    height = 1,
    distance = 4;
  let updating = false;
  const draw = () => {
    root.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    renderer.render(scene, camera);
    labels.update(root, camera, width, height);
  };
  const change = () => {
    if (!updating) draw();
  };
  controls.addEventListener("change", change);
  const reset = () => {
    root.rotation.set(0.08, 0.45, -0.12);
    camera.position.set(0, 0, distance);
    controls.target.set(0, 0, 0);
    controls.update(0);
    draw();
  };
  return {
    resize(nextWidth, nextHeight) {
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      camera.aspect = width / height;
      distance =
        1.23 / (Math.tan((19 * Math.PI) / 180) * Math.min(1, camera.aspect));
      camera.position.setLength(distance);
      if (!camera.position.length()) camera.position.set(0, 0, distance);
      camera.updateProjectionMatrix();
      pixelRatio.value = Math.min(window.devicePixelRatio || 1, 1.75);
      renderer.setPixelRatio(pixelRatio.value);
      renderer.setSize(width, height, false);
      controls.update(0);
      draw();
    },
    render(time, delta, moving) {
      routes.update(time);
      controls.autoRotate = moving;
      controls.enableDamping = moving;
      updating = true;
      controls.update(delta);
      updating = false;
      draw();
    },
    rotate(horizontal, vertical) {
      root.rotation.y += horizontal;
      root.rotation.x = Math.max(
        -0.4,
        Math.min(0.4, root.rotation.x + vertical),
      );
      draw();
    },
    reset,
    dispose(releaseContext = true) {
      controls.removeEventListener("change", change);
      controls.dispose();
      labels.dispose();
      const geometries = new Set<BufferGeometry>(),
        materials = new Set<Material>();
      scene.traverse((object) => {
        if (
          object instanceof Mesh ||
          object instanceof Line ||
          object instanceof Points
        ) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            materials.add(material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      if (releaseContext) renderer.forceContextLoss();
    },
  };
}
