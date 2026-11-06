/**
 * The landing's lazily hydrated sections (hydrate-on-visible): until a section's
 * script has run it shows its server state, which for the scroll-driven ones is
 * their first state. After a reload, plugins/lenis.client.ts keeps the page
 * hidden until the sections on screen have drawn themselves for the restored
 * position. Each one is marked in pages/index.vue with lazySection(key): the
 * key goes on its root element (data-lazy-section) and its `hydrated` event
 * records it here.
 */
const hydrated = new Set<string>();

export const lazySection = (key: string) => ({
  "data-lazy-section": key,
  onHydrated: () => { hydrated.add(key); },
});

/** How many marked sections on screen have not hydrated yet. */
export const pendingLazySectionsOnScreen = (): number => {
  let pending = 0;
  for (const element of document.querySelectorAll<HTMLElement>("[data-lazy-section]")) {
    if (hydrated.has(element.dataset.lazySection ?? "")) continue;
    const box = element.getBoundingClientRect();
    if (box.height > 0 && box.bottom > 0 && box.top < window.innerHeight) pending++;
  }
  return pending;
};
