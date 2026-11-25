// Ads spend from the ad platforms' APIs (spec 8.1): Meta Marketing API,
// Google Ads API and Yandex Direct Reports. One row per campaign per day,
// replaced on every sync (the platforms correct recent days). Spend joins
// the leads through the campaign: name an ad campaign exactly like its
// utm_campaign (202612_meta_branding_tas) and the two meet.
import { eq } from "drizzle-orm";
import { tashkentDay, addDays } from "../../shared/utils/time";
import { campaigns, expenses } from "../db/schema";
import { channelIdByKey } from "./channels";
import { useDb } from "./db";
import { ratesFor } from "./fx";
import { markIntegration } from "./integrations";
import { getSecret } from "./settings";

export type AdsRow = {
  provider: "meta" | "google" | "yandex";
  campaignId: string;
  campaignName: string;
  day: string;
  spend: number;
  currency: string;
  impressions: number;
  clicks: number;
};

const TIMEOUT = 30_000;

async function json<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------- Meta

export async function fetchMeta(from: string, to: string): Promise<AdsRow[] | null> {
  const [token, account] = await Promise.all([getSecret("meta_access_token"), getSecret("meta_ad_account_id")]);
  if (!token || !account) return null;
  const accountId = account.replace(/^act_/, "");
  const params = new URLSearchParams({
    level: "campaign",
    fields: "campaign_id,campaign_name,spend,impressions,clicks,account_currency",
    time_range: JSON.stringify({ since: from, until: to }),
    time_increment: "1",
    limit: "500",
    access_token: token,
  });
  let url: string | null = `https://graph.facebook.com/v21.0/act_${encodeURIComponent(accountId)}/insights?${params}`;
  const out: AdsRow[] = [];
  for (let page = 0; url && page < 50; page += 1) {
    type Page = { data: Array<Record<string, string>>; paging?: { next?: string } };
    const body: Page = await json<Page>(await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) }));
    for (const row of body.data ?? []) {
      out.push({
        provider: "meta",
        campaignId: String(row.campaign_id),
        campaignName: String(row.campaign_name ?? row.campaign_id),
        day: String(row.date_start),
        spend: Number(row.spend) || 0,
        currency: String(row.account_currency || "USD").toUpperCase(),
        impressions: Number(row.impressions) || 0,
        clicks: Number(row.clicks) || 0,
      });
    }
    url = body.paging?.next ?? null;
  }
  return out;
}

// ---------------------------------------------------------------- Google Ads

