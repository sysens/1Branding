import { createFace, drawEmblem, drawMarkings, SIZE } from "./face";
import { drawHands } from "./hands";
import { DialLight, drawTrails } from "./light";
import { poseAt } from "./timeline";

export interface ChronographRenderer {
  resize: (width: number, pixelRatio: number) => void;
  render: (seconds: number) => void;
}

export function createChronographRenderer(
  canvas: HTMLCanvasElement,
  logo: HTMLImageElement,
): ChronographRenderer {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas 2D is unavailable");
  const face = createFace();
  const light = new DialLight();
  return {
    resize(width, pixelRatio) {
      const pixels = Math.max(1, Math.round(width * Math.min(pixelRatio || 1, 2)));
      if (canvas.width !== pixels) canvas.width = canvas.height = pixels;
    },
    render(seconds) {
      context.setTransform(canvas.width / SIZE, 0, 0, canvas.height / SIZE, 0, 0);
      context.fillStyle = "#080a0a";
      context.fillRect(0, 0, SIZE, SIZE);
      const pose = poseAt(seconds);
      context.drawImage(face, 0, 0);
      light.draw(context, pose);
      drawMarkings(context);
      drawTrails(context, pose);
      drawEmblem(context, logo);
      drawHands(context, pose);
    },
  };
}
