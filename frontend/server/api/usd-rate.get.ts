import { usdRate } from "../utils/usdRate";

// A plain JSON GET (Nitro's typed $fetch compares every route type for a URL
// it cannot know, which overflows the type checker).
type GetJson = (url: string, options: { timeout: number; parseResponse: (text: string) => unknown }) => Promise<unknown>;
const getJson = $fetch as unknown as GetJson;

// The so'm rate for the price lists (app/composables/useUzsPrice.ts); null
// fields when the Central Bank's rate is not available.
export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "public, max-age=3600");
  const rate = await usdRate((url, options) => getJson(url, { ...options, parseResponse: JSON.parse }));
  return rate ?? { rate: null, date: null };
});
