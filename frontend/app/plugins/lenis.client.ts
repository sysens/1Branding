import Lenis from "lenis"

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  const lenis = new Lenis({
    smoothWheel: true,
    lerp: 0.05,
    wheelMultiplier: 0.6,
    syncTouch: true,
    touchMultiplier: 1,
    infinite: false,
  })

  let rafId = 0
  let prevFullPath = ""

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
      })
    })
  }

  nuxtApp.hook("page:finish", pageFinishHandler)

  return {
    provide: { lenis }
  }
})
