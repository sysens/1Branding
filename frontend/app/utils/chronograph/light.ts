import { CENTER, disc, radians, SIZE } from "./face";
import type { WatchPose } from "./timeline";

import { PRIMARY_LIGHT, SECONDARY_LIGHT, type Color } from "./palette";
const rgba = (color: Color, alpha: number): string => `rgba(${color.join(",")},${alpha})`;

export function createDots(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable");
  ctx.fillStyle = "#ffffff";
  for (let y = 28; y < SIZE - 28; y += 6) {
    for (let x = 28; x < SIZE - 28; x += 6) {
      if (Math.hypot(x - CENTER, y - CENTER) > 355) continue;
      ctx.fillRect(x, y, 1.8, 1.8);
    }
  }
  return canvas;
}

function lightField(ctx: CanvasRenderingContext2D, angle: number, radius: number, color: Color): void {
  const a = radians(angle - 20);
  const x = CENTER + Math.cos(a) * radius * 0.82;
  const y = CENTER + Math.sin(a) * radius * 0.82;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 270);
  glow.addColorStop(0, rgba(color, 0.84));
  glow.addColorStop(0.38, rgba(color, 0.48));
  glow.addColorStop(0.72, rgba(color, 0.10));
  glow.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

export class DialLight {
  private field = document.createElement("canvas");
  private mask = createDots();
  private warm = this.createField(255, PRIMARY_LIGHT);
  private cool = this.createField(306, SECONDARY_LIGHT);
  private ctx: CanvasRenderingContext2D;

  private createField(radius: number, color: Color): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable");
    lightField(context, 0, radius, color);
    return canvas;
  }

  constructor() {
    this.field.width = this.field.height = SIZE;
    const context = this.field.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable");
    this.ctx = context;
  }

  draw(ctx: CanvasRenderingContext2D, pose: WatchPose): void {
    const light = this.ctx;
    light.clearRect(0, 0, SIZE, SIZE);
    light.globalCompositeOperation = "lighter";
    rotateLayer(light, this.warm, pose.hour);
    rotateLayer(light, this.cool, pose.minute);
    ctx.save();
    disc(ctx, 373); ctx.clip();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.58;
    ctx.drawImage(this.field, 0, 0);
    light.globalCompositeOperation = "destination-in";
    light.drawImage(this.mask, 0, 0);
    light.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.9;
    ctx.drawImage(this.field, 0, 0);
    ctx.restore();
  }
}

function rotateLayer(ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement, angle: number): void {
  ctx.save();
  ctx.translate(CENTER, CENTER);
  ctx.rotate(angle * Math.PI / 180);
  ctx.drawImage(layer, -CENTER, -CENTER);
  ctx.restore();
}

export function drawTrail(ctx: CanvasRenderingContext2D, angle: number, radius: number, color: Color): void {
  ctx.save();
  disc(ctx, radius);
  ctx.strokeStyle = "#050506d9";
  ctx.lineWidth = 11;
  ctx.stroke();
  const peak = radians(angle - 18);
  const x = CENTER + Math.cos(peak) * radius;
  const y = CENTER + Math.sin(peak) * radius;
  const bloom = ctx.createRadialGradient(x, y, 0, x, y, 75);
  bloom.addColorStop(0, rgba(color, 0.82));
  bloom.addColorStop(0.24, rgba(color, 0.42));
  bloom.addColorStop(0.58, rgba(color, 0.13));
  bloom.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = bloom;
  ctx.fillRect(x - 75, y - 75, 150, 150);
  // A continuous conic falloff rotates with the hand, not with the clock face.
  const start = radians(angle - 270);
  const gradient = ctx.createConicGradient(start, CENTER, CENTER);
  gradient.addColorStop(0, rgba(color, 0));
  gradient.addColorStop(0.15, rgba(color, 0.06));
  gradient.addColorStop(0.38, rgba(color, 0.4));
  gradient.addColorStop(0.56, rgba(color, 0.85));
  gradient.addColorStop(0.68, "#ffffff");
  gradient.addColorStop(0.735, "#ffffff");
  gradient.addColorStop(0.751, rgba(color, 0));
  gradient.addColorStop(1, rgba(color, 0));
  ctx.strokeStyle = gradient;
  ctx.shadowColor = rgba(color, 1);
  ctx.shadowBlur = 20;
  ctx.lineWidth = 6;
  disc(ctx, radius); ctx.stroke();
  ctx.shadowBlur = 7;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();
}

const trails: HTMLCanvasElement[] = [];
export function drawTrails(ctx: CanvasRenderingContext2D, pose: WatchPose): void {
  if (!trails.length) {
    for (const color of [PRIMARY_LIGHT, SECONDARY_LIGHT]) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = SIZE;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas 2D is unavailable");
      drawTrail(context, 0, color === PRIMARY_LIGHT ? 255 : 306, color);
      trails.push(canvas);
    }
  }
  rotateLayer(ctx, trails[0]!, pose.hour);
  rotateLayer(ctx, trails[1]!, pose.minute);
}
