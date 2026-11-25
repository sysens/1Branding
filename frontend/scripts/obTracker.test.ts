import { describe, expect, test } from "bun:test";
import {
  COUNTRIES, LEAD_SERVICES, NO_PHONE, countryOf, formatPhone, isValidPhone, isValidTelegram, normalizeTelegram,
  strapiLeadData, toE164,
} from "../app/utils/leadForm";
import {
  SESSION_MS, applyTouch, buildFbc, caseSlug, cookieDomain, deviceType, fallbackCode, gaClientId, isBot, isCode,
  isExpired, isInternalHost, isSignificant, isUuid, messengerOf, readTouch, touchKey, uuid, withText, type Touches,
} from "../app/utils/obTracker";
import { SERVICE_PAGES } from "../app/utils/servicePages";

const SITE = "https://onebrandingworld.com";
const DAY = 24 * 60 * 60 * 1000;

describe("touches", () => {
  test("reads utm tags, click ids, the external referrer and the landing page", () => {
    const touch = readTouch(`${SITE}/ru/pricing?utm_source=google&utm_medium=cpc&utm_campaign=brand&utm_content=ad1&utm_term=logo&gclid=G1&yclid=Y1&fbclid=F1`, "https://www.google.com/", 1000);
    expect(touch).toEqual({
      src: "google", med: "cpc", cmp: "brand", cnt: "ad1", trm: "logo", gclid: "G1", yclid: "Y1", fbclid: "F1",
      ref: "https://www.google.com/",
      land: "/ru/pricing?utm_source=google&utm_medium=cpc&utm_campaign=brand&utm_content=ad1&utm_term=logo&gclid=G1&yclid=Y1&fbclid=F1",
      at: 1000,
    });
  });

  test("the site itself and its subdomains are not a referrer", () => {
    expect(readTouch(`${SITE}/about`, `${SITE}/`, 1).ref).toBeUndefined();
    expect(readTouch(`${SITE}/about`, "https://www.onebrandingworld.com/", 1).ref).toBeUndefined();
    expect(readTouch(`${SITE}/about`, "https://ertex.onebrandingworld.com/", 1).ref).toBeUndefined();
    expect(readTouch(`${SITE}/about`, "https://notonebrandingworld.com/", 1).ref).toBe("https://notonebrandingworld.com/");
    expect(readTouch(`${SITE}/about`, "", 1).ref).toBeUndefined();
    expect(isInternalHost("www.onebrandingworld.com", "onebrandingworld.com")).toBe(true);
    expect(isInternalHost("example.com", "onebrandingworld.com")).toBe(false);
  });

  test("significant: tags, click ids or an external referrer", () => {
    expect(isSignificant(readTouch(`${SITE}/`, "", 1))).toBe(false);
    expect(isSignificant(readTouch(`${SITE}/?utm_source=x`, "", 1))).toBe(true);
    expect(isSignificant(readTouch(`${SITE}/?gclid=abc`, "", 1))).toBe(true);
    expect(isSignificant(readTouch(`${SITE}/`, "https://t.me/", 1))).toBe(true);
    expect(isSignificant(readTouch(`${SITE}/`, `${SITE}/ru`, 1))).toBe(false);
  });

  test("the first touch stays; a direct visit never replaces the last significant click", () => {
    const empty: Touches = { first: null, last: null };
    const direct = readTouch(`${SITE}/`, "", 1);
    const one = applyTouch(empty, direct, true);
    expect(one).toEqual({ first: direct, last: direct, newVisit: true });

    const ad = readTouch(`${SITE}/ru?utm_source=instagram&utm_campaign=autumn`, "", 2);
    const two = applyTouch(one, ad, false);
    expect(two.first).toBe(direct);
    expect(two.last).toBe(ad);
    expect(two.newVisit).toBe(true);

    // Days later, typed in: the ad stays the last click, a new visit starts.
    const three = applyTouch(two, readTouch(`${SITE}/pricing`, "", 2 + 3 * DAY), true);
    expect(three.first).toBe(direct);
    expect(three.last).toBe(ad);
    expect(three.newVisit).toBe(true);
  });

  test("a reload of the same landing within the visit changes nothing", () => {
    const ad = readTouch(`${SITE}/?utm_source=google`, "https://www.google.com/", 10);
    const state = applyTouch({ first: ad, last: ad }, readTouch(`${SITE}/?utm_source=google`, "https://www.google.com/", 20), false);
    expect(state.last).toBe(ad);
    expect(state.newVisit).toBe(false);
    expect(touchKey(ad)).toBe(touchKey(readTouch(`${SITE}/other?utm_source=google`, "https://www.google.com/search", 30)));
  });

  test("the same source after the visit ended is a new last click", () => {
    const ad = readTouch(`${SITE}/?utm_source=google`, "", 10);
    const again = readTouch(`${SITE}/?utm_source=google`, "", 10 + DAY);
    const state = applyTouch({ first: ad, last: ad }, again, true);
    expect(state.last).toBe(again);
    expect(state.first).toBe(ad);
  });

  test("another source within the visit starts a new one", () => {
    const ad = readTouch(`${SITE}/?utm_source=google`, "", 10);
    const other = readTouch(`${SITE}/`, "https://yandex.ru/", 20);
    const state = applyTouch({ first: ad, last: ad }, other, false);
    expect(state.last).toBe(other);
    expect(state.newVisit).toBe(true);
  });

  test("a visit ends after 30 minutes without activity", () => {
    expect(isExpired(null, 0)).toBe(true);
    expect(isExpired({ t: 0 }, SESSION_MS)).toBe(false);
    expect(isExpired({ t: 0 }, SESSION_MS + 1)).toBe(true);
  });
});

