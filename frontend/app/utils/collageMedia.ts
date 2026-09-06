import type { LandingMedia } from "../types/landingPayload";

export function selectCollageSource(media: LandingMedia): string | null {
  const formats = [media.formats?.large, media.formats?.medium, media.formats?.small]
    .filter(format => format && typeof format.url === "string" && format.url.trim() && format.width > 0)
    .sort((a, b) => (a?.width ?? 0) - (b?.width ?? 0));
  const suitable = formats.find(format => (format?.width ?? 0) >= 960);
  return suitable?.url ?? formats.at(-1)?.url ?? media.url ?? null;
}

export function isInitialCollageImage(index: number, length: number, reverse: boolean): boolean {
  if (length <= 0) return false;
  const position = index % length;
  // The reverse row starts on the duplicate half and brings its last image in first.
  return position < 5 || (reverse && position === length - 1);
}
