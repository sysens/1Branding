export interface TitleParts { lead: string; accent: string }

export function splitIdentityTitle(title?: string | null): TitleParts {
  const text = (title ?? "").trim();
  if (!text) return { lead: "", accent: "" };
  const lower = text.toLocaleLowerCase();
  for (const marker of ["key to ", "ключ к "]) {
    const index = lower.indexOf(marker);
    if (index >= 0) {
      const start = index + marker.length;
      return { lead: text.slice(0, start).trim(), accent: text.slice(start).trim() };
    }
  }
  const words = text.split(/\s+/);
  return words.length <= 2
    ? { lead: text, accent: "" }
    : { lead: words.slice(0, -2).join(" "), accent: words.slice(-2).join(" ") };
}
