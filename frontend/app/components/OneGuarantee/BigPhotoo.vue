<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";

type AppLocale = "ru" | "en";

const root = ref<HTMLElement | null>(null);
const localePath = useLocalePath();
const router = useRouter();

let observer: IntersectionObserver | null = null;
let ctx: any = null;
let inited = false;

const initGsap = async () => {
  if (inited || !root.value) return;
  inited = true;

  await nextTick();

  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  ctx = gsap.context(() => {
    const el = root.value!;

    const imgWrap = el.querySelector<HTMLElement>(".cta-img");
    const title = el.querySelector<HTMLElement>(".cta-title");
    const text = el.querySelector<HTMLElement>(".cta-text");
    const btnWrap = el.querySelector<HTMLElement>(".cta-btn");

    const prepare = (node: HTMLElement | null, from: { x?: number; y?: number }) => {
      if (!node) return;
      gsap.set(node, { ...from, opacity: 0 });
    };

    prepare(imgWrap, { x: 360 });
    prepare(title, { x: -360 });
    prepare(text, { x: -160 });

    if (btnWrap) {
      gsap.set(btnWrap, { y: 40, opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        if (imgWrap) {
          tl.to(
            imgWrap,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.85,
            },
            0
          );
        }

        if (title) {
          tl.to(
            title,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.75,
            },
            0.1
          );
        }

        if (text) {
          tl.to(
            text,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.75,
            },
            0.18
          );
        }

        if (btnWrap) {
          tl.to(
            btnWrap,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.65,
            },
            0.28
          );
        }
      },
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });
  }, root.value);
};

onMounted(() => {
  if (!root.value) return;

  const rect = root.value.getBoundingClientRect();
  const inViewNow = rect.top < window.innerHeight && rect.bottom > 0;
  if (inViewNow) initGsap();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) initGsap();
    },
    { threshold: 0.01, rootMargin: "200px 0px 200px 0px" }
  );

  observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;

  ctx?.revert();
  ctx = null;
  inited = false;
});

const { locale } = useI18n();
type Section6 = {
  title: string;
  text: string;
  buttonText: string;
  buttonUrl: string;
};

const { own: guarantee, fallback: fallbackGuarantee } = await useOneGuaranteePage();

const section6 = computed(
  () =>
    guarantee.value?.section6 ??
    fallbackGuarantee.value?.section6 ?? {
      title: "",
      text: "",
      buttonText: "",
      buttonUrl: "",
    }
);

const buttonText = computed(() => section6.value.buttonText || "");
const buttonUrl = computed(() => section6.value.buttonUrl || "");

const isModifiedEvent = (event: MouseEvent) => {
  return !!(
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
};

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);
// A CMS value that is neither http(s) nor a site path (e.g. "javascript:") is ignored.
const isSitePath = (url: string) => url.startsWith("/") && !url.startsWith("//");

const onCtaClick = async (event: MouseEvent) => {
  if (!process.client) return;
  if (isModifiedEvent(event)) return;

  const target = buttonUrl.value?.trim();

  if (!target) {
    event.preventDefault();
    return;
  }

  if (isExternalUrl(target)) return;

  event.preventDefault();
  event.stopPropagation();
  if (!isSitePath(target)) return;

  const localizedTarget = localePath(target);

  try {
    await navigateTo(localizedTarget);
    return;
  } catch {
    try {
      await router.push(localizedTarget);
      return;
    } catch {
      window.location.href = localizedTarget;
    }
  }
};
</script>

<template>
  <div ref="root" class="flex justify-center md:px-0">
    <div class="max-w-[685px] mx-auto">
      <div class="flex justify-center mb-[48px] items-center">
        <img
          class="cta-img will-change-transform"
          src="/OneGuarantee/image 84.png"
          alt=""
        />
      </div>

      <div>
        <h2
          class="cta-title will-change-transform font-normal text-[#FFFFFF] md:text-[62px] text-[40px] leading-[120%] tracking-normal text-center"
        >
          {{ section6.title }}
        </h2>

        <p
          class="cta-text will-change-transform font-light text-[#FFFFFF] text-[20px] leading-[120%] py-[45px] tracking-normal text-center font-['Poppins','Inter',sans-serif]"
        >
          {{ section6.text }}
        </p>

        <div class="flex justify-center">
          <NuxtLink
            :to="isExternalUrl(buttonUrl) ? buttonUrl : localePath(isSitePath(buttonUrl) ? buttonUrl : '/')"
            :external="isExternalUrl(buttonUrl)"
            class="cta-btn inline-flex items-center justify-center text-white bg-[url('/home/Component3.png')] bg-no-repeat w-[260px] h-[60px] rounded-[32px] bg-[length:120%] bg-[position:100%_50%] transition-all duration-1000 ease-[cubic-bezier(.4,0,.2,1)] hover:bg-[length:140%] hover:bg-[position:0%_50%] hover:shadow-[0_0_30px_rgba(3,203,0,0.9)] text-[16px] font-['Inter']"
            @click="onCtaClick"
          >
            {{ buttonText }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