describe("tracker helpers", () => {
  test("cookie domain: the registrable domain on the site, host-only elsewhere", () => {
    expect(cookieDomain("onebrandingworld.com")).toBe(".onebrandingworld.com");
    expect(cookieDomain("www.onebrandingworld.com")).toBe(".onebrandingworld.com");
    expect(cookieDomain("ertex.onebrandingworld.com")).toBe(".onebrandingworld.com");
    expect(cookieDomain("frontend.up.railway.app")).toBe("");
    expect(cookieDomain("127.0.0.1")).toBe("");
  });

  test("third-party ids", () => {
    expect(gaClientId("GA1.1.1234567890.1700000000")).toBe("1234567890.1700000000");
    expect(gaClientId("GA1.2.99.88")).toBe("99.88");
    expect(gaClientId("garbage")).toBe("");
    expect(buildFbc("AbC", 1700000000000)).toBe("fb.1.1700000000000.AbC");
  });

  test("devices", () => {
    const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
    const android = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36";
    const tab = "Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";
    const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
    expect(deviceType(iphone, 390, 5)).toBe("mobile");
    expect(deviceType(android, 412, 5)).toBe("mobile");
    expect(deviceType(tab, 1280, 5)).toBe("tablet");
    expect(deviceType(mac, 1024, 5)).toBe("tablet");
    expect(deviceType(mac, 1440, 0)).toBe("desktop");
    expect(deviceType(mac, 500, 0)).toBe("mobile");
  });

  test("bots", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isBot("Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/130.0")).toBe(true);
    expect(isBot("Mozilla/5.0 Chrome-Lighthouse")).toBe(true);
    expect(isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36")).toBe(false);
    expect(isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36", true)).toBe(true);
  });

  test("ids and codes", () => {
    expect(isUuid(uuid())).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    const code = fallbackCode();
    expect(code).toMatch(/^OB-\d{6}$/);
    expect(isCode(code)).toBe(true);
    expect(isCode("OB-1042")).toBe(true);
    expect(isCode("1042")).toBe(false);
  });

  test("messenger links get the prefilled text", () => {
    expect(messengerOf("https://t.me/Onebranding_contact")).toBe("telegram");
    expect(messengerOf("https://t.me/onebranding_contact?text=x")).toBe("telegram");
    expect(messengerOf("https://t.me/someone_else")).toBeNull();
    expect(messengerOf("https://wa.me/998935608000")).toBe("whatsapp");
    expect(messengerOf("https://www.instagram.com/onebranding.uz/")).toBe("instagram");
    expect(withText("https://t.me/Onebranding_contact?text=old", "Hello! (OB-1042)")).toBe("https://t.me/Onebranding_contact?text=Hello!%20(OB-1042)");
    expect(withText("https://wa.me/998935608000", "Salom")).toBe("https://wa.me/998935608000?text=Salom");
  });

  test("case pages", () => {
    expect(caseSlug("/projects/art-anor")).toBe("art-anor");
    expect(caseSlug("/ru/projects/ertex")).toBe("ertex");
    expect(caseSlug("/projects")).toBe("");
    expect(caseSlug("/ru/services/brending")).toBe("");
  });
});

