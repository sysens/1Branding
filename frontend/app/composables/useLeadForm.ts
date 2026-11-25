/**
 * The request form's data and submission (components/contacts/LeadForm.vue),
 * apart from its markup: name, company, industry, services, how to reach the
 * visitor (phone, Telegram or WhatsApp) and the consent; the checks of each
 * step; and the request itself.
 *
 * The request goes to the CRM dashboard through the site's proxy (POST
 * /api/ob/lead) with what the tracker knows about the visit (`$ob`: visitor
 * id, first and last touch, the other tools' ids, the contact code). When the
 * dashboard cannot take it (503, a network error, anything but its own 400 or
 * 429), it goes to Strapi as the old quick form sent it
 * (POST /api/contacts-requests, utils/leadForm.ts: strapiLeadData), so no
 * request is lost. Both refuse bots by `meta`: the empty hidden "website"
 * field and the time the form was open (at least 3 s).
 */
import { describeLeadSource, readAttribution } from "~/utils/leadSource";
import {
  COUNTRIES, DEFAULT_COUNTRY, INDUSTRIES, LEAD_SERVICES, countryOf, formatPhone, isValidPhone, isValidTelegram,
  normalizeTelegram, strapiLeadData, toE164, type ContactMethod, type Industry, type LeadServiceKey,
} from "~/utils/leadForm";
import { deviceType, uuid, type ObApi, type TrackFn } from "~/utils/obTracker";
import { createTurnstile } from "~/utils/turnstile";

/** The fields the dashboard may name in a 400. */
export type LeadField = "name" | "company" | "industry" | "contact" | "consent";

/** Max lengths, also used as the inputs' maxlength. */
const LIMITS = { name: 150, company: 150, industryOther: 80, telegram: 45 } as const;
/** Both backends refuse a request sent sooner than this after the form opened. */
const MIN_FILL_MS = 3_000;
const FIELD_STEP: Record<LeadField, number> = { name: 1, company: 1, industry: 2, contact: 3, consent: 3 };

// What a failed $fetch error carries (all optional).
type RequestError = {
  status?: number;
  statusCode?: number;
  response?: { status?: number };
  data?: { error?: { message?: string } };
  message?: string;
} | null | undefined;

type LeadAnswer = { ok: true } | { ok: false; fallback: true } | { ok: false; message: string; step?: number };

