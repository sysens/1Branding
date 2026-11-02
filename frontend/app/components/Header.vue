<template>
  <Teleport to="body">
    <div class="MainHeader headerMain relative px-[1.25rem] min-[950px]:px-0 z-[8888]">
      <header
        ref="headerEl"
        class="site-header header intro-drop-in isolate backdrop-blur-md z-20 bg-[#00000080]/50 max-w-[61.25rem] min-[950px]:max-w-[56.25rem] mt-[1.25rem] min-[950px]:mt-[0px] flex items-center min-[950px]:mx-auto px-3 min-[950px]:pl-[1.75rem] min-[950px]:pr-[0.6875rem] border h-[4.75rem] min-[950px]:h-[3.5rem] mx-[1.25rem] border-[#4fbd34] fixed min-[950px]:top-[1.875rem] top-[0.625rem] left-0 right-0 shadow-[0_0_25px_#03CB00] rounded-[3.75rem] min-[950px]:shadow-[0_0_10px_rgb(3_203_0/0.25)]"
      >
        <!-- The wordmark, as in the design: "One" in green, "Branding" in white. -->
        <a
          :href="localePath('/')"
          class="site-logo"
          aria-label="OneBranding"
          @click="onNav($event, localePath('/'))"
        >
          <span class="site-logo__one">{{ $t("brand.one") }}</span>Branding
        </a>

        <nav class="menuLink site-nav hidden min-[950px]:flex flex-1 items-center justify-center">
          <a class="site-nav__link" :href="localePath('/about')" @click="onNav($event, localePath('/about'))">
            {{ $t("nav.about") }}
          </a>
          <a class="site-nav__link" :href="localePath('/projects')" @click="onNav($event, localePath('/projects'))">
            {{ $t("nav.projects") }}
          </a>
          <HeaderServicesMenu />
          <a class="site-nav__link" :href="localePath('/pricing')" @click="onNav($event, localePath('/pricing'))">
            {{ $t("nav.prices") }}
          </a>
          <a class="site-nav__link" :href="localePath('/contact')" @click="onNav($event, localePath('/contact'))">
            {{ $t("nav.contacts") }}
          </a>

          <!-- The language switcher: the trigger is a nav item showing the
               current language; the list, a dark glass panel, shows each
               language's code, its own name and a check on the current one.
               Escape or a click outside closes it. -->
          <div ref="langRoot" class="lang-switch" @keydown.esc="closeDeskLang(true)" @focusout="onLangFocusOut">
            <button
              ref="langTrigger"
              type="button"
              class="site-nav__link site-nav__lang"
              aria-haspopup="true"
              aria-controls="lang-select-list"
              :aria-expanded="isDeskLangOpen"
              :aria-label="`${$t('a11y.language')}: ${LANGUAGE_NAMES[lang]}`"
              @click="isDeskLangOpen = !isDeskLangOpen"
              @keydown.down.prevent="openDeskLang"
              @keydown.up.prevent="openDeskLang"
            >
              <span>{{ lang.toUpperCase() }}</span>
              <svg class="lang-switch__chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>

            <Transition name="lang-switch">
              <div v-show="isDeskLangOpen" id="lang-select-list" class="lang-switch__panel" @keydown="onLangListKeydown">
                <!-- Links, not buttons: crawlers follow them to the other languages. -->
                <a
                  v-for="(code, index) in LANGS"
                  :key="code"
                  :href="langHref(code)"
                  :hreflang="code"
                  :lang="code"
                  class="lang-switch__item"
                  :class="{ 'is-active': code === lang }"
                  :style="{ '--i': index }"
                  :aria-current="code === lang ? 'true' : undefined"
                  @click="onLangLink($event, code)"
                >
                  <span class="lang-switch__code">{{ code }}</span>
                  <span class="lang-switch__name">{{ LANGUAGE_NAMES[code] }}</span>
                  <svg class="lang-switch__check" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </a>
              </div>
            </Transition>
          </div>
        </nav>

        <div class="hidden min-[950px]:flex items-center">
          <a
            :href="localePath('/one-guarantee')"
            class="site-guarantee"
            @click="onNav($event, localePath('/one-guarantee'))"
          >
            <span class="site-guarantee__one">{{ $t("brand.one") }}</span><span class="site-guarantee__rest">{{ $t("brand.oneGuaranteeSuffix") }}</span>
          </a>
        </div>

        <div class="flex-1 relative block min-[950px]:hidden">

          <div class="toggleButton oneGuarantee relative flex z-[111] justify-end">
            <button
              ref="menuOpenButton"
              type="button"
              :aria-label="$t('a11y.openMenu')"
              :aria-expanded="isMobileMenuOpen"
              aria-controls="mobile-menu"
              class="w-[3.375rem] h-[3.25rem] flex items-center justify-center border border-[#03CB00] bg-[#00000080] rounded-[2.5rem] shadow-[0_0_15px_#03CB00]"
              @click="isMobileMenuOpen = true"
            >
              <!-- Vector, so the 21px bitmap no longer blurs on high-DPI screens. -->
              <svg class="w-[1.5rem] h-auto" viewBox="0 0 21 21" width="24" height="24" fill="#00EA00" aria-hidden="true">
                <rect width="21" height="3.5" rx="1.75" />
                <rect y="8.75" width="21" height="3.5" rx="1.75" />
                <rect y="17.5" width="21" height="3.5" rx="1.75" />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </div>
  </Teleport>

  <Teleport to="body">
    <transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="isMobileMenuOpen"
        id="mobile-menu"
        ref="mobileMenu"
        role="dialog"
        aria-modal="true"
        :aria-label="$t('a11y.menu')"
        class="fixed inset-0 z-[2147483647] min-[950px]:hidden bg-gradient-to-b from-black to-[#00EA00] h-[100dvh] overflow-hidden overscroll-none"
        @keydown="onMenuKeydown"
      >
        <div class="absolute inset-0 bg-black/80" aria-hidden="true" @click="closeMobileMenu"/>

        <div class="relative h-full overflow-y-auto overscroll-contain z-[2147483647]">
          <div class="flex items-center justify-between px-[2rem] pt-[2.5rem] pb-[4.5rem]">
            <a :href="localePath('/')" @click="onNav($event, localePath('/'))">
              <img class="w-[4.5rem] h-auto" src="/header/headerlogo.jpg" alt="OneBranding" >
            </a>

            <button
              ref="menuCloseButton"
              type="button"
              :aria-label="$t('a11y.closeMenu')"
              class="w-[3.375rem] h-[3.25rem] flex items-center justify-center border border-[#03CB00] bg-[#00000080] rounded-[2.5rem] shadow-[0_0_15px_#03CB00]"
              @click="closeMobileMenu"
            >
              <img
                class="w-[1.5rem] h-auto rotate-90"
                src="/header/vector-13.png"
                alt=""
              >
            </button>
          </div>

          <div class="px-[1.25rem]">
            <a
              :href="localePath('/services')"
              class="type-h4 block py-[1.4375rem] p-[1.25rem] text-white"
              @click="onNav($event, localePath('/services'))"
            >
              {{ $t("nav.services") }}
            </a>

            <div class="h-px bg-white/10"/>

            <a
              :href="localePath('/about')"
              class="type-h4 block py-[1.4375rem] p-[1.25rem] text-white"
              @click="onNav($event, localePath('/about'))"
            >
              {{ $t("nav.about") }}
            </a>

            <div class="h-px bg-white/10"/>

            <a
              :href="localePath('/projects')"
              class="type-h4 block py-[1.4375rem] p-[1.25rem] text-white"
              @click="onNav($event, localePath('/projects'))"
            >
              {{ $t("nav.projects") }}
            </a>
            <div class="h-px bg-white/10"/>

            <a
              :href="localePath('/contact')"
              class="type-h4 block py-[1.4375rem] p-[1.25rem] text-white"
              @click="onNav($event, localePath('/contact'))"
            >
              {{ $t("nav.contacts") }}
            </a>
            <div class="h-px bg-white/10"/>

            <a
              :href="localePath('/one-guarantee')"
              class="type-h4 block py-[1.4375rem] p-[1.25rem] text-white"
              @click="onNav($event, localePath('/one-guarantee'))"
            >
              <span class="text-[#03CB00]">{{ $t("brand.one") }}</span>
              {{ $t("brand.oneGuaranteeSuffix") }}
            </a>

            <div class="h-px bg-white/10"/>

            <a
              :href="localePath('/pricing')"
              class="type-h4 block py-[1.4375rem] p-[1.25rem] text-white"
              @click="onNav($event, localePath('/pricing'))"
            >
              {{ $t("nav.prices") }}
            </a>
            <div class="h-px bg-white/10"/>

            <a
              :href="localePath('/news')"
              class="type-h4 block py-[1.4375rem] p-[1.25rem] text-white"
              @click="onNav($event, localePath('/news'))"
            >
              {{ $t("nav.news") }}
            </a>
            <div class="h-px bg-white/10"/>

            <div>
              <div class="block py-[1.4375rem] text-white">
                <div class="relative w-full">
                  <button
                    type="button"
                    class="type-h4 w-full px-[1.25rem] flex pb-[1.5625rem] items-center justify-between text-white align-middle"
                    @click="isLangOpen = !isLangOpen"
                  >
                    <span>{{ lang }}</span>
                    <svg
                      class="w-5 h-5 transition-transform duration-200"
                      :class="isLangOpen ? 'rotate-180' : 'rotate-0'"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  </button>

                  <transition
                    enter-active-class="transition-all duration-200 ease-out"
                    enter-from-class="opacity-0 translate-y-2 scale-95"
                    enter-to-class="opacity-100 translate-y-0 scale-100"
                    leave-active-class="transition-all duration-150 ease-in"
                    leave-from-class="opacity-100 translate-y-0 scale-100"
                    leave-to-class="opacity-0 translate-y-2 scale-95"
                  >
                    <div
                      v-if="isLangOpen"
                      class="absolute left-0 right-0 top-[-100%] rounded-[1.25rem] bg-[#FFFFFF14] backdrop-blur-md border border-white/10 overflow-hidden"
                    >
                      <template v-for="(code, index) in LANGS" :key="code">
                        <div v-if="index" class="h-px w-[70%] ml-[1.25rem] bg-white/10"/>
                        <a
                          :href="langHref(code)"
                          :hreflang="code"
                          :lang="code"
                          class="type-h4 block w-full px-[1.25rem] py-[0.875rem] text-start text-white align-middle hover:bg-white/5"
                          :aria-current="code === lang ? 'true' : undefined"
                          @click="onLangLink($event, code)"
                        >{{ code }}</a>
                      </template>
                    </div>
                  </transition>
                </div>
                <div class="h-px bg-white/10"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onBeforeUnmount, nextTick, computed, ref } from "vue";
