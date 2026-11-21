import { computed, type ComputedRef } from "vue";
import { CASE_STORIES } from "~/utils/caseStories";
import { caseColor } from "~/utils/caseStudy";
import { PROJECT_LOGOS, type ProjectLogo } from "~/utils/projectLogos";

type ProjectMedia = {
  url?: string | null;
  width?: number | null;
  height?: number | null;
};

type ProjectNode = {
  documentId?: string | null;
  slug?: string | null;
  projectColor?: string | null;
  projectLogo?: ProjectMedia | null;
  category?: { categoryName?: string | null } | null;
  section1?: {
    projectTitle?: string | null;
    images?: Array<ProjectMedia | null> | null;
  } | null;
};

type ProjectsWallResponse = {
  data?: {
    projectsPages_connection?: {
      nodes?: Array<ProjectNode | null> | null;
    } | null;
    /** The English entries' categories, off English (see the query). */
    fallbackProjects?: {
      nodes?: Array<Pick<ProjectNode, "documentId" | "category" | "projectColor"> | null> | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

export type ProjectWallItem = {
  id: string;
  /** The cover: a CMS upload's address, or a picture of the site's own (the
      grid draws it with OptImage, from its build-time copies). */
  image: string;
  title: string;
  /** The CMS category's name, "" when the project has none. */
  category: string;
  /** The project's own colour (#RRGGBB): the colour its page opens in. */
  color: string;
  /** A second picture, shown over the cover while the pointer is on it. */
  hoverImage?: string;
  /** The project's logo for the corner of its card; none: its initial. */
  logo?: ProjectLogo;
  to: string;
};

type ProjectsWallData = {
  projects: ComputedRef<ProjectWallItem[]>;
};

// Off English it also asks for the English entries' categories and colours:
// the CMS has its categories in English only, so a Russian or Uzbek entry
// comes without one (the site names it in the page's language:
// projectsPage.categoryNames), and the colour is the same in every language.
const PROJECTS_WALL_QUERY = `
  query ProjectsWall($locale: I18NLocaleCode, $fallbackLocale: I18NLocaleCode, $withFallback: Boolean!) {
    projectsPages_connection(
      pagination: { page: 1, pageSize: 100 }
      sort: "createdAt:asc"
      locale: $locale
    ) {
      nodes {
        documentId
        slug
        projectColor
        projectLogo { url width height }
        category { categoryName }
        section1 {
          projectTitle
          images { url }
        }
      }
    }
    fallbackProjects: projectsPages_connection(
      pagination: { page: 1, pageSize: 100 }
      locale: $fallbackLocale
    ) @include(if: $withFallback) {
      nodes {
        documentId
        projectColor
        category { categoryName }
      }
    }
  }
`;

type WallNodes = { nodes: ProjectNode[]; categories: Record<string, string>; colors: Record<string, string> };

// The site's green: the colour of a project that has none of its own.
const SITE_GREEN = "#20E848";

export const useProjectsWallData = async (): Promise<ProjectsWallData> => {
  const graphqlUrl = useGraphqlUrl();
  const cmsMedia = useCmsMedia();
  const localePath = useLocalePath();
  const gqlLocale = useCmsLocale();
  const { t, te } = useI18n();

  const fetchProjects = async (localeValue: CmsLocale): Promise<WallNodes> => {
    if (!graphqlUrl) return { nodes: [], categories: {}, colors: {} };

    const response = await cmsRequest<NonNullable<ProjectsWallResponse["data"]>>(graphqlUrl, PROJECTS_WALL_QUERY, {
      locale: localeValue,
      fallbackLocale: "en",
      withFallback: localeValue !== "en",
    });

    if (response?.errors?.length && !response.data?.projectsPages_connection) {
      throw new Error(response.errors.map((error) => error.message).join("; "));
    }

    const categories: Record<string, string> = {};
    const colors: Record<string, string> = {};
    for (const node of response?.data?.fallbackProjects?.nodes ?? []) {
      const name = node?.category?.categoryName?.trim();
      const color = caseColor(node?.projectColor)?.hex;
      if (node?.documentId && name) categories[node.documentId] = name;
      if (node?.documentId && color) colors[node.documentId] = color;
    }
    return {
      nodes: (response?.data?.projectsPages_connection?.nodes ?? []).filter((node): node is ProjectNode => node !== null),
      categories,
      colors,
    };
  };

  const { data } = await useAsyncData<WallNodes>(
    () => `projects-wall-${gqlLocale.value}`,
    async () => {
      const localized = await fetchProjects(gqlLocale.value);
      if (localized.nodes.length || gqlLocale.value === "en") return localized;
      return fetchProjects("en");
    },
    {
      default: () => ({ nodes: [], categories: {}, colors: {} }),
    }
  );

  // A CMS category in the page's language: the entry's own, or else the
  // English one as the site names it ("Branding" -> "Брендинг"). An English
  // name the site has no word for is left out rather than shown in English.
  const categoryOf = (project: ProjectNode) => {
    const own = project.category?.categoryName?.trim();
    if (own) return own;
    const english = data.value.categories[project.documentId?.trim() || ""];
    const key = `projectsPage.categoryNames.${english?.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
    return english && te(key) ? t(key) : "";
  };

  // The case stories written in the site itself (utils/caseStories.ts), each
  // with a page of its own: first in the grid, before the CMS's projects.
  const stories = computed<ProjectWallItem[]>(() =>
    CASE_STORIES.map((story) => ({
      id: `story-${story.slug}`,
      image: story.cover,
      hoverImage: story.hover,
      title: t(`caseStories.${story.key}.title`),
      category: t(`caseStories.${story.key}.category`),
      color: story.accent,
      logo: story.badge,
      to: localePath({ path: `/projects/${story.slug}` }),
    }))
  );

  // An uploaded logo first, then the one the site holds for the project.
  const logoOf = (project: ProjectNode): ProjectLogo | undefined => {
    const uploaded = project.projectLogo;
    const src = cmsMedia(uploaded?.url);
    if (src && uploaded?.width && uploaded?.height) return { src, width: uploaded.width, height: uploaded.height };
    return PROJECT_LOGOS[project.slug?.trim() || ""];
  };

  const cmsProjects = computed<ProjectWallItem[]>(() =>
    data.value.nodes
      .map((project): ProjectWallItem | null => {
        const id = project.documentId?.trim() || "";
        const image = cmsMedia(project.section1?.images?.[0]?.url);
        const hoverImage = cmsMedia(project.section1?.images?.[1]?.url);

        if (!id || !image) return null;

        return {
          id,
          image,
          // The CMS projects still carry "Lorem ipsum" titles: those never
          // become the image's alt or the link's name.
          title: cmsText(project.section1?.projectTitle) || t("project.untitled"),
          category: categoryOf(project),
          color: caseColor(project.projectColor)?.hex || data.value.colors[id] || SITE_GREEN,
          logo: logoOf(project),
          ...(hoverImage ? { hoverImage } : {}),
          to: localePath({ path: `/projects/${project.slug?.trim() || id}` }),
        };
      })
      .filter((project): project is ProjectWallItem => project !== null)
  );

  const projects = computed<ProjectWallItem[]>(() => [...stories.value, ...cmsProjects.value]);

  return { projects };
};
