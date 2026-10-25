import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref,
} from "vue";

type ElementRef = Readonly<Ref<HTMLElement | null>>;

const decodeImage = async (image: HTMLImageElement) => {
  if (image.naturalWidth === 0) return;

  try {
    await image.decode();
  } catch {
    // A completed image can still reject decode() in some WebKit versions.
  }
};

const waitForImageLoad = (image: HTMLImageElement): Promise<void> => {
  if (image.complete) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;

      settled = true;
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      resolve();
    };

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
  });
};

const waitForDecodeBatch = (
  images: HTMLImageElement[],
  timeoutMs: number
): Promise<void> =>
  new Promise<void>((resolve) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;

      settled = true;
      resolve();
    }, timeoutMs);

    void Promise.all(images.map(decodeImage)).then(() => {
      if (settled) return;

      settled = true;
      clearTimeout(timeoutId);
      resolve();
    });
  });

/**
 * A row of pictures that appears all at once: nothing is requested until the
 * row is about a screen away (`load`; the component renders its <img>s only
 * then, so they do not compete with the page's first screen), and the row is
 * revealed once they are in and it is in view.
 */
export const useImageBatchReveal = (
  root: ElementRef,
  imageSelector = "img"
) => {
  const load = ref(false);
  const imagesReady = ref(false);
  const hasEnteredViewport = ref(false);
  const isRevealed = computed(
    () => imagesReady.value && hasEnteredViewport.value
  );

  const observers: IntersectionObserver[] = [];
  let mounted = false;

  const waitForImages = async (element: HTMLElement) => {
    await nextTick();
    const images = Array.from(
      element.querySelectorAll<HTMLImageElement>(imageSelector)
    ).filter((image) => image instanceof HTMLImageElement);
    const uniqueImages = Array.from(
      new Map(
        images.map((image) => [image.currentSrc || image.src, image] as const)
      ).values()
    );

    await Promise.all(uniqueImages.map(waitForImageLoad));
    await waitForDecodeBatch(uniqueImages, 1_500);

    if (mounted) imagesReady.value = true;
  };

  // Calls `onEnter` once the element is within `margin` of the viewport.
  const whenNear = (element: HTMLElement, margin: string, onEnter: () => void) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        onEnter();
      },
      { threshold: 0, rootMargin: margin }
    );
    observer.observe(element);
    observers.push(observer);
  };

  onMounted(() => {
    mounted = true;

    const element = root.value;

    if (!element) {
      load.value = true;
      imagesReady.value = true;
      hasEnteredViewport.value = true;
      return;
    }

    whenNear(element, "100% 0px 100% 0px", () => {
      load.value = true;
      void waitForImages(element);
    });
    whenNear(element, "200px 0px 200px 0px", () => {
      hasEnteredViewport.value = true;
    });
  });

  onBeforeUnmount(() => {
    mounted = false;
    for (const observer of observers) observer.disconnect();
    observers.length = 0;
  });

  return {
    isRevealed,
    load,
  };
};
