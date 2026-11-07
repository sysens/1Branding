/**
 * The quick request's data and submission, apart from its markup: the three
 * answers (name, what the visitor wants, phone number), validation and the
 * request to Strapi (POST /api/contacts-requests).
 *
 * The backend accepts this short form (TopicInput, FullName, PhoneNumber; the
 * message, job title, company, email and file are optional there) and refuses
 * bots through `meta`: an empty hidden "website" field and the time the form
 * was open (at least 3 s). `Source` says where the visit came from
 * (utils/leadSource.ts).
 */
import { describeLeadSource, readAttribution } from "~/utils/leadSource";

type Notify = (message: string, type: "error" | "success") => void;

type ContactRequestPayload = {
  TopicInput: string;
  FullName: string;
  PhoneNumber: string;
  Source?: string;
};

// What a failed $fetch error carries (all optional).
type RequestError = {
  status?: number;
  statusCode?: number;
  response?: { status?: number };
  data?: { error?: { message?: string } };
  message?: string;
} | null | undefined;

const LIMITS = { topic: 200, fullName: 150, phone: 32 } as const;
/** The backend refuses a request sent sooner than this after the form opened. */
const MIN_FILL_MS = 3_000;

const isValidPhone = (value: string) => /^\+?[0-9\s().-]{7,32}$/.test(value.trim()) && value.replace(/\D/g, "").length >= 7;

export const useContactForm = (notify: Notify) => {
  const { t } = useI18n();
  // Taken now: after an await the composable has no current Nuxt instance.
  const track = useNuxtApp().$track as ((name: string, params?: Record<string, unknown>) => void) | undefined;
  const graphqlUrl = useGraphqlUrl();
  const apiOrigin = (() => {
    try {
      return graphqlUrl ? new URL(graphqlUrl).origin : "";
    } catch {
      return "";
    }
  })();

  const fullNameVal = ref("");
  const topicVal = ref("");
  const phoneVal = ref("");
  // The visitor's consent to the processing of their personal data; the
  // request is not sent without it.
  const consentVal = ref(false);
  // Hidden "website" field real visitors never fill (a bot trap).
  const honeypotVal = ref("");
  const sending = ref(false);

  let openedAt = Date.now();
  /** Call when the form is shown: the bot trap measures from here. */
  const markOpened = () => { openedAt = Date.now(); };

  // A short message in the visitor's language instead of the backend's raw text.
  const errorMessage = (error: unknown) => {
    const e = error as RequestError;
    const status = Number(e?.status ?? e?.statusCode ?? e?.response?.status ?? 0);
    const message = String(e?.data?.error?.message || e?.message || "");
    if (status === 429) return t("common.tooManyRequests");
    if (/phone/i.test(message)) return t("contacts.modal.phoneInvalid");
    if (!status || e instanceof TypeError) return t("common.networkError");
    return t("common.sendFailed");
  };

  const nameError = () => (fullNameVal.value.trim().length < 2 ? t("contacts.modal.nameRequired") : null);
  const topicError = () => (topicVal.value.trim() ? null : t("contacts.modal.topicRequired"));
  const phoneError = () => {
    if (!isValidPhone(phoneVal.value)) return t("contacts.modal.phoneInvalid");
    if (!consentVal.value) return t("contacts.form.consentRequired");
    return null;
  };

  const reset = () => {
    fullNameVal.value = "";
    topicVal.value = "";
    phoneVal.value = "";
    consentVal.value = false;
    markOpened();
  };

  /** Validates and sends; true when the request was created. */
  const submit = async (): Promise<boolean> => {
    if (sending.value) return false;
    if (!graphqlUrl) {
      notify(t("common.error"), "error");
      return false;
    }
    const problem = nameError() || topicError() || phoneError();
    if (problem) {
      notify(problem, "error");
      return false;
    }

    sending.value = true;
    try {
      // A three-step form can be answered in under 3 s by an autofill: wait out the rest.
      const wait = MIN_FILL_MS + 200 - (Date.now() - openedAt);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      const data: ContactRequestPayload = {
        TopicInput: topicVal.value.trim(),
        FullName: fullNameVal.value.trim(),
        PhoneNumber: phoneVal.value.trim(),
        Source: describeLeadSource(readAttribution(), `${location.pathname}${location.search}`, location.hostname),
      };
      const post = (body: ContactRequestPayload) =>
        $fetch(`${apiOrigin}/api/contacts-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { data: body, meta: { website: honeypotVal.value, elapsedMs: Date.now() - openedAt } },
        });
      try {
        await post(data);
      } catch (error) {
        // A backend from before the Source field refuses unknown fields (400):
        // the request then goes again without it, so no lead is lost while the
        // two services deploy.
        const e = error as RequestError;
        const status = Number(e?.status ?? e?.statusCode ?? e?.response?.status ?? 0);
        if (status !== 400 || !data.Source || !/invalid contact submission/i.test(String(e?.data?.error?.message || ""))) throw error;
        const { Source: _source, ...rest } = data;
        await post(rest);
      }
      reset();
      track?.("generate_lead", { form: "contact", page_path: location.pathname });
      return true;
    } catch (error) {
      notify(errorMessage(error), "error");
      return false;
    } finally {
      sending.value = false;
    }
  };

  return {
    /** Max lengths, also used as the inputs' maxlength. */
    fieldLimits: LIMITS,
    fullNameVal,
    topicVal,
    phoneVal,
    consentVal,
    honeypotVal,
    sending,
    markOpened,
    nameError,
    topicError,
    phoneError,
    submit,
  };
};
