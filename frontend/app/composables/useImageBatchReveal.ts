import {
  computed,
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

export const useImageBatchReveal = (
  root: ElementRef,
  imageSelector = "img"
) => {
  const imagesReady = ref(false);
  const hasEnteredViewport = ref(false);
  const isRevealed = computed(
    () => imagesReady.value && hasEnteredViewport.value
  );

  let observer: IntersectionObserver | null = null;
  let mounted = false;

  onMounted(async () => {
    mounted = true;

    const element = root.value;

    if (!element) {
      imagesReady.value = true;
      hasEnteredViewport.value = true;
      return;
    }

    const rect = element.getBoundingClientRect();
    hasEnteredViewport.value =
      rect.top < window.innerHeight + 200 && rect.bottom > -200;

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        hasEnteredViewport.value = true;
        observer?.disconnect();
        observer = null;
      },
      {
        threshold: 0.01,
        rootMargin: "200px 0px 200px 0px",
      }
    );
    observer.observe(element);

    const images = Array.from(
      element.querySelectorAll<HTMLImageElement>(imageSelector)
    );
    const uniqueImages = Array.from(
      new Map(
        images.map((image) => [image.currentSrc || image.src, image] as const)
      ).values()
    );

    await Promise.all(uniqueImages.map(waitForImageLoad));
    await waitForDecodeBatch(uniqueImages, 1_500);

    if (mounted) imagesReady.value = true;
  });

  onBeforeUnmount(() => {
    mounted = false;
    observer?.disconnect();
    observer = null;
  });

  return {
    isRevealed,
  };
};
