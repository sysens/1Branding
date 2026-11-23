/**
 * Every project site this app serves, one entry per site.
 *
 * A site lives in two places, both named after its slug:
 *   app/pages/<slug>/   its pages (index.vue is the site's "/")
 *   app/sites/<slug>/   its components, data, images, fonts and Tailwind preset
 *
 * On one of its `hosts` a site is served from the root ("/"), and only that
 * site's pages exist there. On any other host (localhost, the Railway domain)
 * every site can be previewed under "/<slug>", and "/" lists them all.
 * In development "<slug>.localhost" acts as the site's own host.
 */
export interface MicroSite {
  /** Folder name under app/pages and app/sites; also the preview path. */
  slug: string;
  name: string;
  /** Production hosts. The first one is the canonical address. */
  hosts: string[];
  /** Allow search engines to index the site on its own hosts. */
  index: boolean;
}

export const SITES: MicroSite[] = [
  {
    slug: "ertex",
    name: "ERTEX Group",
    hosts: ["ertex.onebrandingworld.com"],
    index: true,
  },
];

const normalizeHost = (host: string) => host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");

/** The site served at the root of this host, if the host belongs to one. */
export function siteForHost(host: string | undefined | null): MicroSite | undefined {
  if (!host) return undefined;
  const name = normalizeHost(host);
  return SITES.find((site) => site.hosts.includes(name) || name === `${site.slug}.localhost`);
}

export function siteBySlug(slug: string): MicroSite | undefined {
  return SITES.find((site) => site.slug === slug);
}

/** The site's public address, e.g. "https://ertex.onebrandingworld.com". */
export function siteOrigin(site: MicroSite): string {
  return `https://${site.hosts[0]}`;
}
