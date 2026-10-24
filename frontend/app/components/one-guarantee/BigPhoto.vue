<script setup lang="ts">
import { ref, computed } from "vue";

const root = ref<HTMLElement | null>(null);
const localePath = useLocalePath();
const router = useRouter();

useGsapContext(root, ({ gsap, ScrollTrigger }) => {
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
  }, { scrollTrigger: true, whenVisible: { threshold: 0.01, rootMargin: "200px 0px 200px 0px" } });

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
  if (!import.meta.client) return;
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
          src="/OneGuarantee/image-84.png"
          alt=""
        >
      </div>

      <div>
        <h2
          class="cta-title will-change-transform type-h2 text-[#FFFFFF] text-center"
        >
          {{ section6.title }}
        </h2>

        <p
          class="cta-text will-change-transform type-lead text-[#FFFFFF] py-[45px] text-center"
        >
          {{ section6.text }}
        </p>

        <div class="flex justify-center">
          <NuxtLink
            :to="isExternalUrl(buttonUrl) ? buttonUrl : localePath(isSitePath(buttonUrl) ? buttonUrl : '/')"
            :external="isExternalUrl(buttonUrl)"
            class="cta-btn ob-button"
            @click="onCtaClick"
          >
            {{ buttonText }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
