<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import StickyScrollReveal from "~/components/ui/StickyScrollReveal.vue";
import type { StickyScrollItem } from "~/types/stickyScroll";

const { t, te } = useI18n();

type StoryVisual = Pick<StickyScrollItem, "id" | "foreground" | "background" | "image">;

const STORY_VISUALS: readonly StoryVisual[] = [
  {
    id: "apex-pizza",
    foreground: "#563000",
    background: "linear-gradient(180deg, #ffff25, transparent 28%), radial-gradient(ellipse at 90% 0%, #ffff00 42%, #ffb500 95%)",
    image: { src: "/home/stories/apex-pizza.svg", alt: "Apex Pizza brand identity", width: 375, height: 185, variant: "logo" },
  },
  {
    id: "perfect-candy",
    foreground: "#ffffff",
    background: "radial-gradient(ellipse at 95% 15%, #f000dc 8%, #b800a5 50%, #52002d 100%)",
    image: { src: "/logoss/perfectCandy2.webp", alt: "Perfect Candy identity with purple packaging and chocolate hearts", width: 1710, height: 962, variant: "artwork" },
  },
  {
    id: "green-go",
    foreground: "#ffffff",
    background: "radial-gradient(ellipse at 25% 0%, #13bc3c 5%, #099329 60%, #056a1e 100%)",
    image: { src: "/logoss/GreenGo.webp", alt: "GreenGo electric mobility brand identity", width: 1710, height: 962, variant: "artwork" },
  },
];

const FALLBACK_COPY = [
  {
    title: "More than pizza\nThis is Apex.",
    description: "Apexpizza is built around one clear idea: bold taste, generous toppings and a strong identity. Every detail works as one system, from product to packaging, from experience to recognition.",
  },
  {
    title: "Small candy.\nBig feeling.",
    description: "Perfect Candy turns a little treat into a memorable moment. Expressive colors, distinctive packaging and a playful identity bring the same feeling to every part of the brand.",
  },
  {
    title: "A fresh direction.\nThis is GreenGo.",
    description: "GreenGo brings energy to everyday movement. A clear visual language, confident typography and a vivid green palette make the brand instantly recognizable, wherever the journey leads.",
  },
] as const;

const stories = computed<readonly StickyScrollItem[]>(() => {
  return STORY_VISUALS.map((visual, index) => {
    const fallback = FALLBACK_COPY[index] ?? FALLBACK_COPY[0];
    const titleKey = `home.brandStories.stories.${index}.title`;
    const descriptionKey = `home.brandStories.stories.${index}.description`;
    return {
      ...visual,
      title: te(titleKey) ? t(titleKey) : fallback.title,
      description: te(descriptionKey) ? t(descriptionKey) : fallback.description,
    };
  });
});

const ariaLabel = computed(() => {
  const label = t("home.brandStories.ariaLabel");
  return typeof label === "string" && label ? label : "Brand stories";
});
</script>

<template>
  <StickyScrollReveal id="brand-stories" :content="stories" :aria-label="ariaLabel" />
</template>
