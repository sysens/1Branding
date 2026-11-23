<script setup lang="ts">
// ERTEX Group: the rebranding proposal (ertex.onebrandingworld.com).
// Everything the page is made of lives in app/sites/ertex.
import "~/sites/ertex/ertex.css";
import interFont from "~/sites/ertex/assets/fonts/inter.woff2?url";
import { media } from "~/sites/ertex/media";
import PresentationFrame from "~/sites/ertex/components/PresentationFrame.vue";
import CoverSection from "~/sites/ertex/components/cover/CoverSection.vue";
import IdeaSection from "~/sites/ertex/components/idea/IdeaSection.vue";
import GallerySection from "~/sites/ertex/components/gallery/GallerySection.vue";
import SocialSection from "~/sites/ertex/components/social/SocialSection.vue";
import CrmSection from "~/sites/ertex/components/crm/CrmSection.vue";
import SealStory from "~/sites/ertex/components/seal/SealStory.vue";
import StandardsSection from "~/sites/ertex/components/standards/StandardsSection.vue";
import RolloutSection from "~/sites/ertex/components/rollout/RolloutSection.vue";
import SiteFooter from "~/sites/ertex/components/footer/SiteFooter.vue";

const { url } = useMicroSite("ertex");

const title = "ERTEX Group — Концепция ребрендинга";
const description = "Предложение OneBranding для ERTEX Group. Фирменный стиль на образцах тканей, в выставочном пространстве и в цифровых каналах продаж.";

useHead({
  title,
  htmlAttrs: { lang: "ru", class: "scroll-smooth motion-reduce:scroll-auto" },
  bodyAttrs: {
    id: "top",
    class: "bg-ertex-mat font-ertex text-[16px] leading-normal text-ertex-ink max-[690px]:bg-white",
  },
  link: [
    { rel: "canonical", href: url("/") },
    { rel: "icon", href: media("x.png") },
    { rel: "preload", as: "font", type: "font/woff2", href: interFont, crossorigin: "" },
  ],
  meta: [
    { name: "description", content: description },
    { name: "theme-color", content: "#071322" },
  ],
});

useSeoMeta({
  ogType: "website",
  ogLocale: "ru_RU",
  ogTitle: title,
  ogDescription: "Предложение OneBranding. Образцы тканей, фирменная упаковка, фасад, соцсети и CRM для текстильных продаж.",
  ogUrl: url("/"),
  ogImage: url(media("proposal/share-studio.jpg")),
  ogImageAlt: "Объёмный логотип ERTEX Group в направленном синем свете",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <PresentationFrame>
    <CoverSection />
    <main>
      <IdeaSection />
      <GallerySection />
      <SocialSection />
      <CrmSection />
      <SealStory />
      <StandardsSection />
      <RolloutSection />
    </main>
    <SiteFooter />
  </PresentationFrame>
</template>
