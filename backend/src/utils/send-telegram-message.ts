const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 12_000;

export const escapeTelegramHtml = (value: unknown): string =>
  String(value ?? '-')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const credentials = () => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    strapi.log.warn('Telegram credentials are not configured');
    return null;
  }
  // Never allow token components to change the API path or leak to a new host.
  if (!/^\d+:[a-zA-Z0-9_-]+$/.test(botToken)) {
    strapi.log.warn('Invalid Telegram bot token format');
    return null;
  }
  return { botToken, chatId };
};

const telegramUrl = (botToken: string, action: 'sendMessage' | 'sendDocument') =>
  `https://api.telegram.org/bot${botToken}/${action}`;

const telegramPost = async (url: string, body: BodyInit, contentType?: string) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: contentType ? { 'Content-Type': contentType } : undefined,
    body,
    redirect: 'error',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    // Telegram may echo the bot token or applicant data in its error response.
    throw new Error(`Telegram request failed (HTTP ${response.status})`);
  }
};

export async function sendTelegramMessage(message: string) {
  const auth = credentials();
  if (!auth) return;
  await telegramPost(
    telegramUrl(auth.botToken, 'sendMessage'),
    JSON.stringify({
      chat_id: auth.chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
    'application/json',
  );
}

const checkedUploadUrl = (fileUrl: string): URL => {
  const base = process.env.PUBLIC_BASE_URL;
  if (!base) throw new Error('Attachment base URL is not configured');
  const expected = new URL(base);
  const url = new URL(fileUrl);
  const isLocalDev = process.env.NODE_ENV !== 'production' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(expected.hostname);
  if (url.origin !== expected.origin || url.username || url.password ||
      url.search || url.hash || !/^\/uploads\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(url.pathname) ||
      !(url.protocol === 'https:' || (isLocalDev && url.protocol === 'http:'))) {
    throw new Error('Attachment URL is not an approved upload');
  }
  return url;
};

const fetchBoundedFile = async (fileUrl: string): Promise<Uint8Array> => {
  const url = checkedUploadUrl(fileUrl);
  const response = await fetch(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Attachment download failed (HTTP ${response.status})`);
  const size = Number(response.headers.get('content-length'));
  if (response.headers.has('content-length') &&
      (!Number.isFinite(size) || size < 0 || size > MAX_DOCUMENT_BYTES)) {
    await response.body?.cancel();
    throw new Error('Attachment exceeds the size limit');
  }
  if (!response.body) throw new Error('Attachment has no response body');

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_DOCUMENT_BYTES) throw new Error('Attachment exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  if (total === 0) throw new Error('Attachment is empty');
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
};

export async function sendTelegramDocumentBuffer(fileUrl: string, fileName = 'file') {
  const auth = credentials();
  if (!auth) return;

  const bytes = await fetchBoundedFile(fileUrl);
  const safeFileName = fileName.replace(/[^\p{L}\p{N}._ -]/gu, '_').slice(0, 150) || 'file';
  const formData = new FormData();
  formData.append('chat_id', auth.chatId);
  formData.append('document', new Blob([bytes]), safeFileName);
  await telegramPost(telegramUrl(auth.botToken, 'sendDocument'), formData);
}
