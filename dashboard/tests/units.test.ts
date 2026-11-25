// Small pure pieces: channel rules, contact normalisation, contact codes, TOTP.
import { describe, expect, test } from "bun:test";
import { matchChannelKey } from "../server/utils/channels";
import { normalizePhone, normalizeUsername } from "../server/utils/contacts";
import { findContactCode } from "../server/utils/leads";
import { DEFAULT_CHANNELS } from "../server/utils/seed";
import { base32Decode, base32Encode, totpCode, verifyTotp } from "../server/utils/totp";

const list = DEFAULT_CHANNELS.map((c) => ({ key: c.key, rules: c.rules, isActive: true }));

describe("UTM → channel", () => {
  test("utm tags of the standard (spec 5)", () => {
    expect(matchChannelKey(list, { src: "meta", med: "paid_social" })).toBe("meta");
    expect(matchChannelKey(list, { src: "google", med: "cpc" })).toBe("google");
    expect(matchChannelKey(list, { src: "telegram", med: "posev" })).toBe("tg_posev");
    expect(matchChannelKey(list, { src: "telegram", med: "organic_social" })).toBe("telegram");
    expect(matchChannelKey(list, { src: "blogger", med: "influencer", cnt: "anna" })).toBe("blogger");
    expect(matchChannelKey(list, { med: "referral" })).toBe("referral");
  });
  test("click ids without tags (auto-tagging)", () => {
    expect(matchChannelKey(list, { gclid: "abc" })).toBe("google");
    expect(matchChannelKey(list, { yclid: "123" })).toBe("yandex");
  });
  test("referrers and direct visits", () => {
    expect(matchChannelKey(list, { ref: "https://www.google.com/" })).toBe("organic_search");
    expect(matchChannelKey(list, { ref: "https://l.instagram.com/?u=x" })).toBe("instagram");
    expect(matchChannelKey(list, { ref: "https://example.org/post" })).toBe("other");
    expect(matchChannelKey(list, { land: "/ru" })).toBe("direct");
    expect(matchChannelKey(list, null)).toBe("direct");
  });
  test("unknown tags fall into 'other sites'", () => {
    expect(matchChannelKey(list, { src: "newsletter", med: "email" })).toBe("other");
  });
});

describe("contacts", () => {
  test("phones become one form", () => {
    expect(normalizePhone("+998 90 123-45-67")).toBe("+998901234567");
    expect(normalizePhone("90 123 45 67")).toBe("+998901234567");
    expect(normalizePhone("00998901234567")).toBe("+998901234567");
    expect(normalizePhone("12")).toBeNull();
  });
  test("Telegram usernames", () => {
    expect(normalizeUsername("@Some_User")).toBe("some_user");
    expect(normalizeUsername("https://t.me/OneBranding_contact")).toBe("onebranding_contact");
    expect(normalizeUsername("@ab")).toBeNull();
  });
  test("contact codes in messages", () => {
    expect(findContactCode("Здравствуйте! Хочу обсудить проект (OB-4821)")).toBe("OB-4821");
    expect(findContactCode("ob1042 привет")).toBe("OB-1042");
    expect(findContactCode("без кода")).toBeNull();
  });
});

describe("TOTP (RFC 6238)", () => {
  // The RFC's SHA-1 test key "12345678901234567890" at T = 59 s → 94287082 (8 digits) → 287082.
  const secret = base32Encode(Buffer.from("12345678901234567890"));
  test("base32 round trip", () => {
    expect(base32Decode(secret).toString()).toBe("12345678901234567890");
  });
  test("RFC test vector", () => {
    expect(totpCode(secret, 59_000)).toBe("287082");
    expect(totpCode(secret, 1_111_111_109_000)).toBe("081804");
  });
  test("accepts one step of drift", () => {
    expect(verifyTotp(secret, "287082", 59_000 + 30_000)).toBe(true);
    expect(verifyTotp(secret, "287082", 59_000 + 120_000)).toBe(false);
  });
});
