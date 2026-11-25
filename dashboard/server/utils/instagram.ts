// Instagram account statistics once a day (spec 8.3): followers, reach,
// taps on the profile link.
import { instagramStats } from "../db/schema";
import { tashkentDay } from "../../shared/utils/time";
import { useDb } from "./db";
import { markIntegration } from "./integrations";
import { getSecret } from "./settings";

export async function syncInstagramStats(): Promise<string> {
  const [token, account] = await Promise.all([getSecret("instagram_access_token"), getSecret("instagram_account_id")]);
  if (!token || !account) return "не подключено";
  const host = token.startsWith("IG") ? "graph.instagram.com" : "graph.facebook.com";
  const base = `https://${host}/v21.0/${encodeURIComponent(account)}`;
  try {
    const profile = (await (await fetch(`${base}?fields=followers_count&access_token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(15_000) })).json()) as {
      followers_count?: number;
      error?: { message?: string };
    };
    if (profile.error) throw new Error(profile.error.message ?? "Instagram API error");
    const insights = (await (await fetch(
      `${base}/insights?metric=reach,website_clicks&period=day&metric_type=total_value&access_token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(15_000) },
    )).json()) as { data?: Array<{ name: string; total_value?: { value?: number } }> };
    const metric = (name: string) => insights.data?.find((item) => item.name === name)?.total_value?.value ?? null;
    const row = { day: tashkentDay(), followers: profile.followers_count ?? null, reach: metric("reach"), linkClicks: metric("website_clicks") };
    await useDb().insert(instagramStats).values(row).onConflictDoUpdate({ target: instagramStats.day, set: row });
    await markIntegration("instagram", { ok: true, details: row });
    return `подписчики ${row.followers ?? "—"}`;
  } catch (error) {
    await markIntegration("instagram", { ok: false, error: (error as Error).message });
    return `ошибка: ${(error as Error).message}`;
  }
}
