import { computed, type ComputedRef } from "vue";

type ProjectMedia = {
  url?: string | null;
};

type ProjectNode = {
  documentId?: string | null;
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
  };
  errors?: Array<{ message: string }>;
};

export type ProjectWallItem = {
  id: string;
  image: string;
  title: string;
  to: string;
};

type ProjectsWallData = {
  projects: ComputedRef<ProjectWallItem[]>;
};

const PROJECTS_WALL_QUERY = `
  query ProjectsWall($locale: I18NLocaleCode) {
    projectsPages_connection(
      pagination: { page: 1, pageSize: 100 }
      sort: "createdAt:asc"
      locale: $locale
    ) {
      nodes {
        documentId
        section1 {
          projectTitle
          images { url }
        }
      }
    }
  }
`;

export const useProjectsWallData = async (): Promise<ProjectsWallData> => {
  const graphqlUrl = useGraphqlUrl();
  const cmsMedia = useCmsMedia();
  const localePath = useLocalePath();
  const gqlLocale = useCmsLocale();

  const fetchProjects = async (
    localeValue: CmsLocale
  ): Promise<ProjectNode[]> => {
    if (!graphqlUrl) return [];

    const response = await cmsRequest<NonNullable<ProjectsWallResponse["data"]>>(graphqlUrl, PROJECTS_WALL_QUERY, { locale: localeValue });

    if (response?.errors?.length && !response.data?.projectsPages_connection) {
      throw new Error(response.errors.map((error) => error.message).join("; "));
    }

    return (response?.data?.projectsPages_connection?.nodes ?? []).filter(
      (node): node is ProjectNode => node !== null
    );
  };

  const { data } = await useAsyncData<ProjectNode[]>(
    () => `projects-wall-${gqlLocale.value}`,
    async () => {
      const localized = await fetchProjects(gqlLocale.value);
      if (localized.length || gqlLocale.value === "en") return localized;
      return fetchProjects("en");
    },
    {
      default: () => [],
    }
  );

  const projects = computed<ProjectWallItem[]>(() =>
    data.value
      .map((project) => {
        const id = project.documentId?.trim() || "";
        const image = cmsMedia(project.section1?.images?.[0]?.url);

        if (!id || !image) return null;

        return {
          id,
          image,
          title: project.section1?.projectTitle?.trim() || "Project",
          to: localePath({ path: `/projects/${id}` }),
        };
      })
      .filter((project): project is ProjectWallItem => project !== null)
  );

  return { projects };
};
