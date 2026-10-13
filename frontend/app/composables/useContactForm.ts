/**
 * The contact form's data and submission, apart from its markup: field values,
 * validation, the file upload, the request to Strapi and readable errors.
 *
 * The public Strapi contract uploads the file first (POST /api/upload) and then
 * creates the request with that file's id (POST /api/contacts-requests). The
 * backend binds an upload to the client that sent it and refuses bots through
 * `meta` (an empty hidden "website" field and the time the form was open).
 */
type Notify = (message: string, type: "error" | "success") => void;

type ContactRequestPayload = {
  TopicInput: string;
  requestedServicesMessageInput: string;
  requestedServicesMessageFile: number;
  FullName: string;
  JobTitle: string;
  Company: string;
  PhoneNumber: string;
  email: string;
};

// What a failed $fetch / upload error carries (all optional).
type RequestError = {
  status?: number;
  statusCode?: number;
  response?: { status?: number };
  data?: { error?: { message?: string } };
  message?: string;
} | null | undefined;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const LIMITS = { topic: 200, services: 5000, fullName: 150, jobTitle: 150, company: 150, phone: 32, email: 254 } as const;

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isValidPhone = (value: string) => /^\+?[0-9\s().-]{7,32}$/.test(value.trim()) && value.replace(/\D/g, "").length >= 7;

export const useContactForm = (notify: Notify) => {
  const { t } = useI18n();
  const graphqlUrl = useGraphqlUrl();
  const apiOrigin = (() => {
    try {
      return graphqlUrl ? new URL(graphqlUrl).origin : "";
    } catch {
      return "";
    }
  })();

  const topicVal = ref("");
  const servicesVal = ref("");
  const fullNameVal = ref("");
  const jobTitleVal = ref("");
  const companyVal = ref("");
  const phoneVal = ref("");
  const emailVal = ref("");
  const selectedFile = ref<File | null>(null);
  const honeypotVal = ref("");
  const sending = ref(false);

  let formOpenedAt = 0;
  onMounted(() => {
    formOpenedAt = Date.now();
  });

  // The upload of the selected file, kept so a failed submit can be retried
  // without uploading the same file again.
  let uploaded: { file: File; id: number } | null = null;

  /** Takes a picked file; false (and a message) when it is too large. */
  const setFile = (file: File | null): boolean => {
    if (file && file.size > MAX_FILE_BYTES) {
      selectedFile.value = null;
      notify(t("common.maxFileSize"), "error");
      return false;
    }
    selectedFile.value = file;
    return true;
  };

  // A short message in the visitor's language instead of the backend's raw text.
  const errorMessage = (error: unknown) => {
    const e = error as RequestError;
    const status = Number(e?.status ?? e?.statusCode ?? e?.response?.status ?? 0);
    const message = String(e?.data?.error?.message || e?.message || "");
    if (status === 429) return t("common.tooManyRequests");
    if (status === 413 || /file/i.test(message)) return t("common.fileUploadFailed");
    if (/email|phone/i.test(message)) return t("common.invalidEmailOrPhone");
    if (!status || e instanceof TypeError) return t("common.networkError");
    return t("common.sendFailed");
  };

  /** The first problem with the current values, or null when they can be sent. */
  const validationError = (): string | null => {
    const values = [topicVal, servicesVal, fullNameVal, jobTitleVal, companyVal, phoneVal, emailVal].map((v) => v.value.trim());
    if (values.some((v) => !v)) return t("common.requiredField");
    if (!isValidEmail(emailVal.value)) return t("common.invalidEmail");
    if (!isValidPhone(phoneVal.value)) return t("common.invalidEmailOrPhone");
    const tooLong =
      topicVal.value.trim().length > LIMITS.topic ||
      servicesVal.value.trim().length > LIMITS.services ||
      fullNameVal.value.trim().length > LIMITS.fullName ||
      jobTitleVal.value.trim().length > LIMITS.jobTitle ||
      companyVal.value.trim().length > LIMITS.company ||
      phoneVal.value.trim().length > LIMITS.phone ||
      emailVal.value.trim().length > LIMITS.email;
    if (tooLong) return t("common.error");
    if (!selectedFile.value) return t("common.fileRequired");
    return null;
  };

  const uploadFile = async (file: File): Promise<number> => {
    const formData = new FormData();
    formData.append("files", file, file.name || "upload-file");
    const res = await fetch(`${apiOrigin}/api/upload`, { method: "POST", body: formData, credentials: "omit" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw Object.assign(new Error(text || `Upload failed with status ${res.status}`), { status: res.status });
    }
    const parsed: unknown = await res.json().catch(() => null);
    const id = Array.isArray(parsed) ? (parsed[0] as { id?: unknown } | undefined)?.id : null;
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) throw new Error(t("common.fileUploadFailed"));
    return id;
  };

  const createRequest = (data: ContactRequestPayload) =>
    $fetch(`${apiOrigin}/api/contacts-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { data, meta: { website: honeypotVal.value, elapsedMs: Date.now() - formOpenedAt } },
    });

  const reset = () => {
    for (const field of [topicVal, servicesVal, fullNameVal, jobTitleVal, companyVal, phoneVal, emailVal]) field.value = "";
    selectedFile.value = null;
    uploaded = null;
    formOpenedAt = Date.now();
  };

  /** Validates and sends; true when the request was created. */
  const submit = async (): Promise<boolean> => {
    if (sending.value) return false;
    if (!graphqlUrl) {
      notify(t("common.error"), "error");
      return false;
    }
    const problem = validationError();
    if (problem) {
      notify(problem, "error");
      return false;
    }

    sending.value = true;
    try {
      const file = selectedFile.value!;
      const fileId = uploaded?.file === file ? uploaded.id : await uploadFile(file);
      uploaded = { file, id: fileId };
      await createRequest({
        TopicInput: topicVal.value.trim(),
        requestedServicesMessageInput: servicesVal.value.trim(),
        FullName: fullNameVal.value.trim(),
        JobTitle: jobTitleVal.value.trim(),
        Company: companyVal.value.trim(),
        PhoneNumber: phoneVal.value.trim(),
        email: emailVal.value.trim(),
        requestedServicesMessageFile: fileId,
      });
      reset();
      notify(t("common.sent"), "success");
      return true;
    } catch (error) {
      // The server refused the attached upload (expired, or the server
      // restarted): the next try uploads the file again.
      if (/file/i.test(String((error as RequestError)?.data?.error?.message || ""))) uploaded = null;
      notify(errorMessage(error), "error");
      return false;
    } finally {
      sending.value = false;
    }
  };

  return {
    /** Max lengths, also used as the inputs' maxlength. */
    fieldLimits: LIMITS,
    topicVal,
    servicesVal,
    fullNameVal,
    jobTitleVal,
    companyVal,
    phoneVal,
    emailVal,
    selectedFile,
    honeypotVal,
    sending,
    setFile,
    submit,
  };
};
