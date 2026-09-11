export function parseGlobePositions(buffer: ArrayBuffer, limit: number, stride = 12): Float32Array {
  if (!buffer.byteLength || buffer.byteLength % stride || buffer.byteLength > limit)
    throw new Error("Invalid globe data length");
  const positions = new Float32Array(buffer);
  if (!positions.every(Number.isFinite)) throw new Error("Invalid globe coordinates");
  for (let index = 0; index < positions.length; index += 3) {
    const radius = Math.hypot(positions[index]!, positions[index + 1]!, positions[index + 2]!);
    if (radius < .99 || radius > 1.02) throw new Error("Invalid globe surface radius");
  }
  return positions;
}

export async function loadGlobePositions(url: string, signal: AbortSignal, limit: number, stride = 12): Promise<Float32Array> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Globe map could not be loaded");
  return parseGlobePositions(await response.arrayBuffer(), limit, stride);
}