describe("lead form", () => {
  const uz = countryOf("UZ");

  test("services: every service page, the package and not sure", () => {
    expect(LEAD_SERVICES).toEqual([...SERVICE_PAGES.map((page) => page.key), "package", "unsure"]);
  });

  test("phone mask by country", () => {
    expect(formatPhone("901234567", uz)).toBe("90 123 45 67");
    expect(formatPhone("90-123", uz)).toBe("90 123");
    expect(formatPhone("+998 90 123 45 67", uz)).toBe("90 123 45 67");
    expect(formatPhone("9012345678999", uz)).toBe("90 123 45 67");
    expect(formatPhone("2025550123", countryOf("US"))).toBe("202 555 0123");
    expect(countryOf("XX")).toBe(COUNTRIES[0]!);
  });

  test("phone validation", () => {
    expect(isValidPhone("90 123 45 67", uz)).toBe(true);
    expect(isValidPhone("90 123 45", uz)).toBe(false);
    expect(isValidPhone("", uz)).toBe(false);
    expect(isValidPhone("1234567", countryOf("DE"))).toBe(true);
    expect(isValidPhone("123456", countryOf("DE"))).toBe(false);
    expect(toE164("90 123 45 67", uz)).toBe("+998901234567");
    expect(toE164("701 234 56 78", countryOf("KZ"))).toBe("+77012345678");
  });

  test("Telegram usernames", () => {
    expect(isValidTelegram("@durov_1")).toBe(true);
    expect(isValidTelegram("durov_1")).toBe(true);
    expect(isValidTelegram("https://t.me/durov_1")).toBe(true);
    expect(isValidTelegram("@abcd")).toBe(false);
    expect(isValidTelegram("@" + "a".repeat(33))).toBe(false);
    expect(isValidTelegram("@bad-name")).toBe(false);
    expect(isValidTelegram("")).toBe(false);
    expect(normalizeTelegram(" t.me/durov_1/ ")).toBe("@durov_1");
    expect(normalizeTelegram("@durov_1")).toBe("@durov_1");
  });

  test("the request as Strapi takes it when the dashboard is down", () => {
    const phone = strapiLeadData({ name: "Aziz", company: "Ertex", method: "phone", contact: "+998901234567" }, "Retail", ["Logo design", "Branding package"]);
    expect(phone).toEqual({ TopicInput: "Ertex · Retail · Logo design, Branding package", FullName: "Aziz", PhoneNumber: "+998901234567" });
    const telegram = strapiLeadData({ name: "Aziz", company: "Ertex", method: "telegram", contact: "@aziz_b" }, "IT", []);
    expect(telegram.TopicInput).toBe("Telegram @aziz_b · Ertex · IT");
    expect(telegram.PhoneNumber).toBe(NO_PHONE);
    // The backend's phone rule (contact-protection.ts).
    expect(/^\+?[0-9\s().-]{7,32}$/.test(NO_PHONE) && NO_PHONE.replace(/\D/g, "").length >= 7).toBe(true);
    const long = strapiLeadData({ name: "A\nB", company: "C".repeat(150), method: "whatsapp", contact: "+998901234567" }, "Retail", ["x".repeat(100)]);
    expect(long.TopicInput.length).toBe(200);
    expect(long.TopicInput.startsWith("WhatsApp · ")).toBe(true);
    expect(long.FullName).toBe("A B");
  });
});