export async function fetchGoogle(from: string, to: string): Promise<AdsRow[] | null> {
  const [developerToken, clientId, clientSecret, refreshToken, customer, loginCustomer] = await Promise.all([
    getSecret("google_ads_developer_token"),
    getSecret("google_ads_client_id"),
    getSecret("google_ads_client_secret"),
    getSecret("google_ads_refresh_token"),
    getSecret("google_ads_customer_id"),
    getSecret("google_ads_login_customer_id"),
  ]);
  if (!developerToken || !clientId || !clientSecret || !refreshToken || !customer) return null;
  const tokenBody = await json<{ access_token: string }>(await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
    signal: AbortSignal.timeout(TIMEOUT),
  }));
  const version = process.env.GOOGLE_ADS_API_VERSION || "v22";
  const customerId = customer.replace(/\D/g, "");
  const query = `SELECT campaign.id, campaign.name, segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks, customer.currency_code
    FROM campaign WHERE segments.date BETWEEN '${from}' AND '${to}' AND metrics.impressions > 0`;
  type Batch = { results?: Array<{ campaign: { id: string; name: string }; segments: { date: string }; metrics: { costMicros?: string; impressions?: string; clicks?: string }; customer?: { currencyCode?: string } }> };
  const batches = await json<Batch[]>(await fetch(`https://googleads.googleapis.com/${version}/customers/${customerId}/googleAds:searchStream`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${tokenBody.access_token}`,
      "developer-token": developerToken,
      "content-type": "application/json",
      ...(loginCustomer ? { "login-customer-id": loginCustomer.replace(/\D/g, "") } : {}),
    },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(TIMEOUT),
  }));
  return batches.flatMap((batch) => (batch.results ?? []).map((row) => ({
    provider: "google" as const,
    campaignId: String(row.campaign.id),
    campaignName: String(row.campaign.name),
    day: row.segments.date,
    spend: (Number(row.metrics.costMicros) || 0) / 1_000_000,
    currency: String(row.customer?.currencyCode || "USD").toUpperCase(),
    impressions: Number(row.metrics.impressions) || 0,
    clicks: Number(row.metrics.clicks) || 0,
  })));
}

// ---------------------------------------------------------------- Yandex Direct

async function yandexCurrency(token: string, login: string): Promise<string> {
  try {
    const body = await json<{ result?: { Clients?: Array<{ Currency?: string }> } }>(await fetch("https://api.direct.yandex.com/json/v5/clients", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "accept-language": "ru", ...(login ? { "client-login": login } : {}), "content-type": "application/json" },
      body: JSON.stringify({ method: "get", params: { FieldNames: ["Currency"] } }),
      signal: AbortSignal.timeout(TIMEOUT),
    }));
    return String(body.result?.Clients?.[0]?.Currency || "RUB").toUpperCase();
  } catch {
    return "RUB";
  }
}

export async function fetchYandex(from: string, to: string): Promise<AdsRow[] | null> {
  const [token, login] = await Promise.all([getSecret("yandex_direct_token"), getSecret("yandex_direct_client_login")]);
  if (!token) return null;
  const currency = await yandexCurrency(token, login);
  const body = JSON.stringify({
    params: {
      SelectionCriteria: { DateFrom: from, DateTo: to },
      FieldNames: ["Date", "CampaignId", "CampaignName", "Impressions", "Clicks", "Cost"],
      ReportName: `onebranding-${from}-${to}-${Date.now()}`,
      ReportType: "CAMPAIGN_PERFORMANCE_REPORT",
      DateRangeType: "CUSTOM_DATE",
      Format: "TSV",
      IncludeVAT: "YES",
    },
  });
  // The report is built offline: 201/202 mean "ask again in retryIn seconds".
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch("https://api.direct.yandex.com/json/v5/reports", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "accept-language": "ru",
        "content-type": "application/json; charset=utf-8",
        processingMode: "auto",
        returnMoneyInMicros: "false",
        skipReportHeader: "true",
        skipReportSummary: "true",
        ...(login ? { "client-login": login } : {}),
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (response.status === 201 || response.status === 202) {
      const wait = Math.min(Number(response.headers.get("retryIn")) || 5, 30);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      continue;
    }
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
    const [header, ...lines] = text.trim().split("\n");
    const columns = String(header).split("\t");
    const col = (name: string) => columns.indexOf(name);
    return lines.filter(Boolean).map((line) => {
      const cells = line.split("\t");
      return {
        provider: "yandex" as const,
        day: cells[col("Date")]!,
        campaignId: cells[col("CampaignId")]!,
        campaignName: cells[col("CampaignName")]!,
        impressions: Number(cells[col("Impressions")]) || 0,
        clicks: Number(cells[col("Clicks")]) || 0,
        spend: Number(cells[col("Cost")]) || 0,
        currency,
      };
    });
  }
  throw new Error("Яндекс Директ не успел подготовить отчёт");
}

// ---------------------------------------------------------------- saving

async function campaignFor(row: AdsRow, channelId: number): Promise<number> {
  const db = useDb();
  const externalId = `${row.provider}:${row.campaignId}`;
  const [byExternal] = await db.select().from(campaigns).where(eq(campaigns.externalId, externalId));
  if (byExternal) {
    if (byExternal.name !== row.campaignName) await db.update(campaigns).set({ name: row.campaignName }).where(eq(campaigns.id, byExternal.id));
    return byExternal.id;
  }
  const utm = row.campaignName.trim().slice(0, 200);
  const [byUtm] = await db.select().from(campaigns).where(eq(campaigns.utmCampaign, utm));
  if (byUtm) {
    if (!byUtm.externalId) await db.update(campaigns).set({ externalId }).where(eq(campaigns.id, byUtm.id));
    return byUtm.id;
  }
  const [created] = await db.insert(campaigns).values({ channelId, utmCampaign: utm, name: row.campaignName, externalId })
    .onConflictDoNothing().returning();
  if (created) return created.id;
  const [again] = await db.select().from(campaigns).where(eq(campaigns.externalId, externalId));
  return again!.id;
}

export async function saveAdsRows(rows: AdsRow[]) {
  const db = useDb();
  let saved = 0;
  for (const row of rows) {
    const channelId = await channelIdByKey(row.provider);
    if (!channelId) continue;
    const campaignId = await campaignFor(row, channelId);
    const rates = await ratesFor(row.day, row.currency);
    const values = {
      spentOn: row.day,
      channelId,
      campaignId,
      amount: Math.round(row.spend * 100) / 100,
      currency: row.currency,
      ...rates,
      source: "api" as const,
      externalKey: `${row.provider}:${row.campaignId}:${row.day}`,
      impressions: row.impressions,
      clicks: row.clicks,
    };
    await db.insert(expenses).values(values).onConflictDoUpdate({
      target: expenses.externalKey,
      set: { amount: values.amount, currency: values.currency, uzsPerUnit: values.uzsPerUnit, uzsPerUsd: values.uzsPerUsd, impressions: values.impressions, clicks: values.clicks, campaignId },
    });
    saved += 1;
  }
  return saved;
}

/** Loads the last `days` days (today included) from every configured platform. */
export async function syncAds(days = 3) {
  const to = tashkentDay();
  const from = addDays(to, -(days - 1));
  const report: Record<string, string> = {};
  for (const [provider, fetcher] of [["meta", fetchMeta], ["google", fetchGoogle], ["yandex", fetchYandex]] as const) {
    try {
      const rows = await fetcher(from, to);
      if (rows === null) {
        report[provider] = "не подключено";
        continue;
      }
      const saved = await saveAdsRows(rows);
      await markIntegration(provider, { ok: true, details: { from, to, rows: saved } });
      report[provider] = `${saved} строк`;
    } catch (error) {
      const message = (error as Error).message;
      await markIntegration(provider, { ok: false, error: message });
      report[provider] = `ошибка: ${message.slice(0, 200)}`;
    }
  }
  return report;
}