import HeaderServicesMenu from "~/components/HeaderServicesMenu.vue";
import { LANGUAGE_NAMES, SITE_LOCALES, toSiteLocale, type SiteLocale } from "~/utils/locales";
import { serviceBySlug, servicePath } from "~/utils/servicePages";

type AppLocale = SiteLocale;
// The switchers offer English and Russian only. The Uzbek pages are still
// served (and listed in hreflang and the sitemap), just not offered here.
const LANGS: SiteLocale[] = SITE_LOCALES.filter((code) => code !== "uz");

const isMobileMenuOpen = useState<boolean>("mobileMenuOpen", () => false);
const isLangOpen = useState<boolean>("mobileLangOpen", () => false);

const { locale } = useI18n();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();
const router = useRouter();
const route = useRoute();

const isIOSWebKit = () => {
  if (!import.meta.client) return false;

  const ua = window.navigator.userAgent || "";
  const isIOS = /iP(ad|hone|od)/i.test(ua);
  const isWebKit = /WebKit/i.test(ua);
  const isCriOS = /CriOS/i.test(ua);
  const isFxiOS = /FxiOS/i.test(ua);

  return isIOS && isWebKit && !isCriOS && !isFxiOS;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
  isLangOpen.value = false;
  unlockBodyScroll();
};

