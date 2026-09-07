import { Camera, Group, Vector3 } from "three";
import { globePoint } from "./geography";
import { LOCATIONS } from "./locations";

export function createLabels(container: HTMLElement) {
  const labels = LOCATIONS.map((location) => {
    const element = document.createElement("span");
    element.className = "network-globe__label";
    element.textContent = location.name;
    element.hidden = true;
    container.append(element);
    return {
      element,
      location,
      position: new Vector3(...globePoint(location.coordinate, 1.012)),
    };
  }).sort((a, b) => a.location.priority - b.location.priority);
  const world = new Vector3(),
    projected = new Vector3(),
    direction = new Vector3(),
    normal = new Vector3();
  return {
    update(root: Group, camera: Camera, width: number, height: number) {
      const occupied: { x: number; y: number; width: number }[] = [];
      for (const label of labels) {
        world.copy(label.position).applyMatrix4(root.matrixWorld);
        direction.copy(camera.position).sub(world).normalize();
        const facing = normal.copy(world).normalize().dot(direction);
        projected.copy(world).project(camera);
        const x = ((projected.x + 1) * width) / 2;
        const y = ((1 - projected.y) * height) / 2 - 17;
        const labelWidth = label.location.name.length * 6 + 14;
        const collision = occupied.some(
          (other) =>
            Math.abs(y - other.y) < 23 &&
            Math.abs(x - other.x) < (labelWidth + other.width) / 2 + 6,
        );
        const visible =
          facing > 0.22 &&
          !collision &&
          x > labelWidth / 2 &&
          x < width - labelWidth / 2 &&
          y > 20 &&
          y < height - 20;
        label.element.hidden = !visible;
        if (visible) {
          label.element.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-100%)`;
          occupied.push({ x, y, width: labelWidth });
        }
      }
    },
    dispose() {
      labels.forEach((label) => label.element.remove());
    },
  };
}
