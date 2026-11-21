// The CMS projects' logos for the corner of their card on /projects, by the
// project's slug: cut from each project's cover board and set in the
// project's colour on transparent (public/case-study/logos/, 120px tall).
// A logo uploaded to the project in the CMS (projectLogo) comes first; a
// project with neither shows its initial.

export type ProjectLogo = { src: string; width: number; height: number };

const logo = (file: string, width: number): ProjectLogo => ({ src: `/case-study/logos/${file}.webp`, width, height: 120 });

export const PROJECT_LOGOS: Readonly<Record<string, ProjectLogo>> = {
  "poyqadam-brand-identity": logo("poyqadam", 407),
  "raviosta-restaurant-identity": logo("raviosta", 126),
  "rush-coffee-logo": logo("rush", 173),
  "street-vibe-tuning-logo": logo("street-vibe", 274),
  "grechno-brand-identity": logo("grechno", 426),
};
