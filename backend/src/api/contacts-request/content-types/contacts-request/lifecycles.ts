import {
  escapeTelegramHtml,
  sendTelegramDocumentBuffer,
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
}

interface ContactsRequestEntry {
  TopicInput?: string | null;
  requestedServicesMessageInput?: string | null;
  FullName?: string | null;
  JobTitle?: string | null;
  Company?: string | null;
  PhoneNumber?: string | null;
  email?: string | null;
  requestedServicesMessageFile?: RequestedServicesMessageFile | null;
}

export default {
  async afterCreate(event: ContactsRequestLifecycleEvent) {
    try {
      const createdId = event.result?.id;
      if (!createdId) return;

      const entry = (await strapi.entityService.findOne(UID, createdId, {
        populate: ["requestedServicesMessageFile"],
      })) as ContactsRequestEntry | null;

      if (!entry) return;

      const file = entry?.requestedServicesMessageFile;

      const message = [
        "<b>Yangi Ariza keldi</b>",
        "",
        `<b>Topic:</b> ${escapeTelegramHtml(entry?.TopicInput)}`,
        `<b>Message:</b> ${escapeTelegramHtml(entry?.requestedServicesMessageInput)}`,
        `<b>Full name:</b> ${escapeTelegramHtml(entry?.FullName)}`,
        `<b>Job title:</b> ${escapeTelegramHtml(entry?.JobTitle)}`,
        `<b>Company:</b> ${escapeTelegramHtml(entry?.Company)}`,
        `<b>Phone:</b> ${escapeTelegramHtml(entry?.PhoneNumber)}`,
        `<b>Email:</b> ${escapeTelegramHtml(entry?.email)}`, 
      ].join("\n");

      await sendTelegramMessage(message);

      if (file?.url) {
        const baseUrl = process.env.PUBLIC_BASE_URL;
        if (!baseUrl) throw new Error('Attachment base URL is not configured');
        const fileUrl = new URL(file.url, baseUrl).href;
        await sendTelegramDocumentBuffer(fileUrl, file.name || 'document');
      }
    } catch {
      // Never log provider responses, token URLs, file URLs, or applicant data.
      strapi.log.error('Contact Telegram notification failed');
    }
  },
};
