<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

// Site footer: "Let's build what's next." with the start-a-project call, four
// link columns and the brand line. It is revealed like jsoft.vercel.app's: the
// footer clips its content, which starts half its height higher and settles as
// the footer scrolls in, while a black veil over it fades out.

const localePath = useLocalePath();
const { t } = useI18n();
const { socialMedia: social } = await useFooterSocials();

type FooterLink = { label: string; to?: string; href?: string };
const columns = computed<Array<{ title: string; links: FooterLink[] }>>(() => [
  {
    title: t("footerNew.explore"),
    links: [
      { label: t("footerNew.work"), to: localePath("/projects") },
      { label: t("footerNew.services"), to: `${localePath("/")}#services` },
      { label: t("footerNew.about"), to: localePath("/about") },
      { label: t("footerNew.contact"), to: localePath("/contact") },
    ],
  },
  {
    title: t("footerNew.expertise"),
    links: [
      { label: t("footerNew.branding"), to: `${localePath("/")}#services` },
      { label: t("footerNew.packaging"), to: `${localePath("/")}#services` },
      { label: t("footerNew.photography"), to: `${localePath("/")}#services` },
      { label: t("footerNew.web"), to: `${localePath("/")}#services` },
    ],
  },
  {
    title: t("footerNew.information"),
    links: [
      { label: t("footerNew.process"), to: `${localePath("/")}#audit` },
      { label: t("footerNew.guarantee"), to: localePath("/one-guarantee") },
      // No privacy or terms pages exist yet: plain labels until they do.
      { label: t("footerNew.privacy") },
      { label: t("footerNew.terms") },
    ],
  },
  {
    title: t("footerNew.social"),
    links: [
      { label: "Instagram", href: social.value?.instagramLink || "https://www.instagram.com/" },
      { label: "Telegram", href: social.value?.telegramLink || "https://t.me/" },
    ],
  },
]);

const year = new Date().getFullYear();

// Reveal: progress 0 when the footer's top meets the bottom of the screen, 1
// once it has scrolled in by its own height (or the page ends).
const root = ref<HTMLElement | null>(null);
const inner = ref<HTMLElement | null>(null);
const veil = ref<HTMLElement | null>(null);
let frame = 0;
let stop: (() => void) | undefined;

const render = () => {
  frame = 0;
  const footer = root.value;
  if (!footer || !inner.value || !veil.value) return;
  const rect = footer.getBoundingClientRect();
  const span = Math.min(rect.height, window.innerHeight);
  const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / span));
  inner.value.style.transform = `translate3d(0, ${(-50 * (1 - progress)).toFixed(3)}%, 0)`;
  veil.value.style.opacity = (1 - progress).toFixed(3);
};
const schedule = () => {
  if (!frame) frame = requestAnimationFrame(render);
};

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  stop = () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
  };
  render();
});

