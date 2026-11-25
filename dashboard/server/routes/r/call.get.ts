// "Позвонить" buttons in Telegram (which accepts only https links): this
// page sends the phone to the dialer. Only digits and "+" pass.
export default defineEventHandler((event) => {
  const digits = String(getQuery(event).to ?? "").replace(/[^\d+]/g, "").slice(0, 20);
  if (!/^\+?\d{7,15}$/.test(digits)) throw createError({ statusCode: 400, message: "Неверный номер" });
  return sendRedirect(event, `tel:${digits}`, 302);
});
