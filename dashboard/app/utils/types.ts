import type { Role } from "#shared/utils/constants";

// Row shapes the pages share.

export type Column<R> = {
  key: string;
  label: string;
  /** Display text (default: the row's value as is). */
  format?: (row: R) => string | number | null | undefined;
  /** Sort / export value (default: the row's value). */
  value?: (row: R) => string | number | null | undefined;
  align?: "left" | "right";
  class?: string;
  sortable?: boolean;
};

export type BoardDeal = {
  id: number; title: string | null; contact_name: string | null; client: string | null; stage_id: number; stage_key: string;
  amount: number | null; currency: string; service_ids: number[]; channel_id: number | null; origin: string; is_repeat: boolean;
  created_at: string; days_on_stage: number; overdue: boolean; stale: boolean; paid: number; open_tasks: number; owner_id: number | null;
  phone: string | null; telegram: string | null;
};

export type SettingsData = {
  general: Record<string, unknown> & {
    workSchedule: { days: number[]; start: string; end: string };
    responseTargetMinutes: number;
    staleDays: number;
    reportCurrency: "USD" | "UZS";
    attribution: "last" | "first";
    notifications: Record<string, boolean>;
    links?: { metrikaCounterId?: string; lookerStudioUrl?: string };
  };
  plans: Array<{ month: string; leads: number | null; revenue: number | null; currency: "USD" | "UZS" }>;
  campaigns: Array<{ id: number; channelId: number; utmCampaign: string; name: string; placement: string | null; externalId: string | null; createdAt: string }>;
  users: Array<{ id: number; email?: string; name: string; role: Role; isActive: boolean; totpEnabled: boolean; telegramId: string | null; lastLoginAt: string | null }>;
  secrets: Record<string, "db" | "env" | null> | null;
  integrations: Array<{ provider: string; lastSuccessAt: string | null; lastError: string | null }>;
  telegramConnections: Array<{ id: string; username: string | null; isEnabled: boolean; canReply: boolean; updatedAt: string }>;
  webhookUrls: { telegram: string; instagram: string };
};
