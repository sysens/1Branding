// Contact normalisation: one form for a phone number and a Telegram
// username, so a second request from the same person finds their client.

/** "+998 90 123-45-67" → "+998901234567"; null when it is not a phone number. */
export function normalizePhone(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("00")) digits = digits.slice(2);
  // A local Uzbek number typed without the country code (90 123 45 67).
  if (!raw.startsWith("+") && !raw.startsWith("00") && digits.length === 9) digits = `998${digits}`;
  if (digits.length < 7 || digits.length > 15) return null;
  return `+${digits}`;
}

/** "@Some_User" → "some_user"; null when it is not a valid username. */
export function normalizeUsername(value: string | null | undefined): string | null {
  const clean = String(value ?? "").trim().replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
  return /^[A-Za-z0-9_]{5,32}$/.test(clean) ? clean.toLowerCase() : null;
}

export const phoneDigits = (phone: string | null | undefined) => String(phone ?? "").replace(/\D/g, "");
