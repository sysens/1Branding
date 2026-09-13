import { PerspectiveCamera, Scene } from "three";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { AWARD_ROWS, CAMERA_DISTANCE, CARD_HEIGHT, CARD_WIDTH, STAGE_HEIGHT, STAGE_WIDTH, artworkSource, getCardPosition } from "./layout";

export interface AwardsGallery {
  resize: (width: number, height: number) => void;
  render: (time: number) => void;
  dispose: () => void;
}

function createCard(src: string, column: number): HTMLElement {
  const card = document.createElement("div");
  card.className = "awards-card";
  card.dataset.column = String(column);
  const face = document.createElement("div");
  face.className = "awards-card__face";
  const image = document.createElement("img");
  image.src = src;
  image.alt = "";
  image.width = 416;
  image.height = 234;
  image.decoding = "async";
  image.loading = "lazy";
  image.draggable = false;
  face.append(image);
  const reflection = document.createElement("div");
  reflection.className = "awards-card__reflection";
  reflection.setAttribute("aria-hidden", "true");
  reflection.append(image.cloneNode());
  card.append(face, reflection);
  return card;
}

export function createAwardsGallery(container: HTMLElement): AwardsGallery {
  const renderer = new CSS3DRenderer();
  renderer.domElement.className = "awards-gallery__projection";
  container.append(renderer.domElement);
  const scene = new Scene();
  const camera = new PerspectiveCamera(2 * Math.atan(STAGE_HEIGHT / 2 / CAMERA_DISTANCE) * 180 / Math.PI, STAGE_WIDTH / STAGE_HEIGHT, 100, 8000);
  camera.position.z = CAMERA_DISTANCE;
  const rows = AWARD_ROWS.map(row => {
    const element = document.createElement("div");
    element.className = "awards-gallery__row";
    element.dataset.row = String(row.index + 1);
    element.dataset.direction = row.direction;
    element.style.setProperty("--card-width", `${CARD_WIDTH}px`);
    element.style.setProperty("--card-height", `${CARD_HEIGHT}px`);
    element.style.setProperty("--row-brightness", String(.62 + row.index * .055));
    const object = new CSS3DObject(element);
    const projection = CARD_WIDTH / row.width;
    object.position.z = -CAMERA_DISTANCE * (projection - 1);
    scene.add(object);
    const cards = Array.from({ length: row.count }, (_, column) => {
      const card = createCard(artworkSource(row.index, column), column);
      element.append(card);
      return card;
    });
    return { row, projection, cards };
  });
  return {
    resize(width, height) {
      if (width <= 0 || height <= 0) return;
      const worldHeight = Math.max(STAGE_HEIGHT, STAGE_WIDTH * height / width);
      camera.aspect = width / height;
      camera.fov = 2 * Math.atan(worldHeight / 2 / CAMERA_DISTANCE) * 180 / Math.PI;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    },
    render(time) {
      for (const { row, projection, cards } of rows) {
        cards.forEach((card, column) => {
          const { x, y, slope, yaw } = getCardPosition(row, column, time);
          card.style.transform = `translate3d(${x * projection}px, ${y * projection}px, 0) rotateZ(${slope}rad) rotateY(${yaw}rad)`;
        });
      }
      renderer.render(scene, camera);
    },
    dispose() { scene.clear(); renderer.domElement.remove(); },
  };
}
