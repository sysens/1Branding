<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";

const root = ref<HTMLElement | null>(null);
let ctx: any = null;

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

const projects = computed(() => allProjects.value.slice(0, visibleCount.value));

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
const linkTo = (id: string) => localePath(`/ProjectSlug/${id}`);

const runGsap = async () => {
  if (!process.client) return;

  await nextTick();

  const { gsap } = await import("gsap");

  ctx?.revert();
  ctx = null;

  ctx = gsap.context(() => {
    const el = root.value;
    if (!el) return;

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
};

onMounted(async () => {
  await runGsap();
});

watch(
  () => projects.value.length,
  async () => {
    await runGsap();
  }
);

onBeforeUnmount(() => {
  ctx?.revert();
  ctx = null;
});
</script>

<template>
  <div ref="root">
    <div class="products bg-transparent grid md:grid-cols-3 grid-cols-2 gap-2">
      <NuxtLink
        v-for="(item, i) in projects"
        :key="item.documentId + i"
        :to="linkTo(item.documentId)"
        class="group relative w-full block"
      >
        <NuxtImg
          :src="firstImage(item)"
          :alt="safeTitle(item)"
          class="w-full md:h-full h-[120px] block object-cover md:rounded-[20px] rounded-[10px]"
        />

        <div class="text-white px-[24px] absolute bottom-[12%]">
          <p
            class="font-light md:text-[16px] md:leading-[31.29px] md:tracking-[0] text-[#E3E3E3] text-[13px] leading-[22.93px] tracking-normal font-['Inter'] transition-all duration-300 opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0"
          >
            {{ yearOnly(item.createdAt) }}
          </p>

          <h2
            class="font-['Inter'] font-medium md:text-[40px] line-clamp-1 md:leading-[31.29px] md:tracking-[0] text-[20px] leading-[22.93px] tracking-normal transition-all duration-300 opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0"
          >
            {{ safeTitle(item) }}
          </h2>
        </div>
      </NuxtLink>
    </div>

    <div class="flex items-center justify-center mt-[90px]">
      <button
        v-if="hasMore"
        class="showMore rounded-full bg-black text-white border-2 w-[280px] h-[60px] text-center border-[#03CB00] shadow-[0_0_20px_rgba(3,203,0,0.6)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(3,203,0,0.9)] hover:scale-105 font-['Poppins','Inter',sans-serif]"
        @click="showMore"
      >
        {{ $t("common.showMore") }}
      </button>
    </div>
  </div>
</template>
