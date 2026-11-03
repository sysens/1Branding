import type { CaseCopy } from "~/utils/caseStudy";

// The statement block's illustration where the CMS has none: the brand's
// mark wired to logo, colour, type, imagery and voice.
const STATEMENT_IMAGE = { src: "/case-study/brand-system.webp", width: 563, height: 446 };

/** The site's own copy for the case-study sections (buildCaseSections). */
export const useCaseCopy = () => {
  const { t } = useI18n();
  return computed<CaseCopy>(() => ({
    palette: t("project.palette"),
    statement: {
      statement: t("project.statement.statement"),
      title: t("project.statement.title"),
      text: t("project.statement.text"),
      alt: t("project.statement.alt"),
      image: STATEMENT_IMAGE,
    },
  }));
};
