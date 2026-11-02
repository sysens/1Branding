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

  // Back/forward within the app: return to where the visitor was (vue-router
  // keeps that in history.state.scroll) instead of jumping to the top.
  let historyNavigation = false
  window.addEventListener("popstate", () => { historyNavigation = true })

  // Reload (and a full-page back/forward): the router's first navigation uses
  // history.state.scroll as the saved position and otherwise scrolls to the
  // top, but nothing wrote it before the page was left, so a reload jumped to
  // the top. It is written a moment after each scroll settles (Chrome drops
  // history changes made while the page is unloading; browsers also limit how
  // often replaceState may run) and again on pagehide; the browser keeps
  // history.state across a reload, so the router puts the page straight back.
  const saveScroll = () => {
    try {
      window.history.replaceState({ ...window.history.state, scroll: { left: window.scrollX, top: window.scrollY } }, "")
    } catch { /* history unavailable: the page starts at the top */ }
  }
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  window.addEventListener("scroll", () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveScroll, 250)
  }, { passive: true })
  window.addEventListener("pagehide", saveScroll)
  const savedOnLoad = (): number | undefined => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
    if (navigation?.type !== "reload" && navigation?.type !== "back_forward") return undefined
    return (window.history.state?.scroll as { top?: number } | undefined)?.top
  }
  let firstLoad = true
  const restoreOnLoad = savedOnLoad()

  // Sections further down may still be filling in when the page finishes, so
  // the saved spot can be past the end for a moment: retry for up to ~2s, and
  // stop as soon as the visitor scrolls on their own.
  let userScrolled = false
  const markUserScroll = () => { userScrolled = true }
  for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
    window.addEventListener(type, markUserScroll, { passive: true })
  }
  const restoreTo = (top: number, triesLeft = 20) => {
    if (userScrolled) return
    lenis.scrollTo(top, { immediate: true, force: true })
    if (Math.abs(window.scrollY - top) > 2 && triesLeft > 0) {
      setTimeout(() => restoreTo(top, triesLeft - 1), 100)
    }
  }

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
          const saved = firstLoad
            ? restoreOnLoad
            : historyNavigation ? (window.history.state?.scroll as { top?: number } | undefined)?.top : undefined
          userScrolled = false
          if (typeof saved === "number" && saved > 0) {
            restoreTo(saved)
          } else {
            lenis.scrollTo(0, {
              immediate: true,
              force: true,
            })
          }
        }
        historyNavigation = false
        firstLoad = false

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
