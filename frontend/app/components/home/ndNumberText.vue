<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BlurText from "~/components/ui/BlurText.vue";
import { usePinnedStory } from "~/composables/usePinnedStory";
import { useViewportActivity } from "~/composables/useViewportActivity";
import type { LandingSection5Item } from "~/types/landingPayload";

const props = defineProps<{ section?: Array<LandingSection5Item | null> | null }>();
const panels = computed(() =>
  (props.section ?? []).filter((item): item is LandingSection5Item =>
    item !== null && Boolean(item.title?.trim() || item.subTitle?.trim())
  ).map((item) => ({
    title: item.title?.trim() ?? "",
    description: item.subTitle?.trim() ?? "",
  }))
);
const root = ref<HTMLElement | null>(null);
const video = ref<HTMLVideoElement | null>(null);
const { activeIndex, direction } = usePinnedStory(root, () => panels.value.length);
const activePanel = computed(() => panels.value[activeIndex.value]);
const { targetRef, isActive } = useViewportActivity({ rootMargin: "200px 0px" });
watch(isActive, (active) => {
  if (!video.value) return;
  if (active) void video.value.play().catch(() => undefined);
  else video.value.pause();
});
</script>

<template>
  <section ref="root" class="number-story">
    <div ref="targetRef" class="number-story__stage">
      <div class="number-story__media">
        <video
          ref="video"
          class="electric-one-number"
          loop muted playsinline preload="metadata" aria-hidden="true"
        >
          <source src="/home/1Number.mp4" type="video/mp4" />
        </video>
      </div>
      <div class="number-story__copy" :style="{ '--story-direction': direction }">
        <Transition name="story-copy">
          <div v-if="activePanel" :key="activeIndex" class="number-story__panel">
            <BlurText
              :text="activePanel.title"
              :delay="30"
              :step-duration="0.2"
              :animation-from="{ filter: 'blur(8px)', opacity: 0, y: direction * 14 }"
              :animation-to="[{ filter: 'blur(0px)', opacity: 1, y: 0 }]"
              animate-by="words"
              tag="h2"
              class="nd-gooey-title"
            />
            <BlurText
              :text="activePanel.description"
              :delay="4"
              :step-duration="0.24"
              :animation-from="{ filter: 'blur(6px)', opacity: 0, y: direction * 10 }"
              :animation-to="[{ filter: 'blur(0px)', opacity: 1, y: 0 }]"
              animate-by="words"
              tag="p"
              class="nd-gooey-description"
            />
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>

<style scoped src="./ndNumberText.css"></style>
