<script setup lang="ts">
import { ref, computed } from "vue";

const root = ref<HTMLElement | null>(null);

useGsapContext(root, ({ gsap, ScrollTrigger }) => {
    const el = root.value!;
    const blocks = Array.from(el.querySelectorAll<HTMLElement>(".mission-block"));

    blocks.forEach((block, idx) => {
      const text = block.querySelector<HTMLElement>(".mission-text");
      const img = block.querySelector<HTMLElement>(".mission-img");

      const isEven = idx % 2 === 0;

      if (text) {
        gsap.set(text, {
          x: isEven ? -160 : 160,
          opacity: 0,
        });
      }

      if (img) {
        gsap.set(img, {
          x: isEven ? 160 : -160,
          opacity: 0,
        });
      }

      ScrollTrigger.create({
        trigger: block,
        start: "top 80%",
        once: true,
        onEnter: () => {
          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
          });

          if (text) {
            tl.to(
              text,
              {
                x: 0,
                opacity: 1,
                duration: 0.85,
              },
              0
            );
          }

          if (img) {
            tl.to(
              img,
              {
                x: 0,
                opacity: 1,
                duration: 0.9,
              },
              0.12
            );
          }
        },
      });
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });
  }, { scrollTrigger: true, whenVisible: { threshold: 0.01, rootMargin: "200px 0px 200px 0px" } });

const { aboutPage } = await useAboutPage();

const section2 = computed(() => aboutPage.value?.section2 ?? []);

const resolveImage = useCmsMedia();

const section2WithImages = computed(() =>
  section2.value.map((item) => ({
    ...item,
    imageSrc: resolveImage(item.image?.url),
  }))
);
</script>

<template>
  <div ref="root" class="section-root">
    <div class="mt-[11.875rem]">
      <div class="containerr bg-[#2A2A2A]/25 rounded-[1.875rem]">
        <div
          v-for="(item, i) in section2WithImages"
          :key="i"
          class="mission-block flex flex-col-reverse items-center md:p-10 py-5 md:gap-[5rem] gap-[1.875rem]"
          :class="i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'"
        >
          <div class="mission-text flex-1 will-change-transform">
            <h2
              class="type-h3 text-[#FFFFFF] md:pb-[3.75rem] pb-[1.875rem]"
            >
              {{ item.title }}
            </h2>
            <p
              class="type-body type-measure text-[#FFFFFF] pb-[5rem] md:pb-0"
            >
              {{ item.text }}
            </p>
          </div>

          <NuxtImg
            v-if="item.imageSrc"
            :src="item.imageSrc"
            :alt="item.image?.alternativeText?.trim() || item.title"
            class="mission-img flex-1 md:w-[50%] md:h-[31.25rem] h-[14.625rem] w-full rounded-[1.875rem] will-change-transform"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
