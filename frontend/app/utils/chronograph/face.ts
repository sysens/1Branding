export const SIZE = 806;
export const CENTER = SIZE / 2;
export const radians = (degrees: number): number => (degrees - 90) * Math.PI / 180;

export function disc(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, radius, 0, Math.PI * 2);
}

export function createFace(): HTMLCanvasElement {
  const layer = document.createElement("canvas");
  layer.width = layer.height = SIZE;
  const ctx = layer.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable");

  const steel = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  [[0,"#17171a"],[0.15,"#36383f"],[0.32,"#15161a"],[0.58,"#121419"],
    [0.83,"#353b4b"],[1,"#08090b"]].forEach(([stop, color]) => {
    steel.addColorStop(Number(stop), String(color));
  });
  disc(ctx, 401);
  ctx.fillStyle = steel;
  ctx.fill();
  const rim = ctx.createRadialGradient(CENTER, CENTER, 370, CENTER, CENTER, 404);
  rim.addColorStop(0, "#050607");
  rim.addColorStop(0.25, "#17191ee6");
  rim.addColorStop(0.75, "#25283300");
  rim.addColorStop(1, "#030405");
  ctx.fillStyle = rim;
  ctx.fill();

  const face = ctx.createRadialGradient(365, 270, 12, CENTER, CENTER, 385);
  face.addColorStop(0, "#111113");
  face.addColorStop(0.72, "#0d0d0f");
  face.addColorStop(1, "#060708");
  disc(ctx, 376);
  ctx.fillStyle = face;
  ctx.fill();
  ctx.strokeStyle = "#8696c051";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 376, Math.PI*1.04, Math.PI*1.91);
  ctx.stroke();

  // Fine, deterministic surface grain; cached rather than regenerated per frame.
  let seed = 112;
  for (let i = 0; i < 45000; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const x = seed % SIZE;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const y = seed % SIZE;
    const distance = Math.hypot(x - CENTER, y - CENTER);
    if (distance > 400) continue;
    ctx.fillStyle = distance > 376 ? "#ffffff09" : "#ffffff02";
    ctx.fillRect(x, y, 1, 1);
  }
  return layer;
}

export function drawMarkings(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillStyle = "#9da1ad26";
  for (let hour = 1; hour <= 12; hour++) {
    const angle = radians(hour * 30);
    ctx.fillText(String(hour), CENTER + Math.cos(angle) * 337, CENTER + Math.sin(angle) * 337);
  }
  for (let tick = 0; tick < 60; tick++) {
    const angle = radians(tick * 6);
    const major = tick % 5 === 0;
    ctx.strokeStyle = major ? "#9da1ad0e" : "#9da1ad07";
    ctx.lineWidth = major ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(CENTER+Math.cos(angle)*366, CENTER+Math.sin(angle)*366);
    ctx.lineTo(CENTER+Math.cos(angle)*(major?355:360), CENTER+Math.sin(angle)*(major?355:360));
    ctx.stroke();
  }
  ctx.restore();
}


export function drawEmblem(ctx: CanvasRenderingContext2D, logo: CanvasImageSource): void {
  ctx.save();
  ctx.shadowColor = "#03cb0055";
  ctx.shadowBlur = 12;
  ctx.globalAlpha = 0.72;
  ctx.drawImage(logo, 340, 263, 126, 280);
  ctx.restore();
}