export const useLeadForm = (notify: (message: string) => void, options: { service?: LeadServiceKey } = {}) => {
  const { t, locale } = useI18n();
  // Taken now: after an await the composable has no current Nuxt instance.
  const nuxtApp = useNuxtApp();
  const track = nuxtApp.$track as TrackFn | undefined;
  const turnstile = createTurnstile(String(useRuntimeConfig().public.turnstileSiteKey || "").trim());
  const graphqlUrl = useGraphqlUrl();
  const apiOrigin = (() => {
    try {
      return graphqlUrl ? new URL(graphqlUrl).origin : "";
    } catch {
      return "";
    }
  })();

  const name = ref("");
  const company = ref("");
  const industry = ref<Industry | "">("");
  const industryOther = ref("");
  // A service page's form starts with that page's service ticked.
  const services = ref<LeadServiceKey[]>(options.service ? [options.service] : []);
  const method = ref<ContactMethod>("phone");
  const country = ref(DEFAULT_COUNTRY);
  const phone = ref("");
  const telegram = ref("");
  // The visitor's consent to the processing of their personal data; the
  // request is not sent without it.
  const consent = ref(false);
  // Hidden "website" field real visitors never fill (a bot trap).
  const honeypot = ref("");
  const sending = ref(false);

  let openedAt = Date.now();
  /** Call when the form is shown: the bot trap measures from here. */
  const markOpened = () => { openedAt = Date.now(); };

  const serviceLabel = (key: LeadServiceKey) =>
    key === "package" ? t("leadForm.servicePackage") : key === "unsure" ? t("leadForm.serviceUnsure") : t(`servicePages.${key}.name`);
  const serviceOptions = computed(() => LEAD_SERVICES.map((key) => ({ key, label: serviceLabel(key) })));
  const industryOptions = computed(() => INDUSTRIES.map((key) => ({ key, label: t(`leadForm.industries.${key}`) })));
  const phonePlaceholder = computed(() => countryOf(country.value).mask.replace(/#/g, "0"));

  /** The phone field's text laid out by the country's mask. */
  const formatPhoneInput = (value: string) => {
    phone.value = formatPhone(value, countryOf(country.value));
    return phone.value;
  };

  const message = (field: LeadField | "industryOther") => {
    if (field === "contact") return t(method.value === "telegram" ? "leadForm.errors.telegram" : "leadForm.errors.phone");
    return t(`leadForm.errors.${field}`);
  };
  const checks: Record<LeadField | "industryOther", () => boolean> = {
    name: () => name.value.trim().length < 2,
    company: () => !company.value.trim(),
    industry: () => !industry.value,
    industryOther: () => industry.value === "other" && industryOther.value.trim().length < 2,
    contact: () => (method.value === "telegram" ? !isValidTelegram(telegram.value) : !isValidPhone(phone.value, countryOf(country.value))),
    consent: () => !consent.value,
  };
  const invalid = (field: LeadField | "industryOther") => checks[field]();
  const STEP_FIELDS: Array<Array<LeadField | "industryOther">> = [["name", "company"], ["industry", "industryOther"], ["contact", "consent"]];
  /** The first problem of a step (1 to 3), or null. */
  const stepError = (step: number) => {
    const field = STEP_FIELDS[step - 1]?.find(invalid);
    return field ? message(field) : null;
  };

  const reset = () => {
    name.value = "";
    company.value = "";
    industry.value = "";
    industryOther.value = "";
    services.value = options.service ? [options.service] : [];
    phone.value = "";
    telegram.value = "";
    consent.value = false;
    markOpened();
  };

  // A short message in the visitor's language instead of a backend's raw text.
  const errorMessage = (error: unknown) => {
    const e = error as RequestError;
    const status = Number(e?.status ?? e?.statusCode ?? e?.response?.status ?? 0);
    if (status === 429) return t("common.tooManyRequests");
    if (/phone/i.test(String(e?.data?.error?.message || ""))) return t("leadForm.errors.phone");
    if (!status || e instanceof TypeError) return t("common.networkError");
    return t("common.sendFailed");
  };

  const postLead = async (body: Record<string, unknown>): Promise<LeadAnswer> => {
    let res: Response;
    try {
      res = await fetch("/api/ob/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    } catch {
      return { ok: false, fallback: true };
    }
    if (res.ok) return { ok: true };
    if (res.status === 429) return { ok: false, message: t("common.tooManyRequests") };
    if (res.status === 400) {
      const data = (await res.json().catch(() => null)) as { error?: { field?: string } } | null;
      const field = data?.error?.field;
      if (field && field in FIELD_STEP) return { ok: false, message: message(field as LeadField), step: FIELD_STEP[field as LeadField] };
    }
    // 503 (the dashboard is down or not set up yet), a 400 that names no
    // field, a proxy that refuses: the request goes to Strapi.
    return { ok: false, fallback: true };
  };

  const postToStrapi = async (lead: { name: string; company: string; method: ContactMethod; contact: string; services: LeadServiceKey[]; code: string | null; elapsedMs: number }) => {
    if (!apiOrigin) throw new Error("No API address");
    const industryText = industry.value === "other"
      ? [t("leadForm.industries.other"), industryOther.value.trim()].filter(Boolean).join(": ")
      : industry.value ? t(`leadForm.industries.${industry.value}`) : "";
    const source = [describeLeadSource(readAttribution(), `${location.pathname}${location.search}`, location.hostname), lead.code && `code ${lead.code}`]
      .filter(Boolean).join(" | ").slice(0, 500);
    const data: Record<string, string> = { ...strapiLeadData(lead, industryText, lead.services.map(serviceLabel)), Source: source };
    const post = (body: Record<string, string>) =>
      $fetch(`${apiOrigin}/api/contacts-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { data: body, meta: { website: honeypot.value, elapsedMs: lead.elapsedMs } },
      });
    try {
      await post(data);
    } catch (error) {
      // A backend from before the Source field refuses unknown fields (400):
      // the request then goes again without it.
      const e = error as RequestError;
      const status = Number(e?.status ?? e?.statusCode ?? e?.response?.status ?? 0);
      if (status !== 400 || !/invalid contact submission/i.test(String(e?.data?.error?.message || ""))) throw error;
      const { Source: _source, ...rest } = data;
      await post(rest);
    }
  };

  /** Checks every step and sends: `ok`, or the step to go back to (a field the server refused). */
  const submit = async (): Promise<{ ok: boolean; step?: number }> => {
    if (sending.value) return { ok: false };
    for (const step of [1, 2, 3]) {
      const problem = stepError(step);
      if (problem) {
        notify(problem);
        return { ok: false, step };
      }
    }

    sending.value = true;
    try {
      // A form can be answered in under 3 s by an autofill: wait out the rest.
      const wait = MIN_FILL_MS + 200 - (Date.now() - openedAt);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      const ob = nuxtApp.$ob as ObApi | undefined;
      const touches = ob?.touches() ?? { first: null, last: null };
      const lead = {
        name: name.value.trim(),
        company: company.value.trim(),
        industry: industry.value,
        industryOther: industry.value === "other" ? industryOther.value.trim() : "",
        services: [...services.value],
        method: method.value,
        contact: method.value === "telegram" ? normalizeTelegram(telegram.value) : toE164(phone.value, countryOf(country.value)),
        consent: true,
        lang: locale.value,
        page: location.pathname,
        device: ob?.device() ?? deviceType(navigator.userAgent, innerWidth, navigator.maxTouchPoints),
        vid: ob?.vid() ?? "",
        first: touches.first,
        last: touches.last,
        ids: ob?.ids() ?? { ga: "", ym: "", fbp: "", fbc: "" },
        code: ob?.code() ?? null,
        eventId: uuid(),
        meta: { website: honeypot.value, elapsedMs: Date.now() - openedAt },
      };
      const token = await turnstile.token();
      const answer = await postLead(token ? { ...lead, turnstile: token } : lead);
      turnstile.reset();
      if (!answer.ok && "message" in answer) {
        notify(answer.message);
        return { ok: false, step: answer.step };
      }
      if (!answer.ok) await postToStrapi({ ...lead, elapsedMs: lead.meta.elapsedMs });
      track?.("form_submit", { service: lead.services.join(",") || "none", method: lead.method, eventId: lead.eventId });
      reset();
      return { ok: true };
    } catch (error) {
      notify(errorMessage(error));
      return { ok: false };
    } finally {
      sending.value = false;
    }
  };

  return {
    fieldLimits: LIMITS,
    countries: COUNTRIES,
    name,
    company,
    industry,
    industryOther,
    services,
    method,
    country,
    phone,
    telegram,
    consent,
    honeypot,
    sending,
    serviceOptions,
    industryOptions,
    phonePlaceholder,
    formatPhoneInput,
    markOpened,
    stepError,
    submit,
    turnstile,
  };
};
