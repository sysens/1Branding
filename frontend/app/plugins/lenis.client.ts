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

  // Visitors who ask for reduced motion get the browser's own, unsmoothed scrolling.
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches

  const lenis = new Lenis({
    smoothWheel: !reducedMotion,
    lerp: 0.12,
    wheelMultiplier: 1,
    syncTouch: false,
    touchMultiplier: 1,
    infinite: false,
  })

  let prevFullPath = ""
  const updateScrollTrigger = () => scrollTrigger?.update()
  // Not on the critical path: sections that animate import it themselves; this
  // only keeps ScrollTrigger in sync with Lenis once the page is idle.
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
  if (idle) idle(() => void loadScrollTrigger())
  else setTimeout(() => void loadScrollTrigger(), 2000)

  // Back/forward: return to where the visitor was (vue-router keeps that in
  // history.state.scroll) instead of jumping to the top.
  let historyNavigation = false
  window.addEventListener("popstate", () => { historyNavigation = true })

  lenis.on("scroll", updateScrollTrigger)

  const raf = (time: number) => {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)

  const pageFinishHandler = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const route = nuxtApp.$router.currentRoute.value
        const routeChanged = prevFullPath !== route.fullPath

        if (routeChanged && !route.hash) {
          const saved = historyNavigation ? (window.history.state?.scroll as { top?: number } | undefined)?.top : undefined
          lenis.scrollTo(typeof saved === "number" ? saved : 0, {
            immediate: true,
            force: true,
          })
        }
        historyNavigation = false

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