const lang = computed<AppLocale>({
  get: () => toSiteLocale(locale.value),
  set: async (val) => {
    const next = toSiteLocale(val);
    const target = switchLocalePath(next);

    if (!target) return;

    await navigateSafely(target, true);
  },
});

// The desktop language select; the phone menu has its own list (isLangOpen).
const isDeskLangOpen = ref(false);
const langRoot = ref<HTMLElement | null>(null);
const langTrigger = ref<HTMLButtonElement | null>(null);
const closeDeskLang = (refocus = false) => {
  if (!isDeskLangOpen.value) return;
  isDeskLangOpen.value = false;
  if (refocus) langTrigger.value?.focus();
};
const onDocPointerDown = (event: PointerEvent) => {
  if (isDeskLangOpen.value && !langRoot.value?.contains(event.target as Node)) closeDeskLang();
};
onMounted(() => document.addEventListener("pointerdown", onDocPointerDown));

// Arrow keys: on the trigger they open the list on the current language; in
// the list they move between the languages (wrapping; Home and End go to the
// ends). Tab moves through the links as usual, and focus going on to anything
// outside the select closes it (a click that focuses nothing, as on Safari,
// is left to the pointerdown handler, so it still reaches the link).
const langItems = () => Array.from(langRoot.value?.querySelectorAll<HTMLAnchorElement>(".lang-switch__item") ?? []);
const focusLangItem = (index: number) => {
  const items = langItems();
  if (items.length) items[(index + items.length) % items.length]?.focus();
};
const openDeskLang = async () => {
  isDeskLangOpen.value = true;
  await nextTick();
  focusLangItem(Math.max(0, LANGS.indexOf(lang.value)));
};
const onLangListKeydown = (event: KeyboardEvent) => {
  const items = langItems();
  const current = items.indexOf(document.activeElement as HTMLAnchorElement);
  const moves: Record<string, number> = { ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: items.length - 1 };
  const next = moves[event.key];
  if (next === undefined) return;
  event.preventDefault();
  focusLangItem(next);
};
const onLangFocusOut = (event: FocusEvent) => {
  const next = event.relatedTarget as Node | null;
  if (next && !langRoot.value?.contains(next)) closeDeskLang();
};

