// PROTOTYPES (branch prototip/2500-one). Each flag switches one experiment on
// or off; false brings back the page exactly as it was. Any page also accepts
// ?prototip=off to show everything as before, for side-by-side comparison.
import { computed } from "vue";

export const ONE_PROTOTYPES = {
  /** Home hero: client logos assemble into "ONE" (components/home/HeroOneAssembly.vue). */
  hero: true,
  /**
   * /services/branding: before/after glass lens (components/prototype/OneLens.vue).
   * Off, and not wired: it was made for the old Branding service page, which is
   * the white showcase (ProjectsShowcase) now.
   */
  lens: false,
  /** /services/packaging-design: 3D packaging lab (components/prototype/OnePackLab.vue). */
  packLab: true,
  /** /contact: the ONE mark as a 3D guide (components/prototype/OneMascot.vue). */
  mascot: true,
  /**
   * /projects: 3D showroom of the case studies (components/prototype/OneShowroom.vue).
   * Off, and not wired: it was made for the old project wall (InfiniteProjectsWall),
   * which the page has since replaced with the film and the grid (ProjectsStage).
   */
  showroom: false,
  /**
   * /projects: the project wall as a drifting dome lens (components/prototype/OneDomeWall.vue).
   * Off, and not wired, for the same reason.
   */
  domeWall: false,
} as const;

export type OnePrototype = keyof typeof ONE_PROTOTYPES;

/** Whether a prototype is on for the current request (flag on and no ?prototip=off). */
export const usePrototype = (name: OnePrototype) => {
  const route = useRoute();
  return computed(() => ONE_PROTOTYPES[name] && route.query.prototip !== "off");
};
