import { onBeforeUnmount, onMounted, ref } from "vue";

type ViewportActivityOptions = {
  rootMargin?: string;
  threshold?: number | number[];
};

export const useViewportActivity = (options: ViewportActivityOptions = {}) => {
  const targetRef = ref<HTMLElement | null>(null);
  const isActive = ref(false);
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    const target = targetRef.value;

    if (!target || typeof IntersectionObserver === "undefined") {
      isActive.value = true;
      return;
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        isActive.value = entry?.isIntersecting ?? false;
      },
      {
        rootMargin: options.rootMargin ?? "200px 0px",
        threshold: options.threshold ?? 0,
      }
    );
    observer.observe(target);
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
  });

  return {
    targetRef,
    isActive,
  };
};
