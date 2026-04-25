export async function sendTelegramMessage(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    strapi.log.warn(
      "Telegram env topilmadi: TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID yo'q",
    );
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Telegram sendMessage error: ${response.status} - ${errorText}`,
    );
  }
}

export async function sendTelegramDocumentBuffer(
  fileUrl: string,
  fileName = "file",
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    strapi.log.warn(
      "Telegram env topilmadi: TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID yo'q",
    );
    return;
  }

  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) {
    throw new Error(`File yuklab bo'lmadi: ${fileResponse.status}`);
  }

  const arrayBuffer = await fileResponse.arrayBuffer();

  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("document", new Blob([arrayBuffer]), fileName);

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendDocument`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Telegram sendDocument error: ${response.status} - ${errorText}`,
    );
  }
}