onBeforeUnmount(() => {
  stop?.();
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <footer ref="root" class="site-footer">
    <div ref="inner" class="site-footer__inner">
      <p class="site-footer__headline">
        <span>{{ t("footerNew.headlineFirst") }}</span>
        <span>{{ t("footerNew.headlineLead") }} <span class="site-footer__green">{{ t("footerNew.headlineAccent") }}</span></span>
      </p>

      <div class="site-footer__middle">
        <div class="site-footer__cta">
          <p class="site-footer__ready">{{ t("footerNew.ready") }}</p>
          <p class="site-footer__pitch">
            <span>{{ t("footerNew.pitchFirst") }}</span>
            <span>{{ t("footerNew.pitchSecond") }}</span>
          </p>
          <NuxtLink :to="localePath('/contact')" class="site-footer__start">
            {{ t("footerNew.start") }}
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </NuxtLink>
        </div>

        <nav class="site-footer__columns" :aria-label="t('footerNew.navLabel')">
          <div v-for="column in columns" :key="column.title" class="site-footer__column">
            <p class="site-footer__label">{{ column.title }}</p>
            <ul>
              <li v-for="link in column.links" :key="link.label">
                <NuxtLink v-if="link.to" :to="link.to" class="site-footer__link">{{ link.label }}</NuxtLink>
                <a v-else-if="link.href" :href="link.href" target="_blank" rel="noopener noreferrer" class="site-footer__link">
                  {{ link.label }}
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8" /></svg>
                </a>
                <span v-else class="site-footer__link site-footer__link--plain">{{ link.label }}</span>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div class="site-footer__bottom">
        <div>
          <p class="site-footer__logo"><span class="site-footer__green">One</span>Branding</p>
          <p class="site-footer__tagline">{{ t("footerNew.tagline") }}</p>
        </div>
        <div class="site-footer__contact">
          <a href="tel:+998935608000" class="site-footer__phone">+998 93 560 80 00</a>
          <p class="site-footer__copyright">© {{ year }} OneBranding. {{ t("footerNew.rights") }}</p>
        </div>
      </div>
    </div>
    <div ref="veil" class="site-footer__veil" aria-hidden="true" />
  </footer>
</template>

<style scoped>
/* --u is one pixel of the 2000px design frame. */
.site-footer {
  --u: 0.05vw;
  --green: #08e24f;
  position: relative;
  z-index: 30;
  overflow: hidden;
  background: #000;
  color: #fff;
  /* Outranks the global `body * { font-family: inherit !important }`. */
  font-family: var(--app-font-display) !important;
}

.site-footer p {
  margin: 0;
}

.site-footer__inner {
  display: flex;
  flex-direction: column;
  min-height: min(100svh, calc(1130 * var(--u)));
  padding: calc(150 * var(--u)) calc(72 * var(--u)) calc(70 * var(--u)) calc(70 * var(--u));
  will-change: transform;
}

.site-footer__veil {
  position: absolute;
  inset: 0;
  background: #000;
  pointer-events: none;
}

.site-footer__headline {
  display: flex;
  flex-direction: column;
  font-size: calc(170 * var(--u));
  font-weight: 700;
  line-height: 0.85;
  letter-spacing: -0.055em;
  -webkit-text-stroke: calc(4 * var(--u)) currentColor;
}

.site-footer__green {
  color: var(--green);
}

.site-footer__middle {
  display: flex;
  justify-content: space-between;
  gap: 3rem;
  margin: calc(135 * var(--u)) 0 calc(106 * var(--u));
}

.site-footer__ready {
  font-size: calc(36 * var(--u));
  font-weight: 700;
  letter-spacing: -0.02em;
}

.site-footer__pitch {
  display: flex;
  flex-direction: column;
  margin-top: calc(10 * var(--u)) !important;
  color: #94979b;
  font-size: calc(30 * var(--u));
  line-height: 1.33;
  letter-spacing: -0.01em;
}

.site-footer__start {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  width: calc(377 * var(--u));
  height: calc(82 * var(--u));
  margin-top: calc(42 * var(--u));
  border-radius: 999px;
  background: var(--green);
  color: #031c0b;
  font-size: calc(31 * var(--u));
  font-weight: 700;
  letter-spacing: -0.02em;
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.site-footer__start svg,
.site-footer__link svg {
  width: 0.95em;
  height: 0.95em;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
}

.site-footer__start:hover,
.site-footer__start:focus-visible {
  transform: scale(1.04);
  box-shadow: 0 0 calc(40 * var(--u)) rgb(8 226 79 / 0.45);
}

.site-footer__columns {
  display: grid;
  grid-template-columns: calc(252 * var(--u)) calc(300 * var(--u)) calc(313 * var(--u)) auto;
  margin-top: calc(2 * var(--u));
}

.site-footer__label {
  color: #9b9ea2;
  font-size: calc(18 * var(--u));
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.site-footer__column ul {
  display: flex;
  flex-direction: column;
  gap: calc(25 * var(--u));
  margin: calc(32 * var(--u)) 0 0;
  padding: 0;
  list-style: none;
}

.site-footer__link {
  display: inline-flex;
  align-items: center;
  gap: 0.45em;
  color: #fff;
  font-size: calc(26 * var(--u));
  line-height: 1.2;
  letter-spacing: -0.01em;
  text-decoration: none;
  transition: color 0.25s ease, transform 0.25s ease;
}

a.site-footer__link:hover,
a.site-footer__link:focus-visible {
  color: var(--green);
  transform: translateX(calc(4 * var(--u)));
}

.site-footer__link--plain {
  cursor: default;
}

.site-footer__bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-top: auto;
  padding-top: calc(66 * var(--u));
  border-top: 1px solid rgb(255 255 255 / 0.12);
}

.site-footer__logo {
  font-size: calc(56 * var(--u));
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
}

.site-footer__tagline {
  margin-top: calc(18 * var(--u)) !important;
  color: #9b9ea2;
  font-size: calc(25 * var(--u));
}

.site-footer__contact {
  text-align: right;
}

.site-footer__phone {
  color: #fff;
  font-size: calc(28 * var(--u));
  text-decoration: none;
}

.site-footer__copyright {
  margin-top: calc(22 * var(--u)) !important;
  color: #9b9ea2;
  font-size: calc(19 * var(--u));
}

.site-footer a:focus-visible {
  outline: 2px solid var(--green);
  outline-offset: 4px;
}

@media (max-width: 899px) {
  .site-footer__inner {
    min-height: 0;
    padding: 4.5rem 1.25rem 2rem;
  }

  .site-footer__headline {
    font-size: 15vw;
    -webkit-text-stroke-width: 0.35vw;
  }

  .site-footer__middle {
    flex-direction: column;
    gap: 2.5rem;
    margin-top: 3rem;
  }

  .site-footer__ready {
    font-size: 1.35rem;
  }

  .site-footer__pitch {
    font-size: 1.05rem;
  }

  .site-footer__start {
    width: auto;
    height: 3.4rem;
    margin-top: 1.5rem;
    padding: 0 1.6rem;
    font-size: 1.1rem;
  }

  .site-footer__columns {
    grid-template-columns: 1fr 1fr;
    gap: 2.25rem 1.5rem;
  }

  .site-footer__label {
    font-size: 0.72rem;
  }

  .site-footer__column ul {
    gap: 0.85rem;
    margin-top: 1rem;
  }

  .site-footer__link {
    font-size: 1.05rem;
  }

  .site-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
    margin-top: 3rem;
    padding-top: 2rem;
  }

  .site-footer__logo {
    font-size: 2rem;
  }

  .site-footer__tagline,
  .site-footer__phone {
    font-size: 1rem;
  }

  .site-footer__contact {
    text-align: left;
  }

  .site-footer__copyright {
    font-size: 0.8rem;
  }
}
</style>