const pickLang = async (val: AppLocale) => {
  isLangOpen.value = false;
  isDeskLangOpen.value = false;
  await nextTick();
  lang.value = val;
};

// The same page in another language. A service page's slug differs per
// language; the page sets it for switchLocalePath only once its own setup
// runs, after the header has rendered on the server, so it is looked up here.
const langHref = (code: AppLocale) => {
  const slug = typeof route.params.slug === "string" && /\/services\/[^/]+\/?$/.test(route.path) ? route.params.slug : "";
  const service = slug ? serviceBySlug(slug) : undefined;
  return service ? servicePath(service.key, code) : switchLocalePath(code);
};

// A plain left click switches in-app; modified clicks open the link as usual.
const onLangLink = (event: MouseEvent, code: AppLocale) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  void pickLang(code);
};

const lockBodyScroll = () => {
  if (!import.meta.client) return;

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
};

const unlockBodyScroll = () => {
  if (!import.meta.client) return;

  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
};

const menuOpenButton = ref<HTMLButtonElement | null>(null);
const menuCloseButton = ref<HTMLButtonElement | null>(null);
const mobileMenu = ref<HTMLElement | null>(null);

// The open menu is a modal dialog: focus moves into it, Tab stays inside,
// Escape closes it, and focus returns to the menu button afterwards.
watch(isMobileMenuOpen, async (v) => {
  if (v) {
    lockBodyScroll();
    await nextTick();
    menuCloseButton.value?.focus();
  } else {
    unlockBodyScroll();
    menuOpenButton.value?.focus();
  }
});

const onMenuKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeMobileMenu();
    return;
  }
  if (event.key !== "Tab" || !mobileMenu.value) return;
  const focusable = Array.from(
    mobileMenu.value.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
  ).filter((el) => el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu();
  }
);

const navigateSafely = async (to: string, replace = false) => {
  if (!import.meta.client || !to) return;

  closeMobileMenu();
  await nextTick();

  const targetUrl = to;

  if (isIOSWebKit()) {
    window.location.assign(targetUrl);
    return;
  }

  try {
    if (replace) {
      await router.replace(targetUrl);
    } else {
      await router.push(targetUrl);
    }

    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  } catch {
    window.location.assign(targetUrl);
  }
};

const goTo = async (to: string) => {
  await navigateSafely(to, false);
};

