import Lenis from "lenis"

// ScrollTrigger is loaded on demand: a static import here pulled GSAP and
// ScrollTrigger (~40 KB compressed) into the entry chunk, i.e. into the
// critical path of every page, while the sections using them import it lazily.
// Until it has loaded there are no triggers to update or refresh.
type ScrollTriggerApi = typeof import("gsap/ScrollTrigger").ScrollTrigger
let scrollTrigger: ScrollTriggerApi | null = null
const loadScrollTrigger = () => import("gsap/ScrollTrigger").then((module) => { scrollTrigger = module.ScrollTrigger })

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  const lenis = new Lenis({
    smoothWheel: true,
    lerp: 0.12,
    wheelMultiplier: 1,
    syncTouch: false,
    touchMultiplier: 1,
    infinite: false,
  })

  let rafId = 0
  let prevFullPath = ""
  const updateScrollTrigger = () => scrollTrigger?.update()
  void loadScrollTrigger()

  lenis.on("scroll", updateScrollTrigger)

  const raf = (time: number) => {
    lenis.raf(time)
    rafId = requestAnimationFrame(raf)
  }

  rafId = requestAnimationFrame(raf)

  const pageFinishHandler = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const route = nuxtApp.$router.currentRoute.value
        const routeChanged = prevFullPath !== route.fullPath

        if (routeChanged && !route.hash) {
          lenis.scrollTo(0, {
            immediate: true,
            force: true,
          })
        }

        prevFullPath = route.fullPath
        lenis.resize()
        scrollTrigger?.refresh()
      })
    })
  }

  nuxtApp.hook("page:finish", pageFinishHandler)

  return {
    provide: { lenis }
  }
})
