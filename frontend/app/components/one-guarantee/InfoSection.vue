<script setup lang="ts">
import { toSiteLocale } from "~/utils/locales";
import { ref, computed } from "vue";


const root = ref<HTMLElement | null>(null);

useGsapContext(root, ({ gsap, ScrollTrigger }) => {
    const el = root.value!;

    const title = el.querySelector<HTMLElement>(".og-title");
    const subtitle = el.querySelector<HTMLElement>(".og-subtitle");
    const box = el.querySelector<HTMLElement>(".og-box");
    const p1 = el.querySelector<HTMLElement>(".og-p1");
    const p2 = el.querySelector<HTMLElement>(".og-p2");
    const divider = el.querySelector<HTMLElement>(".og-divider");
    const last = el.querySelector<HTMLElement>(".og-last");

    const prepare = (node: HTMLElement | null, from: { x?: number; y?: number }) => {
      if (!node) return;
      gsap.set(node, { ...from, opacity: 0 });
    };

    prepare(title, { x: 260 });
    prepare(subtitle, { x: -260 });
    prepare(box, { x: 260 });
    prepare(p1, { x: -260 });
    prepare(p2, { x: 260 });
    prepare(divider, { x: -260 });
    prepare(last, { x: 260 });

    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        if (title) {
          tl.to(
            title,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.75,
            },
            0
          );
        }

        if (subtitle) {
          tl.to(
            subtitle,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.75,
            },
            0.08
          );
        }

        if (box) {
          tl.to(
            box,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.85,
            },
            0.16
          );
        }

        if (p1) {
          tl.to(
            p1,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.75,
            },
            0.24
          );
        }

        if (p2) {
          tl.to(
            p2,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.75,
            },
            0.32
          );
        }

        if (divider) {
          tl.to(
            divider,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.7,
            },
            0.4
          );
        }

        if (last) {
          tl.to(
            last,
            {
              x: 0,
              y: 0,
              opacity: 1,
              duration: 0.8,
            },
            0.48
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

const { t, locale } = useI18n();
const gqlLocale = computed(() => toSiteLocale(locale.value));

const { own: guarantee } = await useOneGuaranteePage();

const s2 = computed(() => guarantee.value?.section2 ?? null);

const s2Title = computed(() => s2.value?.title || t("oneGuarantee.section2.title"));
const s2Text1 = computed(() => s2.value?.text1 || t("oneGuarantee.section2.text1"));
const s2Text2 = computed(() => s2.value?.text2 || t("oneGuarantee.section2.text2"));
const s2Text3 = computed(() => s2.value?.text3 || t("oneGuarantee.section2.text3"));
const s2Text4 = computed(() => s2.value?.text4 || t("oneGuarantee.section2.text4"));
const s2Text5 = computed(() => s2.value?.text5 || t("oneGuarantee.section2.text5"));

const highlightedText = computed(() => {
  const text = s2Text1.value;
  const token = t("oneGuarantee.section2.highlightToken");
  const index = token ? text.toLocaleLowerCase(gqlLocale.value).indexOf(token.toLocaleLowerCase(gqlLocale.value)) : -1;
  return index < 0
    ? { before: text, highlight: "", after: "" }
    : {
        before: text.slice(0, index),
        highlight: text.slice(index, index + token.length),
        after: text.slice(index + token.length),
      };
});
</script>

<template>
  <div
    ref="root"
    class="relative flex justify-center md:px-[40px] px-[20px]"
  >
    <div
      class="pointer-events-none absolute top-0 left-0 w-full h-[80px] bg-gradient-to-b from-black/0 via-black/100 to-transparent"
    />

    <div class="max-w-[991px] mx-auto flex flex-col items-center text-center">
      <div>
        <!-- One brand word on the display step; <wbr> lets it break after
             "ONE" on the narrowest phones instead of running off the screen. -->
        <h2
          class="og-title will-change-transform type-display-s type-caps text-[#FFFFFF] text-center pt-20 pb-[38px]"
        >
          <span class="text-[#15FF00]">{{ $t("brand.one").toUpperCase() }}</span
          ><wbr>{{ s2Title.replace(/^ONE/i, "") }}
        </h2>

        <div class="mx-auto block">
          <p
            class="og-subtitle will-change-transform type-lead text-center text-[#FFFFFF] w-full max-w-[398px] pb-[110px] mx-auto"
          >
            {{ highlightedText.before }}<span v-if="highlightedText.highlight" class="text-[#15FF00]">{{ highlightedText.highlight }}</span>{{ highlightedText.after }}
          </p>
        </div>
      </div>

      <div
        class="og-box will-change-transform relative text-[#FFFFFF] text-center max-w-[751px] border border-[#00FF0D] rounded-[20px] md:px-[75px] md:py-[40px] px-[10px] py-[20px] mb-[80px] mx-auto"
      >
        <img
          src="/OneGuarantee/subway-tick-1.png"
          alt=""
          class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-[50px] h-auto bg-black px-2"
        >

        <!-- A short callout (about 160 characters): stays centred in its frame. -->
        <p class="type-lead type-measure mx-auto text-center">
          {{ s2Text2 }}
        </p>
      </div>

      <!-- Running text (180-210 characters each): left-aligned at a reading
           measure, the column itself centred. -->
      <div class="max-w-[801px]">
        <p
          class="og-p1 will-change-transform type-lead type-measure mx-auto text-left text-[#FFFFFF] pb-[32px]"
        >
          {{ s2Text3 }}
        </p>

        <p
          class="og-p2 will-change-transform type-lead type-measure mx-auto text-left text-[#FFFFFF] pb-[32px]"
        >
          {{ s2Text4 }}
        </p>
      </div>

      <div class="og-divider will-change-transform w-full">
        <div class="borderGreen w-full max-w-[991px]" />
        <div
          class="text-[#FFFFFF] text-center w-full h-[2px] bg-gradient-to-r from-transparent via-[#00FF0D] to-transparent"
        />
      </div>

      <div class="w-full max-w-[801px]">
        <p
          class="og-last will-change-transform type-lead type-measure mx-auto text-[#FFFFFF] pt-[32px] pb-[34px] text-center"
        >
          <span class="font-semibold">
            <span class="text-[#15FF00]">{{ $t("brand.one") }}</span
            >{{ $t("brand.brandingSuffix") }}
          </span>
          {{ s2Text5.replace(/^Onebranding\s*/i, "") }}
        </p>
      </div>
    </div>
  </div>
</template>