// In-app navigation for plain left clicks only; modified or middle clicks keep
// the browser's own behaviour (new tab, new window, download).
const onNav = (event: MouseEvent, to: string) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  void goTo(to);
};

const removeAfterEach = router.afterEach(() => {
  closeMobileMenu();
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocPointerDown);
  unlockBodyScroll();
  removeAfterEach?.();
});
</script>

<style>
/* Header type, on the site's type scale: the links, the language select
   and the OneGuarantee pill are the small step (15px) in semibold, the
   wordmark the h5 step, in a 56px bar. The steps keep one size on every
   desktop, so the bar keeps one size too. */
.site-logo {
  flex-shrink: 0;
  color: #fff;
  font-family: var(--app-font-display);
  font-size: var(--type-h5-size);
  font-weight: 600;
  line-height: var(--type-h5-lh);
  letter-spacing: var(--type-h5-ls);
  white-space: nowrap;
  text-decoration: none;
}

.site-logo__one {
  color: #17c93b;
}

.site-nav {
  gap: 1.375rem;
}

.site-nav__link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0;
  border: 0;
  background: none;
  color: #efefef;
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 600;
  line-height: var(--type-small-lh);
  letter-spacing: var(--type-small-ls);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.3s ease;
}

.site-nav__link:hover {
  color: #03cb00;
}

/* OneGuarantee pill. At rest it is lit: liquid green light fills it and keeps
   flowing, the text is dark on it, two beams run round the outline in
   opposite directions (meeting and flaring twice a lap), the pill pulses and
   a white sheen runs back across "Guarantee". Hovered, the light drains out
   to the left and it goes quiet: black, white text, one green beam orbiting
   and "One" breathing. The beams are conic gradients turned by
   --guarantee-angle / --guarantee-back and masked to a ring the width of the
   border; the forward beam and the flow never restart, so nothing jumps. */
@property --guarantee-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: true;
}

@property --guarantee-back {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: true;
}

/* The black shade's soft front over the green: 114% = fully lit, 0% = dark. */
@property --guarantee-fill {
  syntax: "<percentage>";
  initial-value: 0%;
  inherits: false;
}

