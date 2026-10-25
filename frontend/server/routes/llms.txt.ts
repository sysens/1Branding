import { COMPANY, COMPANY_ADDRESS } from "../../app/utils/company";
import { SERVICE_PAGES, type ServiceKey } from "../../app/utils/servicePages";
import { resolveSiteOrigin } from "../utils/requestOrigin";
import branding from "../../app/content/services/branding.en.json";
import logo from "../../app/content/services/logo.en.json";
import identity from "../../app/content/services/identity.en.json";
import brandbook from "../../app/content/services/brandbook.en.json";
import strategy from "../../app/content/services/strategy.en.json";
import packaging from "../../app/content/services/packaging.en.json";
import print from "../../app/content/services/print.en.json";
import social from "../../app/content/services/social.en.json";
import photo from "../../app/content/services/photo.en.json";
import motion from "../../app/content/services/motion.en.json";
import presentation from "../../app/content/services/presentation.en.json";
import web from "../../app/content/services/web.en.json";
import uiux from "../../app/content/services/uiux.en.json";
import crm from "../../app/content/services/crm.en.json";
import signage from "../../app/content/services/signage.en.json";

// /llms.txt (llmstxt.org): the company's facts and its pages in one short
// Markdown file, for AI assistants that read a site before citing it. The facts
// come from the same sources as the pages and the JSON-LD.
const COPY: Record<ServiceKey, { h1: string; description: string }> = {
  branding, logo, identity, brandbook, strategy, packaging, print, social, photo, motion, presentation, web, uiux, crm, signage,
};

export default defineEventHandler((event) => {
  const origin = resolveSiteOrigin(event);
  const url = (path: string) => `${origin}${path}`;
  const services = SERVICE_PAGES.map((page) => {
    const copy = COPY[page.key];
    return `- [${copy.h1}](${url(`/services/${page.slugs.en}`)}): ${copy.description}`;
  });

  setHeader(event, "Content-Type", "text/markdown; charset=utf-8");
  setHeader(event, "Cache-Control", "public, max-age=3600, s-maxage=3600");
  return [
    `# ${COMPANY.name}`,
    "",
    `> ${COMPANY.name} is a full-cycle branding agency in Tashkent, Uzbekistan: brand strategy and naming, logo design, visual identity, brand books, packaging, and the print, digital and video work around them. Prices run from $35 (one presentation slide) to $5,900 (a branding package).`,
    "",
    `- Address: ${COMPANY_ADDRESS.en.full}`,
    `- Phone: ${COMPANY.phone.display}`,
    `- Hours: Monday to Friday, ${COMPANY.hours.opens}–${COMPANY.hours.closes}`,
    "- Languages: English (this site's default), Russian (/ru), Uzbek (/uz)",
    "",
    "## Services",
    "",
    ...services,
    "",
    "## Company",
    "",
    `- [About](${url("/about")}): the team and how it works`,
    `- [Pricing](${url("/pricing")}): packages and prices in US dollars`,
    `- [OneGuarantee](${url("/one-guarantee")}): design tested with a live audience before launch`,
    `- [Portfolio](${url("/projects")})`,
    `- [Blog](${url("/news")})`,
    `- [Contact](${url("/contact")})`,
    "",
    "## Optional",
    "",
    `- [Услуги на русском](${url("/ru/services")})`,
    `- [Xizmatlar oʻzbekcha](${url("/uz/services")})`,
    `- [Sitemap](${url("/sitemap.xml")})`,
    "",
  ].join("\n");
});
