<script setup lang="ts">
import { ref, computed, watch } from "vue";

const root = ref<HTMLElement | null>(null);

type Media = { url: string | null };

type ProjectNode = {
  documentId: string;
  createdAt: string;
  section1: {
    projectTitle: string;
    images: Media[] | null;
  } | null;
};

type Props = {
  projects?: ProjectNode[] | null;
};

const props = withDefaults(defineProps<Props>(), {
  projects: null,
});

const resolveMedia = useCmsMedia();

const allProjects = computed(() => {
  const nodes = props.projects ?? [];
  return nodes.filter((n) => n?.documentId);
});

const pageSize = 18;
const visibleCount = ref(pageSize);

watch(
  allProjects,
  () => {
    visibleCount.value = pageSize;
  },
  { immediate: true }
);

const visibleProjects = computed(() => allProjects.value.slice(0, visibleCount.value));

const hasMore = computed(() => visibleCount.value < allProjects.value.length);

const showMore = () => {
  visibleCount.value = Math.min(visibleCount.value + pageSize, allProjects.value.length);
};

const yearOnly = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  return Number.isFinite(y) ? String(y) : "";
};

const firstImage = (item: ProjectNode) => {
  const img = item.section1?.images?.[0]?.url ?? "";
  return resolveMedia(img);
};

const safeTitle = (item: ProjectNode) => (item.section1?.projectTitle ?? "").toString();

const localePath = useLocalePath();
const linkTo = (id: string) => localePath(`/projects/${id}`);

// The list and the button slide in; again whenever more projects are shown.
const { refresh } = useGsapContext(root, ({ gsap, el }) => {
  const productsEl = el.querySelector<HTMLElement>(".products");
  const btn = el.querySelector<HTMLElement>(".showMore");

  if (productsEl) {
    gsap.fromTo(
      productsEl,
      { x: -160, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, delay: 1, ease: "power3.out" }
    );
  }

  if (btn) {
    gsap.fromTo(
      btn,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, delay: 1.2, ease: "power3.out" }
    );
  }
});

watch(
  () => visibleProjects.value.length,
  () => {
    void refresh();
  }
);
</script>

<template>
  <div ref="root">
    <div class="products bg-transparent grid md:grid-cols-3 grid-cols-2 gap-2">
      <NuxtLink
        v-for="(item, i) in visibleProjects"
        :key="item.documentId + i"
        :to="linkTo(item.documentId)"
        class="group relative w-full block"
      >
        <NuxtImg
          :src="firstImage(item)"
          :alt="safeTitle(item)"
          class="w-full md:h-full h-[7.5rem] block object-cover md:rounded-[1.25rem] rounded-[0.625rem]"
        />

        <div class="text-white px-[1.5rem] absolute bottom-[12%]">
          <p
            class="type-small text-[#E3E3E3] transition-all duration-300 opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0"
          >
            {{ yearOnly(item.createdAt) }}
          </p>

          <h2
            class="type-h3 line-clamp-1 transition-all duration-300 opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0"
          >
            {{ safeTitle(item) }}
          </h2>
        </div>
      </NuxtLink>
    </div>

    <div class="flex items-center justify-center mt-[5.625rem]">
      <button
        v-if="hasMore"
        class="showMore ob-button"
        @click="showMore"
      >
        {{ $t("common.showMore") }}
      </button>
    </div>
  </div>
</template>
