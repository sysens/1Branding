<template>
  <Teleport to="body">
    <div class="MainHeader headerMain relative px-[20px] min-[950px]:px-0 z-[8888]">
      <header
        ref="headerEl"
        class="site-header header intro-drop-in isolate backdrop-blur-md z-20 bg-[#00000080]/50 max-w-[980px] mt-[20px] min-[950px]:mt-[0px] flex items-center min-[950px]:mx-auto px-3 min-[950px]:pl-[34px] min-[950px]:pr-[14px] border h-[76px] min-[950px]:h-[64px] mx-[20px] border-[#4fbd34] fixed min-[950px]:top-[30px] top-[10px] left-0 right-0 shadow-[0_0_25px_#03CB00] rounded-[60px] min-[950px]:shadow-[0_0_10px_rgb(3_203_0/0.25)]"
      >
        <!-- The wordmark, as in the design: "One" in green, "Branding" in white. -->
        <a
          :href="localePath('/')"
          class="site-logo"
          aria-label="OneBranding"
          @click.prevent="goTo(localePath('/'))"
        >
          <span class="site-logo__one">{{ $t("brand.one") }}</span>Branding
        </a>

        <nav class="menuLink site-nav hidden min-[950px]:flex flex-1 items-center justify-center">
          <a class="site-nav__link" :href="localePath('/About')" @click.prevent="goTo(localePath('/About'))">
            {{ $t("nav.about") }}
          </a>
          <a class="site-nav__link" :href="localePath('/Projects')" @click.prevent="goTo(localePath('/Projects'))">
            {{ $t("nav.projects") }}
          </a>
          <HeaderServicesMenu />
          <a class="site-nav__link" :href="localePath('/Costs')" @click.prevent="goTo(localePath('/Costs'))">
            {{ $t("nav.prices") }}
          </a>
          <a class="site-nav__link" :href="localePath('/ContactPage')" @click.prevent="goTo(localePath('/ContactPage'))">
            {{ $t("nav.contacts") }}
          </a>

          <!-- Not in the design, but the only way to the Russian site on desktop. -->
          <div class="relative">
            <button
              type="button"
              class="site-nav__link site-nav__lang"
              :aria-expanded="isLangOpen"
              @click="isLangOpen = !isLangOpen"
            >
              <span>{{ lang === "ru" ? "ru" : "en" }}</span>
              <svg
                class="w-3.5 h-3.5 transition-transform duration-200"
                :class="isLangOpen ? 'rotate-180' : 'rotate-0'"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
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
                class="absolute left-1/2 -translate-x-1/2 top-[44px] w-[65px] py-3 rounded-[20px] bg-[#0B0B0B]/95 backdrop-blur-md border border-white/10 overflow-hidden"
              >
                <button type="button" class="site-nav__link block w-full py-2 text-center" @click="pickLang('en')">en</button>
                <button type="button" class="site-nav__link block w-full py-2 text-center" @click="pickLang('ru')">ru</button>
              </div>
            </transition>
          </div>
        </nav>

        <div class="hidden min-[950px]:flex items-center">
          <a
            :href="localePath('/Oneguarantee')"
            class="site-guarantee"
            @click.prevent="goTo(localePath('/Oneguarantee'))"
          >
            <span class="site-guarantee__one">{{ $t("brand.one") }}</span>{{ $t("brand.oneGuaranteeSuffix") }}
          </a>
        </div>

        <div class="flex-1 relative block min-[950px]:hidden">
          <div
            class="absolute inset-0 bg-[url('/header/Ellipse (2).png')] bg-center bg-cover z-0"
          ></div>

          <div class="toggleButton oneGuarantee relative flex z-[111] justify-end">
            <button
              type="button"
              :aria-label="lang === 'ru' ? 'Открыть меню' : 'Open menu'"
              @click="isMobileMenuOpen = true"
              class="w-[54px] h-[52px] flex items-center justify-center border border-[#03CB00] bg-[#00000080] rounded-[40px] shadow-[0_0_15px_#03CB00]"
            >
              <!-- Vector, so the 21px bitmap no longer blurs on high-DPI screens. -->
              <svg class="w-[24px] h-auto" viewBox="0 0 21 21" width="24" height="24" fill="#00EA00" aria-hidden="true">
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
        class="fixed inset-0 z-[2147483647] min-[950px]:hidden bg-gradient-to-b from-black to-[#00EA00] h-[100dvh] overflow-hidden overscroll-none"
      >
        <div class="absolute inset-0 bg-black/80" @click="closeMobileMenu"></div>

        <div class="relative h-full overflow-y-auto overscroll-contain z-[2147483647]">
          <div class="flex items-center justify-between px-[32px] pt-[40px] pb-[72px]">
            <a :href="localePath('/')" @click.prevent="goTo(localePath('/'))">
              <img class="w-[72px] h-auto" src="/header/headerlogo.jpg" alt="OneBranding" />
            </a>

            <button
              type="button"
              :aria-label="lang === 'ru' ? 'Закрыть меню' : 'Close menu'"
              @click="closeMobileMenu"
              class="w-[54px] h-[52px] flex items-center justify-center border border-[#03CB00] bg-[#00000080] rounded-[40px] shadow-[0_0_15px_#03CB00]"
            >
              <img
                class="w-[24px] h-auto rotate-90"
                src="/header/Vector (13).png"
                alt=""
              />
            </button>
          </div>

          <div class="px-[20px]">
            <a
              :href="`${localePath('/')}#services`"
              @click.prevent="goTo(`${localePath('/')}#services`)"
              class="block py-[23px] font-['Inter'] p-[20px] text-white text-[20px]"
            >
              {{ $t("nav.services") }}
            </a>

            <div class="h-px bg-white/10"></div>

            <a
              :href="localePath('/About')"
              @click.prevent="goTo(localePath('/About'))"
              class="block py-[23px] font-['Inter'] p-[20px] text-white text-[20px]"
            >
              {{ $t("nav.about") }}
            </a>

            <div class="h-px bg-white/10"></div>

            <a
              :href="localePath('/Projects')"
              @click.prevent="goTo(localePath('/Projects'))"
              class="block py-[23px] font-['Inter'] p-[20px] text-white text-[20px]"
            >
              {{ $t("nav.projects") }}
            </a>
            <div class="h-px bg-white/10"></div>

            <a
              :href="localePath('/ContactPage')"
              @click.prevent="goTo(localePath('/ContactPage'))"
              class="block py-[23px] font-['Inter'] p-[20px] text-white text-[20px]"
            >
              {{ $t("nav.contacts") }}
            </a>
            <div class="h-px bg-white/10"></div>

            <a
              :href="localePath('/Oneguarantee')"
              @click.prevent="goTo(localePath('/Oneguarantee'))"
              class="block py-[23px] font-['Inter'] p-[20px] text-white text-[20px]"
            >
              <span class="text-[#03CB00]">{{ $t("brand.one") }}</span>
              {{ $t("brand.oneGuaranteeSuffix") }}
            </a>

            <div class="h-px bg-white/10"></div>

            <a
              :href="localePath('/Costs')"
              @click.prevent="goTo(localePath('/Costs'))"
              class="block py-[23px] font-['Inter'] p-[20px] text-white text-[20px]"
            >
              {{ $t("nav.prices") }}
            </a>
            <div class="h-px bg-white/10"></div>

            <a
              :href="localePath('/News')"
              @click.prevent="goTo(localePath('/News'))"
              class="block py-[23px] font-['Inter'] p-[20px] text-white text-[20px]"
            >
              {{ $t("nav.news") }}
            </a>
            <div class="h-px bg-white/10"></div>

            <div>
              <div class="block py-[23px] font-['Inter'] text-white text-[20px]">
                <div class="relative w-full">
                  <button
                    type="button"
                    @click="isLangOpen = !isLangOpen"
                    class="w-full px-[20px] flex pb-[33px] items-center justify-between text-white font-['Inter'] font-normal text-[20px] leading-[18px] tracking-normal align-middle"
                  >
                    <span>{{ lang === "ru" ? "ru " : "eng" }}</span>
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
                      class="absolute left-0 right-0 top-[-100%] rounded-[20px] bg-[#FFFFFF14] backdrop-blur-md border border-white/10 overflow-hidden"
                    >
                      <button
                        type="button"
                        @click="pickLang('en')"
                        class="w-full px-[20px] py-[18px] text-start text-white font-['Inter'] font-normal text-[20px] leading-[18px] tracking-normal align-middle hover:bg-white/5"
                      >
                        en
                      </button>
                      <div class="h-px w-[70%] ml-[20px] bg-white/10"></div>
                      <button
                        type="button"
                        @click="pickLang('ru')"
                        class="w-full py-[18px] text-start px-[20px] text-white font-['Inter'] font-normal text-[20px] leading-[18px] tracking-normal align-middle hover:bg-white/5"
                      >
                        ru
                      </button>
                    </div>
                  </transition>
                </div>
                <div class="h-px bg-white/10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount, nextTick, computed } from "vue";
