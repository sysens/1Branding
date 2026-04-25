import {
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
        `<b>Topic:</b> ${entry?.TopicInput ?? "-"}`,
        `<b>Message:</b> ${entry?.requestedServicesMessageInput ?? "-"}`,
        `<b>Full name:</b> ${entry?.FullName ?? "-"}`,
        `<b>Job title:</b> ${entry?.JobTitle ?? "-"}`,
        `<b>Company:</b> ${entry?.Company ?? "-"}`,
        `<b>Phone:</b> ${entry?.PhoneNumber ?? "-"}`,
        `<b>Email:</b> ${entry?.email ?? "-"}`,
      ].join("\n");

      await sendTelegramMessage(message);

      if (file?.url) {
        const baseUrl =
          process.env.PUBLIC_BASE_URL ||
          strapi.config.get("server.url") ||
          "http://localhost:1337";

        const fileUrl = file.url.startsWith("http")
          ? file.url
          : `${baseUrl}${file.url}`;

        const fileName = file.name || "document";

        await sendTelegramDocumentBuffer(fileUrl, fileName);
      }
    } catch (error) {
      strapi.log.error("Telegram yuborishda xatolik:", error);
    }
  },
};
