import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

interface HomeLenis {
  scrollTo: (target: Element, options: { offset: number; duration: number; immediate: boolean; lock: boolean }) => void;
}

export function useHomePageReady() {
  const route = useRoute();
  const nuxtApp = useNuxtApp() as ReturnType<typeof useNuxtApp> & { $lenis?: HomeLenis };
  const loading = ref(true);
  let disposed = false;
  let hashScrollDone = false;
  let frame = 0;

  const scrollToHash = async () => {
    if (!import.meta.client || !route.hash) return;
    await nextTick();
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (disposed) return;
        const element = document.getElementById(route.hash.slice(1));
        if (!element) return;
        if (nuxtApp.$lenis?.scrollTo) {
          nuxtApp.$lenis.scrollTo(element, { offset: -120, duration: 1, immediate: false, lock: false });
        } else {
          window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 120, behavior: "auto" });
        }
      });
    });
  };
  watch(() => route.hash, async (hash, previous) => {
    if (!hash || hash === previous) return;
    await scrollToHash();
    hashScrollDone = true;
  });
  onMounted(async () => {
    await nextTick();
    if (disposed) return;
    loading.value = false;
    if (route.hash && !hashScrollDone) { await scrollToHash(); hashScrollDone = true; }
  });
  onBeforeUnmount(() => {
    disposed = true;
    cancelAnimationFrame(frame);
  });
  return { loading };
}
