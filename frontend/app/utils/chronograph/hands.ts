import { CENTER, radians } from "./face";
import type { WatchPose } from "./timeline";
import { PRIMARY_HAND, SECONDARY_HAND } from "./palette";

function hand(ctx: CanvasRenderingContext2D, angle: number, length: number, width: number, color: string): void {
  ctx.save();
  ctx.translate(CENTER, CENTER);
  ctx.rotate(radians(angle) + Math.PI / 2);
  const paint = ctx.createLinearGradient(0, 0, 0, -length);
  paint.addColorStop(0, "#28292c");
  paint.addColorStop(0.48, "#28292c");
  paint.addColorStop(0.80, color + "aa");
  paint.addColorStop(1, color);
  ctx.fillStyle = paint;
  ctx.shadowColor = "#00000080";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.moveTo(-width * 0.44, 2);
  ctx.lineTo(-width / 2, -length + width / 2);
  ctx.quadraticCurveTo(-width / 2, -length-2, 0, -length-2);
  ctx.quadraticCurveTo(width / 2, -length-2, width / 2, -length+width/2);
  ctx.lineTo(width * 0.44, 2);
  ctx.closePath(); ctx.fill();
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = width * 0.7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -length+8);
  ctx.lineTo(0, -length+2);
  ctx.stroke();
  ctx.restore();
}

export function drawHands(ctx: CanvasRenderingContext2D, pose: WatchPose): void {
  hand(ctx, pose.hour, 263, 20, PRIMARY_HAND);
  hand(ctx, pose.minute, 317, 11, SECONDARY_HAND);
  ctx.save();
  ctx.translate(CENTER, CENTER);
  ctx.rotate(radians(pose.second) + Math.PI / 2);
  ctx.strokeStyle = "#333336";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, -369); ctx.stroke();
  ctx.restore();
  const cap = ctx.createRadialGradient(CENTER-4, CENTER-6, 1, CENTER, CENTER, 18);
  cap.addColorStop(0, "#55565a");
  cap.addColorStop(0.5, "#333438");
  cap.addColorStop(1, "#0e0f11");
  ctx.fillStyle = cap;
  ctx.beginPath(); ctx.arc(CENTER, CENTER, 17, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#161719";
  ctx.beginPath(); ctx.arc(CENTER+1, CENTER+2, 8, 0, Math.PI*2); ctx.fill();
}