import HeaderServicesMenu from "~/components/HeaderServicesMenu.vue";

type AppLocale = "ru" | "en";

const isMobileMenuOpen = useState<boolean>("mobileMenuOpen", () => false);
const isLangOpen = useState<boolean>("mobileLangOpen", () => false);

const { locale } = useI18n<{ message: any }, AppLocale>();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();
const router = useRouter();
const route = useRoute();

const isIOSWebKit = () => {
  if (!process.client) return false;

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
  get: () => (locale.value as AppLocale) || "ru",
  set: async (val) => {
    const next = (val as AppLocale) || "ru";
    const target = switchLocalePath(next);

    if (!target) return;

    await navigateSafely(target, true);
  },
});

const pickLang = async (val: AppLocale) => {
  isLangOpen.value = false;
  await nextTick();
  lang.value = val;
};

const lockBodyScroll = () => {
  if (!process.client) return;

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
};

const unlockBodyScroll = () => {
  if (!process.client) return;

  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
};

watch(isMobileMenuOpen, (v) => {
  if (v) {
    lockBodyScroll();
  } else {
    unlockBodyScroll();
  }
});

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu();
  }
);

const navigateSafely = async (to: string, replace = false) => {
  if (!process.client || !to) return;

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

const removeAfterEach = router.afterEach(() => {
  closeMobileMenu();
});

onBeforeUnmount(() => {
  unlockBodyScroll();
  removeAfterEach?.();
});
</script>

<style>
/* Header type, after the design: a semibold, slightly tracked face for the
   links and the button, the wordmark larger. The design's 2000px frame has
   these px sizes; wider screens scale them up (see the 1920px block). */
.site-header {
  --nav-size: 15px;
  --logo-size: 27px;
}

.site-logo {
  flex-shrink: 0;
  color: #fff;
  font-size: var(--logo-size);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.01em;
  white-space: nowrap;
  text-decoration: none;
}

.site-logo__one {
  color: #17c93b;
}

.site-nav {
  gap: 22px;
}

.site-nav__link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: #efefef;
  font-size: var(--nav-size);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
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
  width: 168px;
  height: 34px;
  border: 1px solid rgb(64 140 52 / 0.85);
  border-radius: 40px;
  background: #000;
  color: #fff;
  font-size: var(--nav-size);
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  text-decoration: none;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.site-guarantee:hover,
.site-guarantee:focus-visible {
  border-color: #03cb00;
  box-shadow: 0 0 18px rgb(3 203 0 / 0.45);
}

.site-guarantee__one {
  color: #36c536;
}

@media (max-width: 949px) {
  .site-logo {
    margin-left: 14px;
    font-size: 26px;
  }
}

.shake-btn {
  box-shadow: 0 0 15px #03cb00;
  animation: glowBlink 3s ease-in-out infinite;
}

@keyframes glowBlink {
  0% {
    box-shadow: 0 0 35px #03cb00;
  }
  25% {
    box-shadow: 0 0 0px #03cb00;
  }
  50% {
    box-shadow: 0 0 35px #03cb00;
  }
  75% {
    box-shadow: 0 0 0px #03cb00;
  }
  100% {
    box-shadow: 0 0 35px #03cb00;
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
  .site-header {
    --logo-size: 24px;
  }

  .site-header .site-nav {
    gap: 16px;
  }
}

/* Keep the header's laptop proportions on 1920px+ monitors (sizes are px). */
@media (min-width: 1920px) {
  .site-header {
    --nav-size: clamp(15px, 0.75vw, 20px);
    --logo-size: clamp(27px, 1.35vw, 36px);
    max-width: clamp(980px, 49vw, 1300px);
    height: clamp(64px, 3.2vw, 84px);
  }

  .site-header .site-nav {
    gap: clamp(22px, 1.1vw, 30px);
  }

  .site-guarantee {
    width: clamp(168px, 8.4vw, 220px);
    height: clamp(34px, 1.7vw, 45px);
  }
}
</style>
