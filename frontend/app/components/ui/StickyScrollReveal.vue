<script setup lang="ts">
import { ref, useId } from "vue";
import type { StickyScrollItem } from "~/types/stickyScroll";
import { useStickyScrollReveal } from "~/composables/useStickyScrollReveal";

defineProps<{ content: readonly StickyScrollItem[]; contentClassName?: string; ariaLabel?: string }>();
const root = ref<HTMLElement | null>(null);
const instanceId = useId();
const { active } = useStickyScrollReveal(root);
</script>

<template>
  <section v-if="content.length" ref="root" class="sticky-reveal" :data-active="active" :style="{ background: content[active]?.background }" :aria-label="ariaLabel ?? 'Brand stories'">
    <div class="sticky-reveal__backgrounds" aria-hidden="true">
      <div class="sticky-reveal__background-pin">
        <div
          v-for="(item, index) in content" :key="item.id"
          class="sticky-reveal__background" :class="{ 'is-active': active === index }"
          :style="{ background: item.background }"
        />
      </div>
    </div>
    <div class="sticky-reveal__layout" :class="contentClassName">
      <div class="sticky-reveal__media-column" aria-hidden="true">
        <div class="sticky-reveal__media-pin">
          <div v-for="(item, index) in content" :key="item.id" class="sticky-reveal__media" :class="{ 'is-active': active === index }">
            <slot name="media" :item="item" :index="index" :active="active === index">
              <img :src="item.image.src" alt="" :width="item.image.width" :height="item.image.height" :class="`sticky-reveal__image--${item.image.variant}`" decoding="async" loading="lazy" >
            </slot>
          </div>
        </div>
      </div>
      <div class="sticky-reveal__panels">
        <article
          v-for="(item, index) in content" :key="item.id" data-sticky-panel
          class="sticky-reveal__panel" :class="{ 'is-active': active === index }"
          :style="{ color: item.foreground }" :aria-labelledby="`${instanceId}-${item.id}`"
        >
          <img class="sticky-reveal__mobile-image" :class="`sticky-reveal__image--${item.image.variant}`" :src="item.image.src" :alt="item.image.alt" :width="item.image.width" :height="item.image.height" loading="lazy" decoding="async" >
          <div class="sticky-reveal__copy">
            <h2 :id="`${instanceId}-${item.id}`">{{ item.title }}</h2>
            <p>{{ item.description }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped src="./StickyScrollReveal.css" />
