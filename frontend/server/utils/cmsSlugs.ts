/**
 * The readable address of a case study or article given by its CMS document
 * id, so that an old address (/ProjectSlug/<id>, /NewsSlug/<id>) answers with
 * one 301 to /projects/<slug> instead of a second one from /projects/<id>.
 * The ids and slugs are read from the CMS at most every 10 minutes; when the
 * CMS cannot answer, the id address is kept (its page redirects from there).
 */
type Node = { documentId?: string | null; slug?: string | null } | null;
type SlugsResponse = { data?: Record<string, { nodes?: Node[] | null } | null> | null };
export type FetchSlugs = (url: string, options: {
  method: "POST";
  headers: { "Content-Type": string };
  body: { query: string };
  timeout: number;
}) => Promise<SlugsResponse>;

const TTL_MS = 10 * 60_000;
// The slug is shared by every language; English has every entry.
const query = `
  query Slugs {
    projectsPages_connection(locale: "en", pagination: { pageSize: 100 }) { nodes { documentId slug } }
    newsPages_connection(locale: "en", pagination: { pageSize: 100 }) { nodes { documentId slug } }
  }
`;
const sections = { projects: "projectsPages_connection", news: "newsPages_connection" } as const;
const DETAIL = /^((?:\/(?:ru|uz))?)\/(projects|news)\/([a-z0-9]{24})$/;

let cache: { at: number; slugs: Promise<Map<string, string>> } | null = null;

async function load(graphqlUrl: string, fetchSlugs: FetchSlugs): Promise<Map<string, string>> {
  const response = await fetchSlugs(graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { query },
    timeout: 3000,
  });
  const slugs = new Map<string, string>();
  for (const [section, collection] of Object.entries(sections)) {
    for (const node of response.data?.[collection]?.nodes ?? []) {
      const id = node?.documentId?.trim();
      const slug = node?.slug?.trim();
      if (id && slug) slugs.set(`${section}/${id}`, slug);
    }
  }
  return slugs;
}

/** `path` with a case study's or article's document id replaced by its slug. */
export async function withCmsSlug(path: string, graphqlUrl: string, fetchSlugs: FetchSlugs): Promise<string> {
  const match = DETAIL.exec(path);
  if (!match || !graphqlUrl) return path;
  if (!cache || Date.now() - cache.at > TTL_MS) {
    const slugs = load(graphqlUrl, fetchSlugs);
    cache = { at: Date.now(), slugs };
    // A failed read is not kept: the next old address asks the CMS again.
    slugs.catch(() => {
      if (cache?.slugs === slugs) cache = null;
    });
  }
  const pending = cache.slugs;
  try {
    const slug = (await pending).get(`${match[2]}/${match[3]}`);
    return slug ? `${match[1]}/${match[2]}/${encodeURIComponent(slug)}` : path;
  } catch {
    return path;
  }
}
