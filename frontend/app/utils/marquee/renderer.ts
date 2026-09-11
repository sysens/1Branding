import {
  ExtrudeGeometry, Group, Mesh, MeshBasicMaterial, NoToneMapping, OrthographicCamera,
  PlaneGeometry, Raycaster, Scene, SRGBColorSpace, TextureLoader, Vector2, WebGLRenderer,
  type BufferGeometry, type Material, type Texture,
} from "three";
import { createTileFace, createTileShape } from "./geometry";
import { ATLAS_HEIGHT, ATLAS_WIDTH, MARQUEE_ATLAS, MARQUEE_TILES, MARQUEE_TILT } from "./layout";

export interface MarqueeRenderer {
  resize: (width: number, height: number) => void;
  render: (time: number, delta: number, motionAllowed: boolean) => boolean;
  hover: (x: number, y: number) => string | null;
  clearHover: () => void;
  dispose: (releaseContext?: boolean) => void;
}

export async function createMarqueeRenderer(canvas: HTMLCanvasElement, images: readonly string[], signal: AbortSignal): Promise<MarqueeRenderer> {
  const loader = new TextureLoader();
  const sources = MARQUEE_TILES.map((_, index) => images[index] || MARQUEE_ATLAS);
  const textureMap = new Map<string, Texture>();
  const results = await Promise.allSettled([...new Set(sources)].map(async src => {
    const texture = await loader.loadAsync(src);
    texture.colorSpace = SRGBColorSpace;
    textureMap.set(src, texture);
  }));
  if (signal.aborted || results.some(result => result.status === "rejected")) {
    textureMap.forEach(texture => texture.dispose());
    throw new Error("Marquee textures could not be loaded");
  }
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "low-power" });
  } catch (error) {
    textureMap.forEach(texture => texture.dispose());
    throw error;
  }
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = NoToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  textureMap.forEach(texture => { texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); });

  const scene = new Scene();
  const camera = new OrthographicCamera(-670, 670, 300, -300, 1, 6000);
  camera.position.z = 3000;
  const board = new Group();
  board.rotation.set(MARQUEE_TILT, 0, Math.PI / 4);
  scene.add(board);
  const backing = new Mesh(new PlaneGeometry(2800, 2000), new MeshBasicMaterial({ color: 0x101110 }));
  backing.position.z = -5;
  board.add(backing);
  const faces: Mesh[] = [];
  const tiles = MARQUEE_TILES.map((tile, index) => {
    const shape = createTileShape(tile.points);
    const group = new Group();
    group.name = tile.id;
    const body = new Mesh(
      new ExtrudeGeometry(shape, { depth: 3, bevelEnabled: true, bevelSize: 1, bevelThickness: 1, bevelSegments: 2, steps: 1 }),
      new MeshBasicMaterial({ color: 0x171918 }),
    );
    body.position.z = -4;
    const source = sources[index]!;
    const face = new Mesh(createTileFace(shape, source === MARQUEE_ATLAS), new MeshBasicMaterial({ map: textureMap.get(source)! }));
    face.name = tile.id;
    face.position.z = 0.1;
    faces.push(face);
    group.add(body, face);
    board.add(group);
    return { group, title: tile.title };
  });
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let hovered: string | null = null;

  return {
    resize(width, height) {
      if (width <= 0 || height <= 0) return;
      const scale = width >= 768
        ? width / ATLAS_WIDTH * 1.02
        : Math.max(width / ATLAS_WIDTH, height / ATLAS_HEIGHT) * 1.08;
      camera.left = -width / scale / 2;
      camera.right = width / scale / 2;
      camera.top = height / scale / 2;
      camera.bottom = -height / scale / 2;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
    },
    render(time, delta, motionAllowed) {
      // The notched neighbours move as one assembly, so their complementary gaps never split.
      const drift = motionAllowed ? Math.sin(time * Math.PI / 12) : 0;
      board.position.set(drift * 28, drift * 16, 0);
      let settling = false;
      for (const { group } of tiles) {
        const target = motionAllowed && group.name === hovered ? 10 : 0;
        group.position.z += (target - group.position.z) * (1 - Math.exp(-delta * 12));
        if (Math.abs(target - group.position.z) > 0.01) settling = true;
      }
      renderer.render(scene, camera);
      return settling;
    },
    hover(x, y) {
      pointer.set(x, y);
      board.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
      hovered = raycaster.intersectObjects(faces, false)[0]?.object.name ?? null;
      return tiles.find(tile => tile.group.name === hovered)?.title ?? null;
    },
    clearHover() { hovered = null; },
    dispose(releaseContext = true) {
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      scene.traverse(object => {
        if (!(object instanceof Mesh)) return;
        geometries.add(object.geometry);
        if (Array.isArray(object.material)) object.material.forEach(material => materials.add(material));
        else materials.add(object.material);
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      textureMap.forEach(texture => texture.dispose());
      renderer.dispose();
      if (releaseContext) renderer.forceContextLoss();
    },
  };
}
