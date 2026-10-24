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

          <!-- The language switcher, a select in the shadcn style: the trigger
               shows the current language, the list each language by its own
               name. Escape or a click outside closes it. -->
          <div ref="langRoot" class="lang-select" @keydown.esc="closeDeskLang(true)">
            <button
              ref="langTrigger"
              type="button"
              class="lang-select__trigger"
              aria-haspopup="true"
              aria-controls="lang-select-list"
              :aria-expanded="isDeskLangOpen"
              :aria-label="`${$t('a11y.language')}: ${LANGUAGE_NAMES[lang]}`"
              @click="isDeskLangOpen = !isDeskLangOpen"
            >
              <span>{{ lang.toUpperCase() }}</span>
              <svg class="lang-select__chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" /></svg>
            </button>

            <Transition name="lang-select">
              <div v-show="isDeskLangOpen" id="lang-select-list" class="lang-select__content">
                <!-- Links, not buttons: crawlers follow them to the other languages. -->
                <a
                  v-for="code in LANGS"
                  :key="code"
                  :href="langHref(code)"
                  :hreflang="code"
                  :lang="code"
                  class="lang-select__item"
                  :aria-current="code === lang ? 'true' : undefined"
                  @click="onLangLink($event, code)"
                >
                  <span>{{ LANGUAGE_NAMES[code] }}</span>
                  <svg v-if="code === lang" class="lang-select__check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5" /></svg>
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
            <span class="site-guarantee__one">{{ $t("brand.one") }}</span>{{ $t("brand.oneGuaranteeSuffix") }}
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
const LANGS = SITE_LOCALES;

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

.site-guarantee {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  padding: 0 1.125rem;
  border: 1px solid rgb(64 140 52 / 0.85);
  border-radius: 2.5rem;
  background: #000;
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 600;
  line-height: var(--type-small-lh);
  letter-spacing: var(--type-small-ls);
  white-space: nowrap;
  text-decoration: none;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.site-guarantee:hover,
.site-guarantee:focus-visible {
  border-color: #03cb00;
  box-shadow: 0 0 1.125rem rgb(3 203 0 / 0.45);
}

.site-guarantee__one {
  color: #36c536;
}

/* The language select, in the shadcn style (dark theme): an outlined
   trigger with a chevron, and a popover list with a check on the current
   language. */
.lang-select {
  position: relative;
}

.lang-select__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2rem;
  padding: 0 0.5rem 0 0.6875rem;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 0.5rem;
  background: rgb(255 255 255 / 0.04);
  color: #fafafa;
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 600;
  line-height: 1;
  letter-spacing: var(--type-small-ls);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.lang-select__trigger:hover {
  background: rgb(255 255 255 / 0.08);
}

.lang-select__trigger[aria-expanded="true"],
.lang-select__trigger:focus-visible {
  border-color: rgb(3 203 0 / 0.7);
  outline: none;
  box-shadow: 0 0 0 0.1875rem rgb(3 203 0 / 0.2);
}

.lang-select__chevron,
.lang-select__check {
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.lang-select__chevron {
  width: 0.875rem;
  height: 0.875rem;
  opacity: 0.6;
  transition: transform 0.2s ease;
}

.lang-select__trigger[aria-expanded="true"] .lang-select__chevron {
  transform: rotate(180deg);
}

.lang-select__content {
  position: absolute;
  top: calc(100% + 0.625rem);
  left: 0;
  z-index: 10;
  min-width: 10rem;
  padding: 0.25rem;
  border: 1px solid #27272a;
  border-radius: 0.5rem;
  background: #09090b;
  box-shadow: 0 0.625rem 2.375rem -10px rgb(0 0 0 / 0.65), 0 0.625rem 1.25rem -15px rgb(0 0 0 / 0.45);
}

.lang-select__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.4375rem 0.5rem;
  border-radius: 0.3125rem;
  color: #fafafa;
  font-family: var(--app-font-sans);
  font-size: var(--type-small-size);
  font-weight: 400;
  line-height: var(--type-small-lh);
  letter-spacing: var(--type-small-ls);
  text-decoration: none;
  outline: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.lang-select__item:hover,
.lang-select__item:focus-visible {
  background: #27272a;
}

.lang-select__check {
  width: 1rem;
  height: 1rem;
  color: #03cb00;
}

.lang-select-enter-active,
.lang-select-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.lang-select-enter-from,
.lang-select-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
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