.site-guarantee {
  --guarantee-angle: 0deg;
  --guarantee-speed: 4.5s;
  --guarantee-fill: 114%;
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  padding: 0 1.125rem;
  border: 1px solid #03cb00;
  border-radius: 2.5rem;
  background:
    linear-gradient(90deg, transparent calc(var(--guarantee-fill) - 14%), #000 var(--guarantee-fill)) 0 0 / 100% 100% no-repeat,
    linear-gradient(110deg, #03cb00 0%, #7dff6b 22%, #0b9a2c 48%, #03cb00 70%, #7dff6b 100%) 0% 50% / 300% 100% no-repeat,
    #000;
  box-shadow: 0 0 0.875rem rgb(3 203 0 / 0.4);
  color: #021d08;
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 600;
  line-height: var(--type-small-lh);
  letter-spacing: var(--type-small-ls);
  white-space: nowrap;
  text-decoration: none;
  /* Coming back to rest: the light pours in, the text darkens as it arrives. */
  transition: --guarantee-fill 0.9s cubic-bezier(0.45, 0, 0.2, 1), color 0.5s ease 0.35s, box-shadow 0.6s ease, border-color 0.6s ease;
}

.site-guarantee__one {
  color: #000;
  transition: color 0.5s ease 0.35s;
}

.site-guarantee:hover,
.site-guarantee:focus-visible {
  --guarantee-fill: 0%;
  border-color: rgb(64 140 52 / 0.85);
  box-shadow: none;
  color: #fff;
  /* Hovering: the light drains and the text turns white straight away. */
  transition: --guarantee-fill 0.9s cubic-bezier(0.45, 0, 0.2, 1), color 0.3s ease, box-shadow 0.6s ease, border-color 0.6s ease;
}

.site-guarantee:hover .site-guarantee__one,
.site-guarantee:focus-visible .site-guarantee__one {
  color: #36c536;
  transition: color 0.3s ease;
}

.site-guarantee::before,
.site-guarantee::after {
  position: absolute;
  inset: -1px;
  z-index: -1;
  padding: 0.078rem;
  border-radius: inherit;
  background:
    conic-gradient(from var(--guarantee-angle), transparent 0deg 240deg, rgb(3 203 0 / 0.15) 280deg, #03cb00 335deg, #c9ffbf 354deg, transparent 360deg),
    conic-gradient(from var(--guarantee-back), transparent 0deg, #f2ffe9 4deg, #6bff5c 14deg, rgb(3 203 0 / 0.55) 42deg, transparent 110deg 360deg);
  content: "";
  pointer-events: none;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
}

/* The glow: the same beams, blurred and a little wider. */
.site-guarantee::after {
  padding: 0.156rem;
  filter: blur(0.1875rem);
  opacity: 0.8;
}

/* Hovered: only the forward beam. */
.site-guarantee:hover::before,
.site-guarantee:hover::after,
.site-guarantee:focus-visible::before,
.site-guarantee:focus-visible::after {
  background: conic-gradient(from var(--guarantee-angle), transparent 0deg 240deg, rgb(3 203 0 / 0.15) 280deg, #03cb00 335deg, #c9ffbf 354deg, transparent 360deg);
}

@media (prefers-reduced-motion: no-preference) {
  .site-guarantee {
    animation:
      guarantee-orbit var(--guarantee-speed) linear infinite,
      guarantee-reverse 2.4s linear infinite,
      guarantee-charge 1.6s ease-in-out 0.5s infinite,
      guarantee-flow 3.2s ease-in-out infinite alternate;
  }

  .site-guarantee__rest {
    background: linear-gradient(100deg, #021d08 36%, #d9ffd2 46%, #fff 50%, #d9ffd2 54%, #021d08 64%) 0 0 / 250% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: guarantee-shine 1.6s linear 0.7s infinite;
  }

  .site-guarantee:hover,
  .site-guarantee:focus-visible {
    animation:
      guarantee-orbit var(--guarantee-speed) linear infinite,
      guarantee-flow 3.2s ease-in-out infinite alternate;
  }

  .site-guarantee:hover .site-guarantee__rest,
  .site-guarantee:focus-visible .site-guarantee__rest {
    background: none;
    color: inherit;
    animation: none;
  }

  .site-guarantee:hover .site-guarantee__one,
  .site-guarantee:focus-visible .site-guarantee__one {
    animation: guarantee-breathe var(--guarantee-speed) ease-in-out infinite;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-guarantee::before,
  .site-guarantee::after {
    display: none;
  }
}

@keyframes guarantee-orbit {
  to { --guarantee-angle: 360deg; }
}

@keyframes guarantee-reverse {
  from { --guarantee-back: 360deg; }
  to { --guarantee-back: 0deg; }
}

@keyframes guarantee-breathe {
  0%, 100% { text-shadow: none; }
  50% { text-shadow: 0 0 0.5rem rgb(3 203 0 / 0.7); }
}

/* Light from within: a white inner glow and the green halo pulse together. */
@keyframes guarantee-charge {
  0%, 100% { box-shadow: 0 0 0.875rem rgb(3 203 0 / 0.4), inset 0 0 0.25rem rgb(255 255 255 / 0.25); }
  50% { box-shadow: 0 0 1.75rem rgb(3 203 0 / 0.7), inset 0 0 0.625rem rgb(255 255 255 / 0.55); }
}

/* The flood keeps moving: its highlights slosh back and forth. */
@keyframes guarantee-flow {
  from { background-position: 0 0, 0% 50%, 0 0; }
  to { background-position: 0 0, 100% 50%, 0 0; }
}

/* The highlight sits at the middle of a 250%-wide gradient: from 0% to 100%
   it crosses the word from its right edge to its left. */
@keyframes guarantee-shine {
  from { background-position: 0% 0; }
  to { background-position: 100% 0; }
}

/* The language switcher: the trigger is a nav item (green with its chevron
   turned while open); the list is a dark glass panel under the header, each
   option showing its code, its own name and a check on the current one. The
   options come in one after another as it opens. */
.lang-switch {
  position: relative;
}

.lang-switch__chevron {
  width: 0.625rem;
  height: 0.625rem;
  transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.site-nav__lang[aria-expanded="true"] {
  color: #03cb00;
}

.site-nav__lang[aria-expanded="true"] .lang-switch__chevron {
  transform: rotate(180deg);
}

.lang-switch__panel {
  position: absolute;
  top: calc(100% + 1.25rem);
  left: 50%;
  z-index: 30;
  display: grid;
  gap: 0.125rem;
  min-width: 10.25rem;
  padding: 0.375rem;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 0.875rem;
  /* Nearly opaque: the header's own backdrop blur keeps a nested one from
     reaching the page behind. */
  background: rgb(12 14 12 / 0.96);
  box-shadow: 0 1.375rem 2.75rem -0.875rem rgb(0 0 0 / 0.7), 0 0 1.75rem rgb(3 203 0 / 0.1);
  transform-origin: 50% 0;
  translate: -50% 0;
}

.lang-switch__item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border-radius: 0.5625rem;
  color: #c9cec9;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  font-weight: 500;
  line-height: var(--type-caption-lh);
  letter-spacing: var(--type-caption-ls);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.lang-switch__item:hover,
.lang-switch__item:focus-visible {
  background: rgb(3 203 0 / 0.1);
  color: #fff;
  outline: none;
}

.lang-switch__item:focus-visible {
  box-shadow: inset 0 0 0 1px rgb(3 203 0 / 0.55);
}

.lang-switch__item.is-active {
  color: #fff;
}

.lang-switch__code {
  display: grid;
  flex: none;
  place-items: center;
  width: 1.75rem;
  height: 1.25rem;
  border-radius: 0.3125rem;
  background: rgb(255 255 255 / 0.06);
  color: #9aa19c;
  font-size: var(--type-label-size);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.lang-switch__item.is-active .lang-switch__code {
  background: rgb(3 203 0 / 0.16);
  color: #03cb00;
}

.lang-switch__name {
  flex: 1;
}

.lang-switch__check {
  flex: none;
  width: 0.875rem;
  height: 0.875rem;
  color: #03cb00;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.lang-switch__item.is-active .lang-switch__check {
  opacity: 1;
  transform: none;
}

.lang-switch-enter-active {
  transition: opacity 0.18s ease, transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.lang-switch-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.lang-switch-enter-from,
.lang-switch-leave-to {
  opacity: 0;
  transform: translateY(-0.375rem) scale(0.96);
}

.lang-switch-enter-active .lang-switch__item {
  animation: lang-switch-item 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: calc(40ms + var(--i) * 45ms);
}

@keyframes lang-switch-item {
  from {
    opacity: 0;
    transform: translateY(-0.25rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lang-switch-enter-active,
  .lang-switch-leave-active,
  .lang-switch__chevron {
    transition: none;
  }

  .lang-switch-enter-active .lang-switch__item {
    animation: none;
  }
}

/* Phones and tablets: the 76px bar takes the wordmark a step up (h3, 26px on
   a phone, as before). */
@media (max-width: 949px) {
  .site-logo {
    margin-left: 0.875rem;
    font-size: var(--type-h3-size);
    line-height: var(--type-h3-lh);
    letter-spacing: var(--type-h3-ls);
  }
}

.shake-btn {
  box-shadow: 0 0 0.9375rem #03cb00;
  animation: glowBlink 3s ease-in-out infinite;
}

@keyframes glowBlink {
  0% {
    box-shadow: 0 0 2.1875rem #03cb00;
  }
  25% {
    box-shadow: 0 0 0px #03cb00;
  }
  50% {
    box-shadow: 0 0 2.1875rem #03cb00;
  }
  75% {
    box-shadow: 0 0 0px #03cb00;
  }
  100% {
    box-shadow: 0 0 2.1875rem #03cb00;
  }
}

.MainHeader {
  z-index: 1000;
}

.site-header {
  z-index: 1000 !important;
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  will-change: transform;
}

/* Narrow desktops: the items close up. */
@media (min-width: 950px) and (max-width: 1099px) {
  .site-header .site-nav {
    gap: 0.875rem;
  }
}

/* No 1920px+ block: the type steps stop growing at 1920px, so the 900px bar
   (sized for the longest labels, Uzbek) stays as it is on wider monitors
   instead of spreading its items apart. */
</style>
