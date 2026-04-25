<template>
  <Teleport to="body">
    <div class="MainHeader headerMain relative px-[20px] min-[950px]:px-0 z-[8888]">
      <header
        ref="headerEl"
        class="site-header header isolate backdrop-blur-md z-20 bg-[#00000080]/50 max-w-[1100px] mt-[20px] min-[950px]:mt-[0px] flex min-[950px]:mx-auto p-3 border h-[76px] min-[950px]:h-[66px] mx-[20px] min-[950px]:rounded-[60px] rounde-d-[50px] border-[#03CB00] fixed min-[950px]:top-[30px] top-[10px] left-0 right-0 shadow-[0_0_25px_#03CB00] rounded-[60px] min-[950px]:shadow-none"
      >
        <div class="logoImg p-[18px] flex items-center">
          <a
            :href="localePath('/')"
            class="flex items-center"
            @click.prevent="goTo(localePath('/'))"
          >
            <img
              class="w-[72px] h-[44px] pt-1 scale-125 block"
              src="/home/logoNewwwwwwwwww.png"
              alt=""
            />
          </a>
        </div>

        <div
          class="menuLink hidden min-[950px]:flex flex-1 items-center justify-center gap-5 min-[950px]:gap-[40px]"
        >
          <a
            class="font-['Inter'] font-normal whitespace-nowrap text-white text-[18px] leading-[18px] tracking-[0] align-middle hover:text-[#03CB00]"
            :href="localePath('/About')"
            @click.prevent="goTo(localePath('/About'))"
          >
            {{ $t("nav.about") }}
          </a>

          <a
            class="font-['Inter'] font-normal text-white text-[18px] leading-[18px] tracking-[0] align-middle transition-colors duration-300 hover:text-[#03CB00]"
            :href="localePath('/Projects')"
            @click.prevent="goTo(localePath('/Projects'))"
          >
            {{ $t("nav.projects") }}
          </a>

          <a
            class="font-['Inter'] font-normal text-white text-[18px] leading-[18px] tracking-[0] align-middle transition-colors duration-300 hover:text-[#03CB00]"
            :href="localePath('/Costs')"
            @click.prevent="goTo(localePath('/Costs'))"
          >
            {{ $t("nav.prices") }}
          </a>

          <a
            class="font-['Inter'] font-normal text-white text-[18px] leading-[18px] tracking-[0] align-middle transition-colors duration-300 hover:text-[#03CB00]"
            :href="localePath('/News')"
            @click.prevent="goTo(localePath('/News'))"
          >
            {{ $t("nav.news") }}
          </a>

          <a
            class="font-['Inter'] font-normal text-white text-[18px] leading-[18px] tracking-[0] align-middle transition-colors duration-300 hover:text-[#03CB00]"
            :href="localePath('/ContactPage')"
            @click.prevent="goTo(localePath('/ContactPage'))"
          >
            {{ $t("nav.contacts") }}
          </a>

          <div class="relative">
            <button
              type="button"
              @click="isLangOpen = !isLangOpen"
              class="font-['Inter'] font-normal text-[18px] leading-[18px] tracking-normal align-middle bg-transparent text-white cursor-pointer flex items-center gap-2 transition-colors duration-300 hover:text-[#03CB00]"
            >
              <span>{{ lang === "ru" ? "ru" : "en" }}</span>
              <svg
                class="w-4 h-4 transition-transform duration-200"
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
                class="absolute left-1/2 -translate-x-1/2 top-[48px] w-[65px] h-[106px] rounded-[20px] bg-[#0B0B0B]/95 backdrop-blur-md border border-white/10 overflow-hidden"
              >
                <button
                  type="button"
                  @click="pickLang('en')"
                  class="w-full pt-7 text-center text-white font-['Inter'] transition font-normal text-[18px] leading-[18px] tracking-normal align-middle duration-300 hover:text-[#03CB00]"
                >
                  en
                </button>
                <button
                  type="button"
                  @click="pickLang('ru')"
                  class="w-full pt-5 text-center text-white font-['Inter'] transition font-normal text-[18px] leading-[18px] tracking-normal align-middle duration-300 hover:text-[#03CB00]"
                >
                  ru
                </button>
              </div>
            </transition>
          </div>
        </div>

        <div
          class="bg-[url('/header/Ellipse (2).png')] bg-center bg-cover hidden min-[950px]:block"
        >
          <div class="OneGuarantee flex justify-end">
            <a
              :href="localePath('/Oneguarantee')"
              class="shake-btn w-[190px] h-[52px] min-[950px]:h-[40px] flex items-center justify-center border border-[#03CB00] bg-[#00000080] text-white rounded-[40px]"
              @click.prevent="goTo(localePath('/Oneguarantee'))"
            >
              <span class="font-['Inter'] font-normal text-[18px] leading-[120%]">
                <span class="text-[#03CB00]">{{ $t("brand.one") }}</span>
                {{ $t("brand.oneGuaranteeSuffix") }}
              </span>
            </a>
          </div>
        </div>

        <div class="flex-1 relative block min-[950px]:hidden">
          <div
            class="absolute inset-0 bg-[url('/header/Ellipse (2).png')] bg-center bg-cover z-0"
          ></div>

          <div class="toggleButton oneGuarantee relative flex z-[111] justify-end">
            <button
              @click="isMobileMenuOpen = true"
              class="w-[54px] h-[52px] flex items-center justify-center border border-[#03CB00] bg-[#00000080] rounded-[40px] shadow-[0_0_15px_#03CB00]"
            >
              <img class="w-[24px] h-auto" src="/header/Vector (13).png" alt="" />
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
              <img class="w-[72px] h-auto" src="/header/headerlogo.jpg" alt="" />
            </a>

            <button
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
              :href="localePath('/OneGuarantee')"
              @click.prevent="goTo(localePath('/OneGuarantee'))"
              class="block py-[23px] font-['Inter'] p-[20px] text-white text-[20px]"
            >
              {{ $t("brand.one") }}
              <span class="text-[#03CB00]">{{ $t("brand.oneGuaranteeSuffix") }}</span>
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
import { watch, onMounted, onBeforeUnmount, nextTick, computed } from "vue";

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

let ctx: any = null;

onMounted(async () => {
  await nextTick();

  const { gsap } = await import("gsap");

  ctx = gsap.context(() => {
    const header = document.querySelector(".site-header");
    if (!header) return;

    gsap.fromTo(
      header,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: "power3.out" }
    );
  });
});

onBeforeUnmount(() => {
  unlockBodyScroll();
  removeAfterEach?.();
  ctx?.revert();
  ctx = null;
});
</script>

<style>
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
</style>
