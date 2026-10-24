import {
  escapeTelegramHtml,
  sendTelegramDocument,
  sendTelegramMessage,
} from "../../../../utils/send-telegram-message";

const UID = "api::contacts-request.contacts-request" as const;

interface ContactsRequestLifecycleEvent {
  result?: {
    id?: number;
  };
}

interface RequestedServicesMessageFile {
  name?: string | null;
  url?: string | null;
  provider?: string | null;
}

interface ContactsRequestEntry {
  TopicInput?: string | null;
  requestedServicesMessageInput?: string | null;
  FullName?: string | null;
  JobTitle?: string | null;
  Company?: string | null;
  PhoneNumber?: string | null;
  email?: string | null;
  Source?: string | null;
  requestedServicesMessageFile?: RequestedServicesMessageFile | null;
}

// Telegram rejects sendMessage text over 4096 characters, and the public form
// allows a 5000-character message, so each field is clipped before escaping.
const clip = (value: string | null | undefined, max: number): string | null | undefined => {
  if (typeof value !== "string" || value.length <= max) return value;
  let end = max - 1;
  const code = value.charCodeAt(end - 1);
  if (code >= 0xd800 && code <= 0xdbff) end -= 1; // do not split a surrogate pair
  return `${value.slice(0, end)}…`;
};

const logFailure = () => {
  // Never log provider responses, token URLs, file URLs, or applicant data.
  strapi.log.error("Contact Telegram notification failed");
};

const notify = async (entry: ContactsRequestEntry): Promise<void> => {
  const file = entry.requestedServicesMessageFile;

  const message = [
    "<b>Yangi Ariza keldi</b>",
    "",
    `<b>Topic:</b> ${escapeTelegramHtml(clip(entry.TopicInput, 200))}`,
    // The only multi-line field: quoted, so lines inside it cannot pass for
    // the fields below (single-line fields refuse line breaks).
    `<b>Message:</b><blockquote>${escapeTelegramHtml(clip(entry.requestedServicesMessageInput, 2500))}</blockquote>`,
    `<b>Full name:</b> ${escapeTelegramHtml(clip(entry.FullName, 150))}`,
    `<b>Job title:</b> ${escapeTelegramHtml(clip(entry.JobTitle, 150))}`,
    `<b>Company:</b> ${escapeTelegramHtml(clip(entry.Company, 150))}`,
    `<b>Phone:</b> ${escapeTelegramHtml(clip(entry.PhoneNumber, 32))}`,
    `<b>Email:</b> ${escapeTelegramHtml(clip(entry.email, 254))}`,
    ...(entry.Source ? [`<b>Source:</b> ${escapeTelegramHtml(clip(entry.Source, 500))}`] : []),
  ].join("\n");

  await sendTelegramMessage(message);

  if (file?.url) {
    await sendTelegramDocument(file.url, file.name || "document", file.provider || "local");
  }
};

export default {
  async afterCreate(event: ContactsRequestLifecycleEvent) {
    try {
      const createdId = event.result?.id;
      if (!createdId) return;

      // Read inside the create transaction so the new row and its media link are visible.
      const entry = (await strapi.db.query(UID).findOne({
        where: { id: createdId },
        populate: ["requestedServicesMessageFile"],
      })) as ContactsRequestEntry | null;

      if (!entry) return;

      // afterCreate runs inside the document-service transaction. Awaiting
      // Telegram here (up to ~36s of network calls) would hold the DB
      // transaction/connection open and delay the HTTP response, so send only
      // after a successful commit and never block the request on it.
      await strapi.db.transaction(async ({ onCommit }) => {
        onCommit(() => {
          notify(entry).catch(logFailure);
        });
      });
    } catch {
      logFailure();
    }
  },
};
