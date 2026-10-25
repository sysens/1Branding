<script setup lang="ts">
import { ref, computed } from "vue";

const root = ref<HTMLElement | null>(null);

useGsapContext(root, ({ gsap, ScrollTrigger }) => {
    const el = root.value!;

    const heading = el.querySelector<HTMLElement>(".team-heading");
    const text = el.querySelector<HTMLElement>(".team-text");

    const imgLeft = el.querySelector<HTMLElement>(".img-left");
    const imgCenter = el.querySelector<HTMLElement>(".img-center");
    const imgRight = el.querySelector<HTMLElement>(".img-right");

    if (heading) {
      gsap.set(heading, { y: 24, opacity: 0 });
    }

    if (text) {
      gsap.set(text, { y: 24, opacity: 0 });
    }

    if (imgLeft) {
      gsap.set(imgLeft, { x: -160, opacity: 0 });
    }

    if (imgCenter) {
      gsap.set(imgCenter, { y: 160, opacity: 0, scale: 0.94 });
    }

    if (imgRight) {
      gsap.set(imgRight, { x: 160, opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        if (heading) {
          tl.to(
            heading,
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
            },
            0
          );
        }

        if (text) {
          tl.to(
            text,
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
            },
            0.08
          );
        }

        if (imgLeft) {
          tl.to(
            imgLeft,
            {
              x: 0,
              opacity: 1,
              duration: 0.85,
            },
            0.16
          );
        }

        if (imgCenter) {
          tl.to(
            imgCenter,
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.9,
            },
            0.24
          );
        }

        if (imgRight) {
          tl.to(
            imgRight,
            {
              x: 0,
              opacity: 1,
              duration: 0.85,
            },
            0.32
          );
        }
      },
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });
  }, { scrollTrigger: true, whenVisible: { threshold: 0.15 } });

const { aboutPage } = await useAboutPage();

const section3 = computed(() => aboutPage.value?.section3 ?? null);
// More than about two lines of running text reads better left-aligned.
const subTitleIsLong = computed(() => (section3.value?.subTitle ?? "").trim().length > 180);

const resolveImage = useCmsMedia();

const section3Images = computed(() =>
  (section3.value?.creatorsImages ?? [])
    .map((img) => ({ src: resolveImage(img.url), alt: img.alternativeText?.trim() || section3.value?.title || "" }))
    .filter((img) => Boolean(img.src))
);

const lastThree = computed(() => {
  const last = section3Images.value.slice(-3);
  return {
    left: last[0],
    center: last[1],
    right: last[2],
  };
});
</script>

<template>
  <div ref="root">
    <div class="md:pt-[8.125rem] pt-[5rem] md:pb-[3.75rem]">
      <div v-if="section3" class="containerr">
        <div>
          <h2
            class="team-heading type-h2 text-[#FFFFFF] text-center"
          >
            {{ section3.title }}
          </h2>

          <!-- CMS copy: one or two lines stay centred, a longer text is
               left-aligned at a reading measure (the block stays centred). -->
          <p
            class="team-text type-lead type-measure mx-auto text-[#FFFFFFCC]/80 pt-[1.25rem] pb-[3.75rem]"
            :class="subTitleIsLong ? 'text-left' : 'text-center'"
          >
            {{ section3.subTitle }}
          </p>

          <!-- Three pictures below the first screen: loaded when near, each at
               a third of the row from md up. -->
          <div class="md:h-[33.1875rem] h-full md:flex block gap-[0.625rem]">
            <div class="flex-1 h-full">
              <NuxtImg
                v-if="lastThree.left"
                :src="lastThree.left.src"
                :alt="lastThree.left.alt"
                sizes="xs:100vw sm:100vw md:33vw lg:470px"
                loading="lazy"
                decoding="async"
                class="img-left w-full md:h-full h-[18.75rem] object-cover pb-[0.625rem] md:pb-0 block md:rounded-l-[1.875rem] rounded-t-[1.25rem] md:rounded-t-[0px] md:rounded-tl-[1.25rem] will-change-transform"
              />
            </div>

            <div class="flex-1 h-full">
              <NuxtImg
                v-if="lastThree.center"
                :src="lastThree.center.src"
                :alt="lastThree.center.alt"
                sizes="xs:100vw sm:100vw md:33vw lg:470px"
                loading="lazy"
                decoding="async"
                class="img-center w-full md:h-full h-[18.75rem] pb-[0.625rem] md:pb-0 object-cover block will-change-transform"
              />
            </div>

            <div class="flex-1 h-full">
              <NuxtImg
                v-if="lastThree.right"
                :src="lastThree.right.src"
                :alt="lastThree.right.alt"
                sizes="xs:100vw sm:100vw md:33vw lg:470px"
                loading="lazy"
                decoding="async"
                class="img-right w-full md:h-full h-[18.75rem] object-cover block md:rounded-r-[1.875rem] rounded-b-[1.25rem] md:rounded-b-[0px] md:rounded-br-[1.25rem] will-change-transform"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
