import Lenis from "lenis"
import { pendingLazySectionsOnScreen } from "~/utils/lazySections"
import { VIEW_TRANSITION_CLASS, VIEW_TRANSITION_END } from "~/utils/viewTransition"

// ScrollTrigger is loaded on demand: a static import here pulled GSAP and
// ScrollTrigger (~40 KB compressed) into the entry chunk, i.e. into the
// critical path of every page, while the sections using them import it lazily.
// Until it has loaded there are no triggers to update or refresh.
type ScrollTriggerApi = typeof import("gsap/ScrollTrigger").ScrollTrigger
let scrollTrigger: ScrollTriggerApi | null = null
const loadScrollTrigger = () => import("gsap/ScrollTrigger").then((module) => {
  scrollTrigger = module.ScrollTrigger
  // On a phone the window's height changes every time the browser's bars hide
  // or show; recalculating every trigger for that made scrubbed sections jump.
  scrollTrigger.config({ ignoreMobileResize: true })
})

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  // Visitors who ask for reduced motion get the browser's own, unsmoothed scrolling.
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches

  // A calmer wheel than the browser's own (80px a notch, eased a little
  // longer), so the scroll-driven sections can be followed rather than run past.
  const lenis = new Lenis({
    smoothWheel: !reducedMotion,
    lerp: 0.1,
    wheelMultiplier: 0.8,
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

  // Reload (and a full-page back/forward) puts the page back where it was.
  // The position is kept in two places:
  // - sessionStorage, per address, written on every scroll: it survives a
  //   reload and is up to date to the last frame, even for a reload pressed
  //   while the page is still moving. (history.state alone was written only
  //   250 ms after a scroll settled, since browsers limit how often
  //   replaceState may run, and Chrome drops history changes made while the
  //   page unloads; a quick F5 then restored an older spot, or none.)
  // - history.state.scroll, a moment after each scroll settles: the router
  //   uses it for back/forward within the app, where each entry needs its own.
  // A reload takes the sessionStorage value; a back/forward the entry's own.
  // The head script (nuxt.config.ts, restoreScrollScript) reads them the same
  // way. While it is still putting the page back, scrollY is not the visitor's
  // position yet, so nothing is saved then.
  const root = document.documentElement
  const storageKey = () => `ob-scroll:${location.pathname}${location.search}`
  const restoringNow = () => root.classList.contains("ob-restoring")
  const saveToStorage = () => {
    if (restoringNow()) return
    try {
      sessionStorage.setItem(storageKey(), String(Math.round(window.scrollY)))
    } catch { /* storage unavailable (private mode, quota): history.state still has it */ }
  }
  const saveScroll = () => {
    if (restoringNow()) return
    try {
      window.history.replaceState({ ...window.history.state, scroll: { left: window.scrollX, top: window.scrollY } }, "")
    } catch { /* history unavailable: the page starts at the top */ }
  }
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  window.addEventListener("scroll", () => {
    saveToStorage()
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveScroll, 250)
  }, { passive: true })
  window.addEventListener("pagehide", () => {
    saveToStorage()
    saveScroll()
  })
  const savedOnLoad = (): number | undefined => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
    if (navigation?.type !== "reload" && navigation?.type !== "back_forward") return undefined
    const fromHistory = (window.history.state?.scroll as { top?: number } | undefined)?.top
    let fromStorage: number | undefined
    try {
      const stored = sessionStorage.getItem(storageKey())
      if (stored !== null && Number.isFinite(Number(stored))) fromStorage = Number(stored)
    } catch { /* storage unavailable */ }
    return navigation.type === "reload" ? fromStorage ?? fromHistory : fromHistory ?? fromStorage
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
  // Shows the page the head script hid for a reload (nuxt.config.ts,
  // restoreScrollScript) once the position is final and the sections on screen
  // show their state for it, not their first state: the lazily hydrated ones
  // there have run their script (utils/lazySections.ts; at most 1.5 s), and two
  // more frames pass, as scroll-driven sections redraw on the frame after a
  // scroll.
  const reveal = () => {
    if (!root.classList.contains("ob-restoring")) return
    const started = performance.now()
    const whenSectionsReady = () => {
      if (pendingLazySectionsOnScreen() > 0 && performance.now() - started < 1500) {
        requestAnimationFrame(whenSectionsReady)
        return
      }
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("ob-restoring")))
    }
    requestAnimationFrame(whenSectionsReady)
  }
  const restoreTo = (top: number, triesLeft = 20) => {
    if (userScrolled) return reveal()
    lenis.scrollTo(top, { immediate: true, force: true })
    if (Math.abs(window.scrollY - top) > 2 && triesLeft > 0) {
      setTimeout(() => restoreTo(top, triesLeft - 1), 100)
    } else {
      reveal()
    }
  }

  lenis.on("scroll", updateScrollTrigger)

  const raf = (time: number) => {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)

  // A page change runs as a view transition (nuxt.config.ts): the browser
  // takes its picture of the new page as soon as page:finish lets it, so the
  // scroll has to be in place right then, not two frames later, or the
  // picture shows the new page at the old position and it jumps at the end.
  // <html> is marked while it runs, and its end announced, for animations
  // that should wait for it (utils/viewTransition.ts).
  let viewTransition = false
  nuxtApp.hook("page:view-transition:start", (transition) => {
    viewTransition = true
    root.classList.add(VIEW_TRANSITION_CLASS)
    transition.finished.finally(() => {
      viewTransition = false
      lenis.resize()
      scrollTrigger?.refresh()
      root.classList.remove(VIEW_TRANSITION_CLASS)
      window.dispatchEvent(new Event(VIEW_TRANSITION_END))
    })
  })

  // Behind the two pages (assets/css/tailwind.css, ::view-transition) shows
  // the new page's own colour at the top of the screen, where it is still
  // rising into place: the background of the first full-width thing there
  // (cards, pictures and the floating header are narrower and skipped).
  const transparent = (color: string) => color === "transparent" || /rgba\(.*,\s*0\)$/.test(color)
  const newPageTop = () => {
    for (const x of [innerWidth / 2, 8]) {
      for (const element of document.elementsFromPoint(x, 4)) {
        if (element.getBoundingClientRect().width < innerWidth * 0.9) continue
        const color = getComputedStyle(element).backgroundColor
        if (!transparent(color)) return color
      }
    }
    return ""
  }

  const pageFinishHandler = () => {
    if (viewTransition) {
      settlePage()
      const color = newPageTop()
      if (color) root.style.setProperty("--ob-page-behind", color)
      else root.style.removeProperty("--ob-page-behind")
      return
    }
    requestAnimationFrame(() => requestAnimationFrame(settlePage))
  }

  function settlePage() {
    const route = nuxtApp.$router.currentRoute.value
    const routeChanged = prevFullPath !== route.fullPath
    let restoring = false

    if (routeChanged && !route.hash) {
      const saved = firstLoad
        ? restoreOnLoad
        : historyNavigation ? (window.history.state?.scroll as { top?: number } | undefined)?.top : undefined
      userScrolled = false
      if (typeof saved === "number" && saved > 0) {
        restoring = true
        restoreTo(saved)
      } else if (!firstLoad || saved === 0) {
        lenis.scrollTo(0, {
          immediate: true,
          force: true,
        })
      }
      // The first page with nothing saved stays where the browser put it:
      // the top for a new visit, the browser's own restore for a reload.
      // (Forcing the top here sent a reload pressed mid-scroll to the top.)
    }
    // restoreTo shows the page itself once the position is final.
    if (!restoring) reveal()
    historyNavigation = false
    firstLoad = false

    prevFullPath = route.fullPath
    lenis.resize()
    scrollTrigger?.refresh()
  }

  nuxtApp.hook("page:finish", pageFinishHandler)

  return {
    provide: { lenis }
  }
})
