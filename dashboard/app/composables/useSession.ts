// The signed-in user and the reference data (stages, channels, services ...)
// every page uses, loaded once and shared.
import type { AttributionModel, ReportCurrency, Role } from "#shared/utils/constants";
export type Me = { id: number; name: string; email: string; role: Role; totpEnabled: boolean; needs2faSetup: boolean };

export type Stage = { id: number; key: string; name: string; position: number; kind: "open" | "won" | "lost"; requiresPayment: boolean; isSystem: boolean };
export type Channel = { id: number; key: string; name: string; costMode: "api" | "manual" | "none"; commissionPercent: number; rules: ChannelRuleRow[]; color: string | null; position: number; isActive: boolean };
export type ChannelRuleRow = { source?: string; medium?: string; clickId?: "gclid" | "yclid" | "fbclid"; referrer?: string };
export type Service = { id: number; key: string; name: string; kind: "service" | "package"; basePrice: number | null; currency: string; position: number; isActive: boolean };
export type Industry = { id: number; key: string; name: string; position: number; isActive: boolean };
export type LossReason = { id: number; name: string; key: string | null; position: number; isActive: boolean };

export type MetaData = {
  stages: Stage[];
  channels: Channel[];
  services: Service[];
  industries: Industry[];
  lossReasons: LossReason[];
  users: Array<{ id: number; name: string; role: Role }>;
  defaults: {
    reportCurrency: ReportCurrency;
    attribution: AttributionModel;
    staleDays: number;
    workSchedule: { days: number[]; start: string; end: string };
    responseTargetMinutes: number;
    links: { metrikaCounterId?: string; lookerStudioUrl?: string };
  };
  siteUrl: string;
};

export const useMe = () => useState<Me | null>("me", () => null);

export async function loadMe(force = false): Promise<Me | null> {
  const me = useMe();
  if (me.value && !force) return me.value;
  try {
    me.value = await $fetch<Me>("/api/auth/me");
  } catch {
    me.value = null;
  }
  return me.value;
}

export function useMeta() {
  const meta = useState<MetaData | null>("meta", () => null);
  const load = async (force = false) => {
    if (meta.value && !force) return meta.value;
    meta.value = await api<MetaData>("/api/meta");
    return meta.value;
  };
  const channelName = (id: number | null | undefined) => (id ? meta.value?.channels.find((c) => c.id === id)?.name ?? "—" : "Не определён");
  const channelColor = (id: number | null | undefined) => (id ? meta.value?.channels.find((c) => c.id === id)?.color : null) ?? "var(--muted-foreground)";
  const stageName = (id: number | null | undefined) => meta.value?.stages.find((s) => s.id === id)?.name ?? "—";
  const serviceNames = (ids: number[] | null | undefined) => (ids ?? []).map((id) => meta.value?.services.find((s) => s.id === id)?.name).filter(Boolean) as string[];
  const userName = (id: number | null | undefined) => meta.value?.users.find((u) => u.id === id)?.name ?? "—";
  const canEdit = computed(() => {
    const role = useMe().value?.role;
    return role === "owner" || role === "manager";
  });
  const isOwner = computed(() => useMe().value?.role === "owner");
  return { meta, load, channelName, channelColor, stageName, serviceNames, userName, canEdit, isOwner };
}
